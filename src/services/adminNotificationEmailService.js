const nodemailer = require('nodemailer');

function emailConfig() {
  const host = process.env.ZORGAX_SMTP_HOST;
  const port = Number(process.env.ZORGAX_SMTP_PORT || 587);
  const user = process.env.ZORGAX_SMTP_USER;
  const pass = process.env.ZORGAX_SMTP_PASS;
  const from = process.env.ZORGAX_EMAIL_FROM;
  const to = process.env.MYZUBSTER_ADMIN_NOTIFICATION_EMAIL;
  if (!host || !user || !pass || !from || !to) return null;
  return { host, port, secure: port === 465, auth: { user, pass }, from, to };
}

async function sendAdminNotification(subject, lines) {
  const config = emailConfig();
  if (!config) return { sent: false, reason: 'not-configured' };
  try {
    const transporter = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.secure, auth: config.auth });
    await transporter.sendMail({ from: config.from, to: config.to, subject, text: lines.filter(Boolean).join('\n') });
    return { sent: true };
  } catch (error) {
    console.warn('[admin-notification-email] delivery failed:', String(error?.message || error).slice(0, 240));
    return { sent: false, reason: 'delivery-failed' };
  }
}

async function notifyGoogleRegistration({ userId, email, name }) {
  return sendAdminNotification('[MyZubster] Nuova registrazione Google', [
    'Nuovo account MyZubster creato tramite Google.',
    `User ID: ${userId || ''}`,
    `Email: ${email || ''}`,
    `Nome: ${name || ''}`,
    'Provider: Google',
    `Data: ${new Date().toISOString()}`
  ]);
}

async function notifySellerActivation({ userId, email, plan }) {
  return sendAdminNotification('[MyZubster] Nuovo Seller', [
    'Nuovo account Seller MyZubster attivato.',
    `User ID: ${userId || ''}`,
    `Email: ${email || ''}`,
    `Piano: ${plan || 'SELLER_FREE'}`,
    `Data: ${new Date().toISOString()}`
  ]);
}

module.exports = { notifyGoogleRegistration, notifySellerActivation, _test: { emailConfig, sendAdminNotification } };
