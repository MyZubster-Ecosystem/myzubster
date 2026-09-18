const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { selectModel, estimateAstraCost } = require('./aiModelRouter');
const { getAstraMonthlySpend, recordAstraUsage, reserveAstraBudget, settleAstraBudget, releaseAstraBudget } = require('./zorgaxAIUsageService');

const DEFAULT_GATEWAY = 'https://myzubster-gateway.vercel.app';
const MAX_SOURCES = 8;
const OPENAI_MAX_INPUT_CHARS = 24000;
const OPENAI_MAX_OUTPUT_TOKENS = Math.max(256, Math.min(Number(process.env.ZORGAX_ASTRA_MAX_OUTPUT_TOKENS) || 2048, 8192));
const OPENAI_MAX_RETRY_DELAY_MS = 1500;
const OPENAI_QUOTA_CODES = new Set(['credit_balance_exhausted','organization_usage_limit_exceeded','organization_spend_limit_exceeded','project_spend_limit_exceeded']);

function clampLimit(value, fallback = 5) { return Math.max(1, Math.min(Number(value) || fallback, MAX_SOURCES)); }
function cleanText(value, max = 6000) { return String(value || '').trim().slice(0, max); }
function dataIntent(text) { return /\b(salva|inserisci|registra|memorizza|aggiungi\s+(?:quest[oi]|dato|dati)|immetti)\b/i.test(String(text || '')); }
function kefirIntent(text) { return /\b(kefir|grani\s+di\s+kefir|kefir\s+grains|water\s+kefir|milk\s+kefir|kefir\s+d['’]?acqua|kefir\s+di\s+latte|fermentazion|fermented\s+food|siero\s+di\s+kefir)\b/i.test(String(text || '')); }
function inferCategory(text) { const value=String(text||'').toLowerCase(); if(/kefir|fermentazion|fermented food|siero di kefir/.test(value))return'circular-food'; if(/orto|pianta|semina|raccolto|terreno/.test(value))return'garden'; if(/robot|sensore|motore|elettronica/.test(value))return'robotics'; if(/lavoro|competenz|skill|candidato/.test(value))return'skills'; if(/ambiente|acqua|aria|suolo|temperatura|umidit/.test(value))return'environment'; if(/spesa|costo|prezzo|componente|pezzo/.test(value))return'procurement'; return'general'; }
function stableJson(value){if(Array.isArray(value))return`[${value.map(stableJson).join(',')}]`;if(value&&typeof value==='object')return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;return JSON.stringify(value);}
function digestPreview(preview){return crypto.createHash('sha256').update(stableJson(preview)).digest('hex');}
function previewData(input){const raw=cleanText(input,12000);if(!raw)throw new Error('Dati mancanti');let parsed=null;try{parsed=JSON.parse(raw);}catch(_){}const preview={category:inferCategory(raw),title:raw.replace(/\s+/g,' ').slice(0,100)||'Dato inserito con Zorgax',data:parsed&&typeof parsed==='object'?parsed:{notes:raw},source:'zorgax_user_confirmed'};const digest=digestPreview(preview);return{preview,digest,confirmation:`CONFERMA ${digest.slice(0,8)}`,persistent_write_performed:false};}
async function braveSearch(query,limit){const key=process.env.BRAVE_SEARCH_API_KEY;if(!key)return[];const url=new URL('https://api.search.brave.com/res/v1/web/search');url.searchParams.set('q',query);url.searchParams.set('count',String(limit));const response=await fetch(url,{headers:{Accept:'application/json','X-Subscription-Token':key}});if(!response.ok)throw new Error(`Brave Search HTTP ${response.status}`);const json=await response.json();return(json.web?.results||[]).slice(0,limit).map((item,index)=>({label:`B${index+1}`,provider:'brave',title:item.title,url:item.url,snippet:cleanText(item.description,700)}));}
async function tavilySearch(query,limit){const key=process.env.TAVILY_API_KEY;if(!key)return[];const response=await fetch('https://api.tavily.com/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:key,query,max_results:limit,search_depth:'advanced',include_answer:false})});if(!response.ok)throw new Error(`Tavily HTTP ${response.status}`);const json=await response.json();return(json.results||[]).slice(0,limit).map((item,index)=>({label:`T${index+1}`,provider:'tavily',title:item.title,url:item.url,snippet:cleanText(item.content,700)}));}
async function wikipediaSearch(query,limit){const url=new URL('https://en.wikipedia.org/w/api.php');url.searchParams.set('action','query');url.searchParams.set('generator','search');url.searchParams.set('gsrsearch',query);url.searchParams.set('gsrlimit',String(limit));url.searchParams.set('prop','extracts|info');url.searchParams.set('inprop','url');url.searchParams.set('exintro','1');url.searchParams.set('explaintext','1');url.searchParams.set('format','json');url.searchParams.set('origin','*');const response=await fetch(url,{headers:{'User-Agent':'MyZubster-Zorgax/1.0'}});if(!response.ok)throw new Error(`Wikipedia HTTP ${response.status}`);const json=await response.json();return Object.values(json.query?.pages||{}).slice(0,limit).map((item,index)=>({label:`W${index+1}`,provider:'wikipedia',title:item.title,url:item.fullurl,snippet:cleanText(item.extract,700)}));}
function looksTimeSensitive(text){return /\b(today|tonight|current|currently|latest|news|recent|now|oggi|stasera|attuale|attualmente|ultim[oaie]|notizie|recente|ora|adesso|president|prime minister|pope|papa|election|elezioni|price|prezzo|market|mercato)\b/i.test(String(text||''));}
async function googleNewsSearch(){return[];}
async function searchWeb(query,requestedLimit=5){const cleanQuery=cleanText(query,500);if(!cleanQuery)return{query:'',sources:[],errors:[],live_search_available:false,providers_used:[]};const limit=clampLimit(requestedLimit);const errors=[];const groups=await Promise.all([braveSearch(cleanQuery,limit).catch(e=>{errors.push(e.message);return[];}),tavilySearch(cleanQuery,limit).catch(e=>{errors.push(e.message);return[];}),wikipediaSearch(cleanQuery,Math.min(limit,4)).catch(e=>{errors.push(e.message);return[];})]);const seen=new Set();const sources=groups.flat().filter(s=>{if(!s.url||seen.has(s.url))return false;seen.add(s.url);return true;}).slice(0,limit);return{query:cleanQuery,sources,errors,live_search_available:sources.length>0,providers_used:[...new Set(sources.map(s=>s.provider).filter(Boolean))]};}

function loadZorgaxPersona(){try{return fs.readFileSync(path.join(process.cwd(),'agents','zorgax','SYSTEM_PROMPT.md'),'utf8');}catch(_){return 'You are Zorgax, the MyZubster product copilot. MyZubster is a live evolving open-source ecosystem. Be concise, product-first, and guide users to Marketplace, Seller, Metaverse, LIFE Pilot, or Community.';}}
function loadKefirModule(){try{return fs.readFileSync(path.join(process.cwd(),'agents','zorgax','KEFIR_ASSISTANT.md'),'utf8');}catch(_){return '';}}

function extractOpenAIText(json){
  if(typeof json?.output_text==='string') return json.output_text;
  return (json?.output||[]).flatMap(item=>item?.content||[]).filter(part=>part?.type==='output_text').map(part=>part.text||'').join('');
}
function openAIErrorInfo(response,json){
  const code=cleanText(json?.error?.code,120)||null;
  const type=cleanText(json?.error?.type,120)||null;
  const requestId=response.headers?.get?.('x-request-id')||null;
  const retryAfterSeconds=Number(response.headers?.get?.('retry-after'));
  return{status:response.status,code,type,requestId,retryAfterMs:Number.isFinite(retryAfterSeconds)&&retryAfterSeconds>=0?Math.ceil(retryAfterSeconds*1000):null};
}
function openAIFallbackReason(info={}){
  if(OPENAI_QUOTA_CODES.has(info.code))return`openai_${info.code}`;
  if(info.type==='insufficient_quota')return'openai_insufficient_quota';
  if(info.status===429)return info.code?`openai_${info.code}`:'openai_rate_limit';
  return info.status?`openai_http_${info.status}`:'openai_error';
}
function makeOpenAIError(info){
  const error=new Error(`OpenAI HTTP ${info.status}${info.code?` (${info.code})`:''}`);
  Object.assign(error,info,{fallbackReason:openAIFallbackReason(info)});
  return error;
}
function isRetryableOpenAIError(error){
  return error?.status===429&&!OPENAI_QUOTA_CODES.has(error?.code)&&error?.type!=='insufficient_quota';
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function callOpenAI({model,input}){
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,input,max_output_tokens:OPENAI_MAX_OUTPUT_TOKENS})});
  const json=await response.json().catch(()=>({}));
  if(!response.ok)throw makeOpenAIError(openAIErrorInfo(response,json));
  return{json,model,requestId:json.id||response.headers?.get?.('x-request-id')||null};
}
async function askOpenAI(message,sources=[],history=[],reservationUsd=0){
  if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
  const sourceContext=sources.length?`\n\nFONTI WEB RECUPERATE:\n${sources.map(s=>`[${s.label}] ${s.title}\n${s.url}\n${s.snippet}`).join('\n\n')}`:'';
  const persona=loadZorgaxPersona();
  const input=`${persona}\n\nUSER MESSAGE:\n${cleanText(message)}${sourceContext}`;
  const primaryModel=process.env.ZORGAX_ASTRA_MODEL||'gpt-5.6-sol';
  const secondaryModel=process.env.ZORGAX_ASTRA_FALLBACK_MODEL||'gpt-5.6-luna';
  const models=[...new Set([primaryModel,secondaryModel].filter(Boolean))];
  let lastError=null;
  for(let modelIndex=0;modelIndex<models.length;modelIndex+=1){
    const model=models[modelIndex];
    const maxAttempts=modelIndex===0?2:1;
    for(let attempt=0;attempt<maxAttempts;attempt+=1){
      try{
        const result=await callOpenAI({model,input});
        const usage=await recordAstraUsage({inputTokens:Number(result.json.usage?.input_tokens)||0,outputTokens:Number(result.json.usage?.output_tokens)||0,requestId:result.requestId,model});
        await settleAstraBudget({reservedUsd:reservationUsd,actualUsd:Number(usage.costUsd)||0});
        return{text:extractOpenAIText(result.json),model};
      }catch(error){
        lastError=error;
        console.warn('[zorgax-openai-attempt]',JSON.stringify({status:error.status||null,code:error.code||null,type:error.type||null,requestId:error.requestId||null,model,attempt:attempt+1,fallbackReason:error.fallbackReason||'openai_error'}));
        if(OPENAI_QUOTA_CODES.has(error.code)||error.type==='insufficient_quota')throw error;
        const canRetry=isRetryableOpenAIError(error)&&attempt+1<maxAttempts;
        if(!canRetry)break;
        if(error.retryAfterMs!=null&&error.retryAfterMs>OPENAI_MAX_RETRY_DELAY_MS)break;
        const delay=error.retryAfterMs!=null?error.retryAfterMs:Math.min(500*(2**attempt),OPENAI_MAX_RETRY_DELAY_MS);
        await sleep(delay);
      }
    }
  }
  throw lastError||new Error('OpenAI request failed');
}

async function askGeneralAI(message,sources=[],history=[],webRequested=false){
  const gateway=String(process.env.ZORGAX_PUBLIC_AI_URL||DEFAULT_GATEWAY).replace(/\/$/,'');
  const sourceContext=sources.length?`\n\nFONTI WEB RECUPERATE:\n${sources.map(s=>`[${s.label}] ${s.title}\n${s.url}\n${s.snippet}`).join('\n\n')}`:'';
  const persona=loadZorgaxPersona();
  const kefirContext=kefirIntent(message)?`\n\nACTIVE SPECIALIST MODE: KEFIR / CIRCULAR FOOD\n${loadKefirModule()}`:'';
  const runtime=`\n\nRUNTIME PRODUCT FACTS:\n- myzubster.com is a public live web interface. Never claim MyZubster is unpublished, local-only, or repository-only.\n- Current user paths include Marketplace, Seller through Marketplace, Metaverse, LIFE Pilot, Community/login and open-source contribution.\n- MYZ is internal accounting/reward; it is distinct from commercial Marketplace/Seller payment flows.\n- For newcomer questions, lead with what the user can do now. Keep the answer concise and finish with concrete next actions.\n- Do not lead with architecture, IPFS, bounty mechanics, personal identities or long MVP disclaimers unless asked.`;
  const prompt=`${persona}${runtime}${kefirContext}\n\nUSER MESSAGE:\n${cleanText(message)}${sourceContext}`;
  const response=await fetch(`${gateway}/api/zargox/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:prompt,useWeb:false,history:Array.isArray(history)?history.slice(-12):[]})});
  const json=await response.json().catch(()=>({}));if(!response.ok)throw new Error(`AI gateway HTTP ${response.status}`);return json.response||json.message||json.answer||'';
}
async function answer({message,useWeb=true,history=[],limit=5}){const text=cleanText(message);if(!text)throw new Error('Messaggio mancante');if(dataIntent(text)){const dataPreview=previewData(text.replace(/^.*?\b(?:salva|inserisci|registra|memorizza|immetti)\b\s*/i,''));return{response:`Ho preparato l'anteprima dei dati. Non ho salvato nulla. Per renderli persistenti devi confermare esplicitamente con: ${dataPreview.confirmation}`,data_preview:dataPreview,action_required:'human_confirmation',sources:[]};}const research=useWeb?await searchWeb(text,limit):{query:text,sources:[],errors:[],live_search_available:false,providers_used:[]};const astraSpentUsd=await getAstraMonthlySpend().catch(()=>0);const route=selectModel({message:text,useResearch:useWeb,astraSpentUsd});let response;if(route.provider==='openai'){const worstCaseInputTokens=Buffer.byteLength(cleanText(`${loadZorgaxPersona()}\n\nUSER MESSAGE:\n${text}${research.sources.length?`\n\nFONTI WEB RECUPERATE:\n${research.sources.map(s=>`[${s.label}] ${s.title}\n${s.url}\n${s.snippet}`).join('\n\n')}`:''}`,OPENAI_MAX_INPUT_CHARS),'utf8');const worstCaseUsd=estimateAstraCost({inputTokens:worstCaseInputTokens,outputTokens:OPENAI_MAX_OUTPUT_TOKENS,model:route.model});const configuredReserve=Math.max(0,Number(process.env.ZORGAX_ASTRA_REQUEST_RESERVE_USD)||1);const reservationUsd=Math.max(configuredReserve,worstCaseUsd);const reservation=reservationUsd<=route.remainingBudgetUsd?await reserveAstraBudget({amountUsd:reservationUsd,budgetUsd:route.budgetUsd}):null;if(!reservation){route.fallbackReason='budget_reservation_failed';route.provider='ollama';route.model=process.env.OLLAMA_MODEL||'qwen2.5:3b';response=await askGeneralAI(text,research.sources,history,useWeb);}else{try{const openaiResult=await askOpenAI(text,research.sources,history,reservationUsd);response=openaiResult.text;route.model=openaiResult.model;}catch(error){await releaseAstraBudget({reservedUsd:reservationUsd}).catch(()=>{});console.error('[zorgax-openai-fallback]',JSON.stringify({status:error.status||null,code:error.code||null,type:error.type||null,requestId:error.requestId||null,fallbackReason:error.fallbackReason||'openai_error'}));response=await askGeneralAI(text,research.sources,history,useWeb);route.fallbackReason=error.fallbackReason||'openai_error';route.provider='ollama';route.model=process.env.OLLAMA_MODEL||'qwen2.5:3b';}}}else{response=await askGeneralAI(text,research.sources,history,useWeb);}return{response,ai_provider:route.provider,ai_model:route.model,ai_budget_remaining_usd:route.remainingBudgetUsd,ai_fallback_reason:route.fallbackReason||null,sources:research.sources,search_errors:research.errors,web_research_requested:Boolean(useWeb),web_research_available:Boolean(research.live_search_available),web_providers_used:research.providers_used,specialist_mode:kefirIntent(text)?'kefir-circular-food':null,action_required:null};}
module.exports={answer,searchWeb,previewData,digestPreview,dataIntent,kefirIntent,inferCategory,looksTimeSensitive,googleNewsSearch,openAIFallbackReason};
