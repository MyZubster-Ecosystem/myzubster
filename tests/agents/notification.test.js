/**
 * Test Suite for NotificationAgent
 */

const NotificationAgent = require('../../src/agents/skills/notificationAgent');

describe('NotificationAgent', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor and channel detection', () => {
    test('prefers Slack when SLACK_WEBHOOK_URL is set', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T1/B1/abc';

      const agent = new NotificationAgent();
      expect(agent.config.defaultChannel).toBe('slack');
    });

    test('falls back to Telegram when only Telegram env vars are set', () => {
      delete process.env.SLACK_WEBHOOK_URL;
      process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
      process.env.TELEGRAM_CHAT_ID = 'chat-id';

      const agent = new NotificationAgent();
      expect(agent.config.defaultChannel).toBe('telegram');
    });

    test('returns null default channel when neither is configured', () => {
      delete process.env.SLACK_WEBHOOK_URL;
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      const agent = new NotificationAgent();
      expect(agent.config.defaultChannel).toBeNull();
    });

    test('allows explicit options to override env vars', () => {
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/env';
      process.env.TELEGRAM_BOT_TOKEN = 'env-token';
      process.env.TELEGRAM_CHAT_ID = 'env-chat';

      const agent = new NotificationAgent({
        slackWebhookUrl: 'https://hooks.slack.com/services/override',
        telegramBotToken: 'override-token',
        telegramChatId: 'override-chat',
        defaultChannel: 'telegram'
      });

      expect(agent.config.slackWebhookUrl).toBe('https://hooks.slack.com/services/override');
      expect(agent.config.telegramBotToken).toBe('override-token');
      expect(agent.config.defaultChannel).toBe('telegram');
    });
  });

  describe('send - no channel configured', () => {
    test('skips gracefully when no channel is configured', async () => {
      delete process.env.SLACK_WEBHOOK_URL;
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      const agent = new NotificationAgent();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await agent.send('Hello world');

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_channel_configured');
      expect(agent.getStats().skipped).toBe(1);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('send - Slack webhook', () => {
    const createMockResponse = (statusCode, body) => {
      let data = '';
      const handlers = {};
      const res = {
        statusCode,
        write: jest.fn(),
        end: jest.fn(),
        on(event, handler) {
          handlers[event] = handler;
          return res;
        },
        emit(event, payload) {
          if (handlers[event]) {
            handlers[event](payload);
          }
        }
      };

      // Simulate data and end events
      setTimeout(() => {
        if (handlers.data) handlers.data(body);
        if (handlers.end) handlers.end(null);
      }, 10);

      return res;
    };

    test('sends message via Slack webhook and tracks stats', async () => {
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T1/B1/abc';
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      const mockRequest = jest.fn((opts, cb) => {
        const res = createMockResponse(200, 'ok');
        cb(res);
        return {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
      });

      jest.doMock('https', () => ({ request: mockRequest }));

      const NotificationAgentReloaded = require('../../src/agents/skills/notificationAgent');
      const agent = new NotificationAgentReloaded();

      const result = await agent.sendSlack('Hello Slack');

      expect(result.success).toBe(true);
      expect(result.channel).toBe('slack');
      expect(agent.getStats().slackSent).toBe(1);
      expect(agent.getStats().sent).toBe(1);

      jest.dontMock('https');
    });

    test('handles Slack webhook failure gracefully', async () => {
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T1/B1/abc';
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      const mockRequest = jest.fn((opts, cb) => {
        const res = createMockResponse(500, 'internal_error');
        cb(res);
        return {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
      });

      jest.doMock('https', () => ({ request: mockRequest }));

      const NotificationAgentReloaded = require('../../src/agents/skills/notificationAgent');
      const agent = new NotificationAgentReloaded();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await agent.sendSlack('Hello Slack');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(agent.getStats().failed).toBe(1);
      expect(agent.getStats().sent).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      jest.dontMock('https');
    });
  });

  describe('send - Telegram', () => {
    const createMockResponse = (statusCode, body) => {
      const handlers = {};
      const res = {
        statusCode,
        write: jest.fn(),
        end: jest.fn(),
        on(event, handler) {
          handlers[event] = handler;
          return res;
        },
        emit(event, payload) {
          if (handlers[event]) {
            handlers[event](payload);
          }
        }
      };

      setTimeout(() => {
        if (handlers.data) handlers.data(body);
        if (handlers.end) handlers.end(null);
      }, 10);

      return res;
    };

    test('sends message via Telegram Bot API and tracks stats', async () => {
      delete process.env.SLACK_WEBHOOK_URL;
      process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
      process.env.TELEGRAM_CHAT_ID = 'chat-id';

      const mockRequest = jest.fn((opts, cb) => {
        const res = createMockResponse(200, '{"ok":true}');
        cb(res);
        return {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
      });

      jest.doMock('https', () => ({ request: mockRequest }));

      const NotificationAgentReloaded = require('../../src/agents/skills/notificationAgent');
      const agent = new NotificationAgentReloaded();

      const result = await agent.sendTelegram('Hello Telegram');

      expect(result.success).toBe(true);
      expect(result.channel).toBe('telegram');
      expect(agent.getStats().telegramSent).toBe(1);
      expect(agent.getStats().sent).toBe(1);

      jest.dontMock('https');
    });

    test('escapes Markdown special characters in Telegram title', async () => {
      delete process.env.SLACK_WEBHOOK_URL;
      process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
      process.env.TELEGRAM_CHAT_ID = 'chat-id';

      let capturedBody = '';
      const mockRequest = jest.fn((opts, cb) => {
        const res = createMockResponse(200, '{"ok":true}');
        cb(res);
        return {
          write: jest.fn((chunk) => { capturedBody += chunk; }),
          end: jest.fn(),
          on: jest.fn()
        };
      });

      jest.doMock('https', () => ({ request: mockRequest }));

      const NotificationAgentReloaded = require('../../src/agents/skills/notificationAgent');
      const agent = new NotificationAgentReloaded();

      const result = await agent.sendTelegram('Alert *bold* [link](url)', { title: 'Important: check this' });

      expect(result.success).toBe(true);
      // Title is escaped (no unescaped special chars) and wrapped in bold
      const parsed = JSON.parse(capturedBody);
      expect(parsed.text).toContain('*Important: check this*');
      expect(parsed.text).toContain('Alert *bold* [link](url)');
      expect(parsed.parse_mode).toBe('Markdown');

      jest.dontMock('https');
    });

    test('handles Telegram API failure gracefully', async () => {
      delete process.env.SLACK_WEBHOOK_URL;
      process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
      process.env.TELEGRAM_CHAT_ID = 'chat-id';

      const mockRequest = jest.fn((opts, cb) => {
        const res = createMockResponse(400, '{"ok":false,"error_code":400,"description":"Bad Request"}');
        cb(res);
        return {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
      });

      jest.doMock('https', () => ({ request: mockRequest }));

      const NotificationAgentReloaded = require('../../src/agents/skills/notificationAgent');
      const agent = new NotificationAgentReloaded();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await agent.sendTelegram('Hello Telegram');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(agent.getStats().failed).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      jest.dontMock('https');
    });
  });

  describe('channel selection and validation', () => {
    test('throws when Slack channel is requested but webhook is missing', async () => {
      delete process.env.SLACK_WEBHOOK_URL;
      const agent = new NotificationAgent();

      await expect(agent.sendSlack('hello')).rejects.toThrow('Slack webhook URL is not configured');
    });

    test('throws when Telegram channel is requested but token/chat is missing', async () => {
      delete process.env.SLACK_WEBHOOK_URL;
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
      const agent = new NotificationAgent();

      await expect(agent.sendTelegram('hello')).rejects.toThrow('Telegram bot token or chat ID is not configured');
    });

    test('supports explicit channel override', async () => {
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T1/B1/abc';
      process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
      process.env.TELEGRAM_CHAT_ID = 'chat-id';

      const createMockResponse = (statusCode, body) => {
        const handlers = {};
        const res = {
          statusCode,
          write: jest.fn(),
          end: jest.fn(),
          on(event, handler) {
            handlers[event] = handler;
            return res;
          },
          emit(event, payload) {
            if (handlers[event]) {
              handlers[event](payload);
            }
          }
        };

        setTimeout(() => {
          if (handlers.data) handlers.data(body);
          if (handlers.end) handlers.end(null);
        }, 10);

        return res;
      };

      const mockRequest = jest.fn((opts, cb) => {
        const res = createMockResponse(200, 'ok');
        cb(res);
        return {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
      });

      jest.doMock('https', () => ({ request: mockRequest }));

      const NotificationAgentReloaded = require('../../src/agents/skills/notificationAgent');
      const agent = new NotificationAgentReloaded();

      // defaultChannel should be slack because SLACK_WEBHOOK_URL is set
      expect(agent.config.defaultChannel).toBe('slack');

      // But we can explicitly send via telegram
      const result = await agent.send('hello', { channel: 'telegram' });
      expect(result.success).toBe(true);
      expect(result.channel).toBe('telegram');

      jest.dontMock('https');
    });
  });

  describe('status and stats', () => {
    test('getStatus returns channels configuration and stats', () => {
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T1/B1/abc';
      process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
      process.env.TELEGRAM_CHAT_ID = 'chat-id';

      const agent = new NotificationAgent();
      const status = agent.getStatus();

      expect(status.name).toBe('NotificationAgent');
      expect(status.defaultChannel).toBe('slack');
      expect(status.channels.slack.configured).toBe(true);
      expect(status.channels.telegram.configured).toBe(true);
      expect(status.stats).toBeDefined();
    });

    test('getStats returns a copy of stats', () => {
      const agent = new NotificationAgent();
      const stats = agent.getStats();
      stats.sent = 999;

      expect(agent.getStats().sent).toBe(0);
    });
  });
});
