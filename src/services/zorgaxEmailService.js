const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Subscription = require('../models/ZorgaxEmailSubscription');
const Delivery = require('../models/ZorgaxEmailDelivery');

function emailConfig() {
  const host = process.env.ZORGAX_SMTP_HOST;
  const port = Number(process.env.ZORGAX_SMTP_PORT || 587);
  const user = process.env.ZORGAX_SMTP_USER;
  const pass = process.env.ZORGAX_SMTP_PASS;
  const from = process.env.ZORGAX_EMAIL_FROM;
  if (!host || !user || !pass || !from) return null;
  return { host, port, secure: port === 465, auth: { user, pass }, from };
}

function unsubscribeToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non configurato');
  return jwt.sign({ purpose: 'zorgax-email-unsubscribe', userId: String(userId), nonce: crypto.randomBytes(8).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '365d' });
}

function unsubscribeUrl(userId) {
  const base = (process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'https://www.myzubster.com').replace(/\/$/, '');
  return `${base}/api/zorgax/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken(userId))}`;
}

async function preferredEmail(user) {
  return user?.socialIdentities?.github?.email || user?.socialIdentities?.google?.email || user?.email || null;
}

async function ensureSubscription(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utente non trovato');
  const email = await preferredEmail(user);
  if (!email) throw new Error('Nessuna email verificabile disponibile');
  const source = user?.socialIdentities?.github?.email === email ? 'github-verified-email' : user?.socialIdentities?.google?.email === email ? 'google-verified-email' : 'account-email';
  const subscription = await Subscription.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId }, $set: { email, source } },
    { new: true, upsert: true }
  );
  return subscription;
}

async function enqueue(userId, topic, template, subject, text) {
  const sub = await Subscription.findOne({ userId, enabled: true, topics: topic });
  if (!sub) return { queued: false, reason: 'no-consent' };
  const recentCount = await Delivery.countDocuments({ userId, status: 'SENT', sentAt: { $gte: new Date(Date.now() - 30 * 86400000) } });
  if (recentCount >= 4) return { queued: false, reason: 'frequency-cap' };
  const existing = await Delivery.findOne({ userId, topic, template, status: { $in: ['QUEUED', 'SENT'] }, createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } });
  if (existing) return { queued: false, reason: 'duplicate-window' };
  const delivery = await Delivery.create({ userId, topic, template, subject, text, status: 'QUEUED' });
  return { queued: true, deliveryId: String(delivery._id) };
}

async function sendQueued(limit = 50) {
  const config = emailConfig();
  if (!config) return { configured: false, sent: 0, skipped: 0, failed: 0 };
  const transporter = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.secure, auth: config.auth });
  const deliveries = await Delivery.find({ status: 'QUEUED' }).sort({ createdAt: 1 }).limit(Math.min(Number(limit) || 50, 100));
  let sent = 0; let skipped = 0; let failed = 0;
  for (const delivery of deliveries) {
    const sub = await Subscription.findOne({ userId: delivery.userId, enabled: true, topics: delivery.topic });
    if (!sub) { delivery.status = 'SKIPPED'; delivery.reason = 'consent-revoked'; await delivery.save(); skipped += 1; continue; }
    const footer = `\n\n—\nGestisci o disattiva le email Zorgax: ${unsubscribeUrl(delivery.userId)}`;
    try {
      await transporter.sendMail({ from: config.from, to: sub.email, subject: delivery.subject, text: `${delivery.text}${footer}` });
      delivery.status = 'SENT'; delivery.sentAt = new Date(); await delivery.save();
      sub.lastSentAt = delivery.sentAt; await sub.save(); sent += 1;
    } catch (error) {
      delivery.status = 'FAILED'; delivery.reason = String(error.message || error).slice(0, 500); await delivery.save(); failed += 1;
    }
  }
  return { configured: true, sent, skipped, failed };
}

module.exports = { ensureSubscription, enqueue, sendQueued, unsubscribeToken };
