const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const Subscription = require('../models/ZorgaxEmailSubscription');
const Delivery = require('../models/ZorgaxEmailDelivery');
const { ensureSubscription, enqueue, sendQueued } = require('../services/zorgaxEmailService');

const router = express.Router();
const mutationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.get('/preferences', authenticate, async (req, res) => {
  try {
    const sub = await ensureSubscription(req.userId);
    res.json({ success: true, data: { enabled: sub.enabled, topics: sub.topics || [], frequency: sub.frequency, source: sub.source, emailMasked: sub.email.replace(/^(.{1,2}).*(@.*)$/, '$1***$2') } });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.put('/preferences', authenticate, mutationLimiter, async (req, res) => {
  try {
    const allowed = new Set(['zorgax', 'github', 'life', 'marketplace', 'contributors']);
    const topics = [...new Set((Array.isArray(req.body?.topics) ? req.body.topics : []).filter(t => allowed.has(t)))];
    const enabled = req.body?.enabled === true;
    if (enabled && topics.length === 0) return res.status(400).json({ success: false, message: 'Seleziona almeno un argomento' });
    const sub = await ensureSubscription(req.userId);
    sub.enabled = enabled;
    sub.topics = topics;
    sub.frequency = req.body?.frequency === 'weekly' ? 'weekly' : 'important-only';
    if (enabled) { sub.consentedAt = new Date(); sub.unsubscribedAt = undefined; }
    else sub.unsubscribedAt = new Date();
    await sub.save();
    if (enabled) {
      await enqueue(req.userId, 'zorgax', 'welcome', 'Zorgax è attivo sul tuo account MyZubster', 'Hai attivato volontariamente l’assistenza email di Zorgax. Riceverai solo aggiornamenti relativi agli argomenti scelti, con limiti di frequenza e possibilità di disattivazione in ogni momento.');
      if (topics.includes('life')) await enqueue(req.userId, 'life', 'life-welcome', 'Benvenuto nel percorso LIFE 2027', 'Zorgax può aiutarti a seguire LIFE 2027 con aggiornamenti su pilot, contributi verificabili, attività ambientali e prossimi passi. Questa iscrizione non crea automaticamente partnership, incarichi o rapporti economici.');
    }
    res.json({ success: true, data: { enabled: sub.enabled, topics: sub.topics, frequency: sub.frequency } });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.post('/life/update', authenticate, mutationLimiter, async (req, res) => {
  if (!['admin', 'moderator'].includes(req.userRole)) return res.status(403).json({ success: false, message: 'Permessi insufficienti' });
  const subject = String(req.body?.subject || '').trim();
  const text = String(req.body?.text || '').trim();
  const template = String(req.body?.template || 'life-update').trim().slice(0, 120);
  if (!subject || !text || subject.length > 180 || text.length > 12000) return res.status(400).json({ success: false, message: 'subject/text non validi' });
  const subscribers = await Subscription.find({ enabled: true, topics: 'life' }).select('userId').limit(1000);
  let queued = 0;
  for (const sub of subscribers) { const result = await enqueue(sub.userId, 'life', template, subject, text); if (result.queued) queued += 1; }
  res.json({ success: true, data: { subscribers: subscribers.length, queued } });
});

router.post('/github/help', authenticate, mutationLimiter, async (req, res) => {
  const subject = String(req.body?.subject || 'Zorgax può aiutarti con GitHub').trim();
  const text = String(req.body?.text || 'Zorgax ha rilevato un aggiornamento pertinente al tuo percorso MyZubster/GitHub. Apri MyZubster per vedere i prossimi passi disponibili.').trim();
  const result = await enqueue(req.userId, 'github', 'github-help', subject, text);
  res.status(result.queued ? 201 : 200).json({ success: true, data: result });
});

router.post('/run', async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ success: false, message: 'Cron non autorizzato' });
  const result = await sendQueued(50);
  res.json({ success: true, data: result });
});

router.get('/unsubscribe', async (req, res) => {
  try {
    const data = jwt.verify(req.query?.token, process.env.JWT_SECRET);
    if (data.purpose !== 'zorgax-email-unsubscribe' || !data.userId) throw new Error('token non valido');
    await Subscription.findOneAndUpdate({ userId: data.userId }, { $set: { enabled: false, topics: [], unsubscribedAt: new Date() } });
    await Delivery.updateMany({ userId: data.userId, status: 'QUEUED' }, { $set: { status: 'SKIPPED', reason: 'unsubscribed' } });
    res.type('html').send('<h1>Email Zorgax disattivate</h1><p>Non riceverai altri messaggi finché non le riattiverai dal tuo account MyZubster.</p>');
  } catch (_error) { res.status(400).type('html').send('<h1>Link non valido o scaduto</h1>'); }
});

module.exports = router;
