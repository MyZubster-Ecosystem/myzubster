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
  if (!config) {
    console.warn('[admin-notification-email] skipped: SMTP configuration incomplete', {
      host: Boolean(process.env.ZORGAX_SMTP_HOST),
      port: Boolean(process.env.ZORGAX_SMTP_PORT),
      user: Boolean(process.env.ZORGAX_SMTP_USER),
      pass: Boolean(process.env.ZORGAX_SMTP_PASS),
      from: Boolean(process.env.ZORGAX_EMAIL_FROM),
      to: Boolean(process.env.MYZUBSTER_ADMIN_NOTIFICATION_EMAIL)
    });
    return { sent: false, reason: 'not-configured' };
  }
  try {
    const transporter = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.secure, auth: config.auth });
    const info = await transporter.sendMail({ from: config.from, to: config.to, subject, text: lines.filter(Boolean).join('\n') });
    console.info('[admin-notification-email] delivered', {
      subject,
      to: config.to,
      messageId: info?.messageId || null,
      accepted: info?.accepted || [],
      rejected: info?.rejected || []
    });
    return { sent: true, messageId: info?.messageId || null };
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
