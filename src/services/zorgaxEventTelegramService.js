const axios = require('axios');

function publicEventText(event) {
  const lines = [`🔊 ${event.title}`];
  if (event.publicInfo?.statusMessage) lines.push(event.publicInfo.statusMessage);
  if (event.startsAt) lines.push(`Start: ${new Date(event.startsAt).toISOString()}`);
  if (event.publicInfo?.lineupSummary) lines.push(`Lineup: ${event.publicInfo.lineupSummary}`);

  const canReleaseLocation = event.location?.mode !== 'PRIVATE' &&
    (event.location?.mode !== 'AUTHORIZED_RELEASE' || event.location?.released === true);
  if (canReleaseLocation && event.location?.publicText) lines.push(`Access: ${event.location.publicText}`);

  if (event.publicInfo?.transport) lines.push(`Transport: ${event.publicInfo.transport}`);
  if (event.publicInfo?.cancellation) lines.push(`Update: ${event.publicInfo.cancellation}`);
  lines.push('Source: organizer-confirmed MyZubster / Zorgax Info Point');
  return lines.join('\n');
}

async function sendOrganizerConfirmedEvent(event, chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!chatId) throw new Error('Telegram chat id is required');

  const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: publicEventText(event),
    disable_web_page_preview: true
  }, { timeout: 10000 });

  return response.data;
}

module.exports = { publicEventText, sendOrganizerConfirmedEvent };
