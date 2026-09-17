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
router.get('/notifications/email/test-ui', (req, res) => {
  res.type('html').send(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MyZubster · Test SMTP</title><style>:root{color-scheme:dark;font-family:system-ui,sans-serif}body{margin:0;background:#050b16;color:#f7f9fc}.wrap{max-width:680px;margin:auto;padding:32px 20px}.card{background:#0d1828;border:1px solid #263a55;border-radius:24px;padding:28px}h1{font-size:2rem}p{color:#b8c3d4;line-height:1.55}button{border:0;border-radius:14px;padding:15px 20px;font-size:1rem;font-weight:800;color:white;background:linear-gradient(90deg,#7147ee,#078bd1)}button:disabled{opacity:.6}.status{margin-top:18px;padding:14px;border-radius:12px;background:#111f32;white-space:pre-wrap}.ok{border:1px solid #3a8}.bad{border:1px solid #d66}</style></head><body><main class="wrap"><section class="card"><h1>Test notifica SMTP</h1><p>Usa la sessione MyZubster già presente nel browser. Le credenziali SMTP non vengono esposte.</p><button id="send">Invia email SMTP di test</button><div id="status" class="status">Pronto per il test.</div></section></main><script>const b=document.getElementById('send'),s=document.getElementById('status');function token(){return localStorage.getItem('myzubster-token')||localStorage.getItem('token')||localStorage.getItem('accessToken')||sessionStorage.getItem('token')||''}b.onclick=async()=>{const t=token();if(!t){s.className='status bad';s.textContent='Sessione MyZubster non trovata. Accedi prima con il tuo account admin.';return}b.disabled=true;s.className='status';s.textContent='Invio in corso…';try{const r=await fetch('/api/admin/dashboard/notifications/email/test',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'}});let d={};try{d=await r.json()}catch(e){}if(r.ok&&d.success){s.className='status ok';s.textContent='Email accettata dal servizio SMTP.\\nMessage ID: '+(d.messageId||'non disponibile')}else{s.className='status bad';s.textContent='Test non riuscito ('+r.status+'). '+(d.reason||d.error||'Controlla i log Vercel.')}}catch(e){s.className='status bad';s.textContent='Errore di rete: '+e.message}finally{b.disabled=false}};</script></body></html>`);
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
