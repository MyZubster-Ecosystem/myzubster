'use strict';
const express = require('express');
const router = express.Router();

function token(){ return process.env.TELEGRAM_BOT_TOKEN; }
function configured(){ return Boolean(token()); }
function api(method){ if(!token()) throw new Error('TELEGRAM_BOT_TOKEN non configurato'); return `https://api.telegram.org/bot${token()}/${method}`; }
async function call(method,payload={}){ const r=await fetch(api(method),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const d=await r.json().catch(()=>({})); if(!r.ok||d.ok===false) throw new Error(d.description||`Telegram API ${r.status}`); return d; }
function webhookUrl(){ return process.env.MYZUBSTER_TELEGRAM_WEBHOOK_URL || 'https://www.myzubster.com/api/telegram/myzubster/webhook'; }
function normalize(text){ return String(text||'').trim().split(/\s+/)[0].toLowerCase().replace(/@[^\s]+$/,''); }
function reply(command){ switch(command){
 case '/start': case '/help': return ['🌐 MyZubster Bot','','Bot ufficiale collegato all’ecosistema MyZubster. Le notifiche GitHub esistenti restano attive.','','/status - stato MyZubster','/github - repository e contributi','/marketplace - marketplace e seller','/party - Party Mode e community','/life - progetto LIFE','/zorgax - assistente Zorgax','/help - comandi disponibili'].join('\n');
 case '/status': return '✅ MyZubster è online. Bot Telegram collegato al backend di produzione.';
 case '/github': return '💻 GitHub\n\nMyZubster è sviluppato pubblicamente nell’organizzazione MyZubster-Ecosystem. Le notifiche automatiche GitHub continuano a usare questo bot.';
 case '/marketplace': return '🛒 Marketplace\n\nMyZubster include strumenti marketplace e seller. Usa myzubster.com per le funzionalità pubbliche disponibili.';
 case '/party': return '🔊 Party Mode\n\nArea community/eventi collegata all’ecosistema MyZubster. Informazioni pubblicate nel rispetto di autorizzazioni, sicurezza, welfare e privacy.';
 case '/life': return '🌱 LIFE\n\nArea MyZubster dedicata ai progetti LIFE, inclusione, comunità e sperimentazioni documentate.';
 case '/zorgax': return '🤖 Zorgax\n\nAssistente dell’ecosistema MyZubster per orientarsi tra funzionalità, progetti e strumenti.';
 default: return null; }}
async function register(){ const url=webhookUrl(); const secret=process.env.MYZUBSTER_TELEGRAM_WEBHOOK_SECRET||undefined; const set=await call('setWebhook',{url,allowed_updates:['message','edited_message'],drop_pending_updates:false,...(secret?{secret_token:secret}:{})}); const info=await call('getWebhookInfo'); const actual=info.result?.url||''; return {verified:set.result===true&&actual===url,url:actual,pending:info.result?.pending_update_count||0,lastError:info.result?.last_error_message||null}; }
router.get('/status',async(_req,res)=>{ const base={ok:true,service:'myzubster-telegram-bot',configured:configured(),webhookUrl:webhookUrl()}; if(!configured()) return res.json({...base,webhookVerified:false}); try{ const v=await register(); console.info('[myzubster-telegram]',JSON.stringify({event:'webhook_registration',...v})); return res.status(v.verified?200:502).json({...base,webhookVerified:v.verified,telegramWebhookUrl:v.url,pendingUpdateCount:v.pending,lastError:v.lastError}); }catch(e){ console.error('[myzubster-telegram]',e.message); return res.status(502).json({...base,webhookVerified:false,error:'Registrazione webhook Telegram fallita'}); }});
router.post('/webhook',async(req,res)=>{ const expected=process.env.MYZUBSTER_TELEGRAM_WEBHOOK_SECRET; if(expected&&req.get('x-telegram-bot-api-secret-token')!==expected) return res.status(401).json({ok:false,error:'Webhook secret non valido'}); const m=req.body?.message||req.body?.edited_message; const chatId=m?.chat?.id; const command=normalize(m?.text); const text=reply(command); if(!chatId||!text) return res.status(200).json({ok:true,ignored:true}); if(!configured()) return res.status(503).json({ok:false,error:'Bot non configurato'}); try{ await call('sendMessage',{chat_id:chatId,text,disable_web_page_preview:true}); console.info('[myzubster-telegram]',JSON.stringify({event:'command_handled',command,chatType:m?.chat?.type||null})); return res.json({ok:true,handled:true,command}); }catch(e){ console.error('[myzubster-telegram]',e.message); return res.status(502).json({ok:false,error:'Invio risposta Telegram fallito'}); }});
module.exports=router;
module.exports._test={normalize,reply,webhookUrl};
