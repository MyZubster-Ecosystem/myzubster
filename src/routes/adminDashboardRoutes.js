const express = require('express');
const router = express.Router();
const ac = require('../controllers/adminDashboardController');
const jwt = require('jsonwebtoken');
const { _test: emailTest } = require('../services/adminNotificationEmailService');
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(503).json({ error: 'Authentication is not configured' });
  try { req.user = jwt.verify(token, secret); next(); }
  catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
};
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  next();
};
router.get('/overview', auth, admin, ac.getOverview);
router.get('/payments', auth, admin, ac.getPaymentMonitoring);
router.get('/jobs', auth, admin, ac.getJobMonitoring);
router.get('/health', auth, admin, ac.getSystemHealth);
router.get('/overview-ui', (req, res) => {
  res.type('html').send(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MyZubster · Crescita</title><style>:root{color-scheme:dark;font-family:system-ui,sans-serif}body{margin:0;background:#050b16;color:#f7f9fc}.wrap{max-width:820px;margin:auto;padding:28px 18px}h1{font-size:2rem;margin-bottom:8px}.sub,.label{color:#aebbd0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}.card{background:#0d1828;border:1px solid #263a55;border-radius:20px;padding:20px}.value{font-size:2.35rem;font-weight:900;margin-top:7px}.period{font-size:1.15rem;font-weight:800;margin-top:7px}.status{background:#111f32;border-radius:12px;padding:14px;color:#b8c3d4}button{border:0;border-radius:13px;padding:13px 18px;font-weight:800;color:#fff;background:linear-gradient(90deg,#7147ee,#078bd1)}h2{margin-top:30px}@media(max-width:600px){.grid{grid-template-columns:1fr}.value{font-size:2.1rem}}</style></head><body><main class="wrap"><h1>Crescita MyZubster</h1><div class="sub">Conteggi reali dal database, con finestre temporali confrontabili con Analytics.</div><div class="grid"><div class="card"><div class="label">Iscritti totali</div><div class="value" id="users">—</div></div><div class="card"><div class="label">Seller totali</div><div class="value" id="sellers">—</div></div><div class="card"><div class="label">Seller attivi</div><div class="value" id="active">—</div></div></div><h2>Nuovi negli ultimi periodi</h2><div class="grid"><div class="card"><div class="label">Ultime 24 ore</div><div class="period">Iscritti: <span id="u1">—</span></div><div class="period">Seller: <span id="s1">—</span></div><div class="period">Seller attivi: <span id="a1">—</span></div></div><div class="card"><div class="label">Ultimi 7 giorni</div><div class="period">Iscritti: <span id="u7">—</span></div><div class="period">Seller: <span id="s7">—</span></div><div class="period">Seller attivi: <span id="a7">—</span></div></div><div class="card"><div class="label">Ultimi 30 giorni</div><div class="period">Iscritti: <span id="u30">—</span></div><div class="period">Seller: <span id="s30">—</span></div><div class="period">Seller attivi: <span id="a30">—</span></div></div></div><button id="refresh">Aggiorna</button><div id="status" class="status" style="margin-top:16px">Caricamento…</div></main><script>const s=document.getElementById('status'),b=document.getElementById('refresh');function token(){return localStorage.getItem('myzubster-token')||localStorage.getItem('token')||localStorage.getItem('accessToken')||sessionStorage.getItem('token')||''}function put(id,v){document.getElementById(id).textContent=v??'—'}async function load(){const t=token();if(!t){location.assign('/social-login.html?returnTo='+encodeURIComponent(location.pathname));return}b.disabled=true;s.textContent='Aggiornamento…';try{const r=await fetch('/api/admin/dashboard/overview',{headers:{Authorization:'Bearer '+t}});const d=await r.json();if(!r.ok)throw new Error(d.error||('HTTP '+r.status));put('users',d.totalUsers);put('sellers',d.totalSellers);put('active',d.activeSellers);put('u1',d.growth?.users?.last24h);put('u7',d.growth?.users?.last7d);put('u30',d.growth?.users?.last30d);put('s1',d.growth?.sellers?.last24h);put('s7',d.growth?.sellers?.last7d);put('s30',d.growth?.sellers?.last30d);put('a1',d.growth?.activeSellers?.last24h);put('a7',d.growth?.activeSellers?.last7d);put('a30',d.growth?.activeSellers?.last30d);s.textContent='Dati aggiornati: '+new Date().toLocaleString('it-IT')}catch(e){s.textContent='Impossibile leggere i dati: '+e.message}finally{b.disabled=false}}b.onclick=load;load();</script></body></html>`);
});
router.get('/notifications/email/test-ui', (req, res) => {
  res.type('html').send(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MyZubster · Test SMTP</title><style>:root{color-scheme:dark;font-family:system-ui,sans-serif}body{margin:0;background:#050b16;color:#f7f9fc}.wrap{max-width:680px;margin:auto;padding:32px 20px}.card{background:#0d1828;border:1px solid #263a55;border-radius:24px;padding:28px}h1{font-size:2rem}p{color:#b8c3d4;line-height:1.55}button{border:0;border-radius:14px;padding:15px 20px;font-size:1rem;font-weight:800;color:white;background:linear-gradient(90deg,#7147ee,#078bd1)}button:disabled{opacity:.6}.status{margin-top:18px;padding:14px;border-radius:12px;background:#111f32;white-space:pre-wrap}.ok{border:1px solid #3a8}.bad{border:1px solid #d66}</style></head><body><main class="wrap"><section class="card"><h1>Test notifica SMTP</h1><p>Usa la sessione MyZubster già presente nel browser. Le credenziali SMTP non vengono esposte.</p><button id="send">Invia email SMTP di test</button><div id="status" class="status">Pronto per il test.</div></section></main><script>const b=document.getElementById('send'),s=document.getElementById('status');function token(){return localStorage.getItem('myzubster-token')||localStorage.getItem('token')||localStorage.getItem('accessToken')||sessionStorage.getItem('token')||''}b.onclick=async()=>{const t=token();if(!t){location.assign('/social-login.html?returnTo='+encodeURIComponent(location.pathname));return}b.disabled=true;s.className='status';s.textContent='Invio in corso…';try{const r=await fetch('/api/admin/dashboard/notifications/email/test',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'}});let d={};try{d=await r.json()}catch(e){}if(r.ok&&d.success){s.className='status ok';s.textContent='Email accettata dal servizio SMTP.\\nMessage ID: '+(d.messageId||'non disponibile')}else{s.className='status bad';s.textContent='Test non riuscito ('+r.status+'). '+(d.reason||d.error||'Controlla i log Vercel.')}}catch(e){s.className='status bad';s.textContent='Errore di rete: '+e.message}finally{b.disabled=false}};</script></body></html>`);
});
router.post('/notifications/email/test', auth, admin, async (req, res) => {
  const result = await emailTest.sendAdminNotification('[MyZubster] Test notifica SMTP', [
    'Test controllato della configurazione SMTP MyZubster.',
    `Admin: ${req.user?.email || req.user?.id || req.user?._id || 'authenticated-admin'}`,
    `Data: ${new Date().toISOString()}`
  ]);
  if (!result.sent) {
    return res.status(result.reason === 'not-configured' ? 503 : 502).json({ success: false, reason: result.reason });
  }
  return res.json({ success: true, messageId: result.messageId || null });
});
module.exports = router;
