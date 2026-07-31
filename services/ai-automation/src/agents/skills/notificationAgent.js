/**
 * Notification Agent - Multi-channel notification support
 *
 * Supports:
 * - Slack via Incoming Webhook URL
 * - Telegram via Bot API
 *
 * Channel selection:
 * - Explicit `channel` option overrides env-based defaults
 * - If SLACK_WEBHOOK_URL is set, Slack is preferred by default
 * - Otherwise Telegram is used if TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set
 * - If neither is configured, notifications are logged and skipped gracefully
 */

const https = require('https');
const http = require('http');
const url = require('url');

class NotificationAgent {
  constructor(options = {}) {
    this.name = 'NotificationAgent';
    this.version = '1.0.0';

    const config = {
      slackWebhookUrl: options.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL || null,
      telegramBotToken: options.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || null,
      telegramChatId: options.telegramChatId || process.env.TELEGRAM_CHAT_ID || null,
      timeout: options.timeout || 10000,
      retries: options.retries || 1
    };

    this.config = {
      ...config,
      defaultChannel: options.defaultChannel || this._detectDefaultChannel(config)
    };

    this.stats = {
      sent: 0,
      slackSent: 0,
      telegramSent: 0,
      failed: 0,
      skipped: 0
    };
  }

  _detectDefaultChannel(config = this.config) {
    if (config.slackWebhookUrl) return 'slack';
    if (config.telegramBotToken && config.telegramChatId) return 'telegram';
    return null;
  }

  _getChannel(targetChannel) {
    const channel = targetChannel || this.config.defaultChannel;
    if (!channel) return null;

    if (channel === 'slack' && !this.config.slackWebhookUrl) {
      throw new Error('Slack webhook URL is not configured');
    }
    if (channel === 'telegram' && (!this.config.telegramBotToken || !this.config.telegramChatId)) {
      throw new Error('Telegram bot token or chat ID is not configured');
    }
    return channel;
  }

  async send(message, options = {}) {
    const {
      channel: targetChannel,
      title,
      blocks,
      parseMode = 'Markdown',
      disableNotification = false
    } = options;

    const enrichedMessage = {
      text: typeof message === 'string' ? message : JSON.stringify(message),
      title: title || null,
      blocks: blocks || null,
      timestamp: new Date().toISOString()
    };

    const channel = this._getChannel(targetChannel);
    if (!channel) {
      console.warn('[NotificationAgent] No notification channel configured. Message:', enrichedMessage);
      this.stats.skipped++;
      return { success: false, skipped: true, reason: 'no_channel_configured' };
    }

    if (channel === 'slack') {
      return this._sendSlack(enrichedMessage);
    }

    if (channel === 'telegram') {
      return this._sendTelegram(enrichedMessage, { parseMode, disableNotification });
    }

    throw new Error(`Unsupported notification channel: ${channel}`);
  }

  async sendSlack(message, options = {}) {
    return this.send(message, { ...options, channel: 'slack' });
  }

  async sendTelegram(message, options = {}) {
    return this.send(message, { ...options, channel: 'telegram' });
  }

  async _sendSlack(enrichedMessage) {
    const payload = {
      text: enrichedMessage.title ? `${enrichedMessage.title}\n${enrichedMessage.text}` : enrichedMessage.text
    };

    if (enrichedMessage.blocks) {
      payload.blocks = enrichedMessage.blocks;
    }

    const result = await this._request('POST', this.config.slackWebhookUrl, payload);

    if (result.success) {
      this.stats.sent++;
      this.stats.slackSent++;
    } else {
      this.stats.failed++;
    }

    return result;
  }

  async _sendTelegram(enrichedMessage, options) {
    const { parseMode, disableNotification } = options;
    const text = enrichedMessage.title
      ? `*${this._escapeTelegramMarkdown(enrichedMessage.title)}*\n\n${enrichedMessage.text}`
      : enrichedMessage.text;

    const payload = {
      chat_id: this.config.telegramChatId,
      text,
      parse_mode: parseMode,
      disable_notification: disableNotification
    };

    const apiUrl = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
    const result = await this._request('POST', apiUrl, payload);

    if (result.success) {
      this.stats.sent++;
      this.stats.telegramSent++;
    } else {
      this.stats.failed++;
    }

    return result;
  }

  _escapeTelegramMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+=|{}.!\-]/g, '\\$&');
  }

  async _request(method, targetUrl, payload) {
    const parsed = url.parse(targetUrl);
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;

    const body = JSON.stringify(payload);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'MyZubster-NotificationAgent/1.0'
      }
    };

    return new Promise((resolve) => {
      const req = transport.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const success = res.statusCode >= 200 && res.statusCode < 300;
          const result = {
            success,
            statusCode: res.statusCode,
            body: data,
            channel: targetUrl.includes('slack') ? 'slack' : 'telegram'
          };

          if (!success) {
            console.error(`[NotificationAgent] ${result.channel} delivery failed (${res.statusCode}):`, data);
          }

          resolve(result);
        });
      });

      req.on('error', (error) => {
        console.error(`[NotificationAgent] Request error to ${targetUrl}:`, error.message);
        resolve({ success: false, error: error.message, channel: targetUrl.includes('slack') ? 'slack' : 'telegram' });
      });

      req.write(body);
      req.end();
    });
  }

  getStatus() {
    return {
      name: this.name,
      version: this.version,
      defaultChannel: this.config.defaultChannel,
      channels: {
        slack: {
          configured: !!this.config.slackWebhookUrl,
          webhook: this.config.slackWebhookUrl ? 'configured' : 'missing'
        },
        telegram: {
          configured: !!(this.config.telegramBotToken && this.config.telegramChatId),
          bot: this.config.telegramBotToken ? 'configured' : 'missing',
          chatId: this.config.telegramChatId || 'missing'
        }
      },
      stats: this.stats
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = NotificationAgent;
