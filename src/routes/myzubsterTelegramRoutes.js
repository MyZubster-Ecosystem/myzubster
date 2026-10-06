'use strict';
const express = require('express');
const { answer } = require('../services/zorgaxAssistantService');
const router = express.Router();

function token(){ return process.env.TELEGRAM_BOT_TOKEN; }
function configured(){ return Boolean(token()); }
function api(method){ if(!token()) throw new Error('TELEGRAM_BOT_TOKEN non configurato'); return `https://api.telegram.org/bot${token()}/${method}`; }
async function call(method,payload={}){ const r=await fetch(api(method),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const d=await r.json().catch(()=>({})); if(!r.ok||d.ok===false) throw new Error(d.description||`Telegram API ${r.status}`); return d; }
function webhookUrl(){ return process.env.MYZUBSTER_TELEGRAM_WEBHOOK_URL || 'https://www.myzubster.com/api/telegram/myzubster/webhook'; }
function normalize(text){ return String(text||'').trim().split(/\s+/)[0].toLowerCase().replace(/@[^\s]+$/,''); }
function reply(command){ switch(command){
 case '/start': case '/help': return ['🌐 MyZubster Bot + Zorgax AI','','Puoi usare i comandi oppure scrivermi normalmente: Zorgax risponderà alla tua domanda.','','/status - stato MyZubster','/github - repository e contributi','/marketplace - marketplace e seller','/party - Party Mode e community','/life - progetto LIFE','/zorgax - assistente Zorgax','/help - comandi disponibili'].join('\n');
 case '/status': return '✅ MyZubster è online. Bot Telegram collegato al backend di produzione e a Zorgax AI.';
 case '/github': return '💻 GitHub\n\nMyZubster è sviluppato pubblicamente nell’organizzazione MyZubster-Ecosystem. Le notifiche automatiche GitHub continuano a usare questo bot.';
 case '/marketplace': return '🛒 Marketplace\n\nMyZubster include strumenti marketplace e seller. Usa myzubster.com per le funzionalità pubbliche disponibili.';
 case '/party': return '🔊 Party Mode\n\nArea community/eventi collegata all’ecosistema MyZubster. Informazioni pubblicate nel rispetto di autorizzazioni, sicurezza, welfare e privacy.';
 case '/life': return '🌱 LIFE\n\nArea MyZubster dedicata ai progetti LIFE, inclusione, comunità e sperimentazioni documentate.';
 case '/zorgax': return '🤖 Zorgax AI è collegato a questo bot. Scrivi direttamente una domanda in linguaggio naturale, senza usare un comando.';
 default: return null; }}
function aiText(result){ return String(result?.answer||result?.text||result?.response||result?.message||'').trim(); }
async function askZorgax(message){ const result=await answer({message,useWeb:false,history:[],limit:1}); const text=aiText(result); if(!text) throw new Error('Zorgax ha restituito una risposta vuota'); return text.slice(0,4000); }
async function register(){ const url=webhookUrl(); const secret=process.env.MYZUBSTER_TELEGRAM_WEBHOOK_SECRET||undefined; const set=await call('setWebhook',{url,allowed_updates:['message','edited_message'],drop_pending_updates:false,...(secret?{secret_token:secret}:{})}); const info=await call('getWebhookInfo'); const actual=info.result?.url||''; return {verified:set.result===true&&actual===url,url:actual,pending:info.result?.pending_update_count||0,lastError:info.result?.last_error_message||null}; }
router.get('/status',async(_req,res)=>{ const base={ok:true,service:'myzubster-telegram-bot',configured:configured(),zorgaxAI:true,webhookUrl:webhookUrl()}; if(!configured()) return res.json({...base,webhookVerified:false}); try{ const v=await register(); console.info('[myzubster-telegram]',JSON.stringify({event:'webhook_registration',...v})); return res.status(v.verified?200:502).json({...base,webhookVerified:v.verified,telegramWebhookUrl:v.url,pendingUpdateCount:v.pending,lastError:v.lastError}); }catch(e){ console.error('[myzubster-telegram]',e.message); return res.status(502).json({...base,webhookVerified:false,error:'Registrazione webhook Telegram fallita'}); }});
router.post('/webhook',async(req,res)=>{ const expected=process.env.MYZUBSTER_TELEGRAM_WEBHOOK_SECRET; if(expected&&req.get('x-telegram-bot-api-secret-token')!==expected) return res.status(401).json({ok:false,error:'Webhook secret non valido'}); const m=req.body?.message||req.body?.edited_message; const chatId=m?.chat?.id; const raw=String(m?.text||'').trim(); if(!chatId||!raw) return res.status(200).json({ok:true,ignored:true}); if(!configured()) return res.status(503).json({ok:false,error:'Bot non configurato'}); const command=normalize(raw); try{ let text=reply(command); let mode='command'; if(!text&&!raw.startsWith('/')){ mode='zorgax'; await call('sendChatAction',{chat_id:chatId,action:'typing'}); text=await askZorgax(raw); } if(!text) text='Comando non riconosciuto. Usa /help oppure scrivimi una domanda normalmente.'; await call('sendMessage',{chat_id:chatId,text,disable_web_page_preview:true}); console.info('[myzubster-telegram]',JSON.stringify({event:'message_handled',mode,command:raw.startsWith('/')?command:null,chatType:m?.chat?.type||null})); return res.json({ok:true,handled:true,mode}); }catch(e){ console.error('[myzubster-telegram]',e.message); try{ await call('sendMessage',{chat_id:chatId,text:'🤖 Zorgax è temporaneamente non disponibile. Riprova tra poco o usa /help.'}); }catch(_e){} return res.status(200).json({ok:true,handled:false,aiError:true}); }});
module.exports=router;
module.exports._test={normalize,reply,webhookUrl,aiText};
