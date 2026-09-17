const { sendPEC } = require('../utils/email');

const ADMIN_NOTIFICATION_EMAIL = process.env.MYZUBSTER_ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || '';

function clean(value, maxLength = 500) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value).replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

async function notifyAdminActivity(type, details = {}) {
  if (process.env.ADMIN_ACTIVITY_NOTIFICATIONS === 'false') return { sent:false, reason:'disabled' };
  if (!ADMIN_NOTIFICATION_EMAIL) return { sent:false, reason:'not-configured' };

  const labels = {
    registration: 'Nuovo utente registrato',
    seller_activated: 'Nuovo Seller attivato',
    listing: 'Nuovo annuncio Marketplace',
    marketplace_request: 'Nuova richiesta Marketplace',
    marketplace_message: 'Nuovo contatto Marketplace'
  };
  const title = labels[type] || 'Nuova attivita MyZubster';
  const lines = [
    title,
    '',
    `Data: ${new Date().toISOString()}`,
    ...Object.entries(details).map(([key, value]) => `${key}: ${clean(value)}`)
  ];

  try {
    await sendPEC(ADMIN_NOTIFICATION_EMAIL, `[MyZubster] ${title}`, lines.join('\n'));
    return { sent:true };
  } catch (error) {
    console.error('[AdminActivityNotification] delivery failed', { type, error: String(error?.message || error).slice(0,240) });
    return { sent:false, reason:'delivery-failed' };
  }
}

module.exports = { notifyAdminActivity, ADMIN_NOTIFICATION_EMAIL, _test:{ clean } };
