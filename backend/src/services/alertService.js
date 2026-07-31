const http = require('http');
const https = require('https');

function postJson(targetUrl, payload, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (error) {
      resolve({ success: false, error: `Invalid URL: ${targetUrl}` });
      return;
    }

    const client = parsedUrl.protocol === 'http:' ? http : https;
    const body = JSON.stringify(payload);
    const req = client.request({
      method: 'POST',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      timeout: timeoutMs,
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body)
      }
    }, (res) => {
      res.resume();
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Alert request timed out'));
    });
    req.on('error', (error) => resolve({ success: false, error: error.message }));
    req.write(body);
    req.end();
  });
}

function buildAlertMessage(snapshot) {
  const unhealthy = Object.values(snapshot.services || {})
    .filter((service) => service.status !== 'online' && service.status !== 'skipped')
    .map((service) => `${service.name}: ${service.status}`);

  return [
    `MyZubster monitoring status: ${snapshot.status}`,
    `Timestamp: ${snapshot.timestamp}`,
    unhealthy.length ? `Attention: ${unhealthy.join(', ')}` : 'All monitored services are online.'
  ].join('\n');
}

async function sendAlert(snapshot, options = {}) {
  const slackWebhookUrl = options.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
  const telegramBotToken = options.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = options.telegramChatId || process.env.TELEGRAM_CHAT_ID;
  const message = options.message || buildAlertMessage(snapshot);
  const results = [];

  if (slackWebhookUrl) {
    results.push({
      channel: 'slack',
      ...(await postJson(slackWebhookUrl, { text: message }, options.timeoutMs))
    });
  }

  if (telegramBotToken && telegramChatId) {
    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    results.push({
      channel: 'telegram',
      ...(await postJson(telegramUrl, { chat_id: telegramChatId, text: message }, options.timeoutMs))
    });
  }

  if (results.length === 0) {
    return [{ channel: 'none', success: false, skipped: true, reason: 'no_alert_channel_configured' }];
  }

  return results;
}

module.exports = {
  buildAlertMessage,
  postJson,
  sendAlert
};
