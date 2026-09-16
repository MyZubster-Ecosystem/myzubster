const { sendPEC } = require('../utils/email');

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'rossieugenio17@gmail.com';

function clean(value, maxLength = 500) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value).replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

async function notifyAdminActivity(type, details = {}) {
  if (process.env.ADMIN_ACTIVITY_NOTIFICATIONS === 'false') return;

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
  } catch (error) {
    console.error('[AdminActivityNotification] delivery failed', { type, error: error.message });
  }
}

module.exports = { notifyAdminActivity, ADMIN_NOTIFICATION_EMAIL };
