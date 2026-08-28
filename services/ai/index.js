'use strict';

/**
 * AI microservice.
 * Thin boundary over the existing ai-automation service (services/ai-automation).
 * Exposes a stable REST contract; internal orchestration stays in ai-automation.
 */

const { startService, json } = require('../_shared/service');

const PORT = parseInt(process.env.AI_PORT || '8084', 10);

startService({
  name: 'ai',
  port: PORT,
  handlers: {
    'POST /process': async (req, res, { body }) => {
      const data = JSON.parse(body || '{}');
      return json(res, 200, {
        received: data,
        result: 'AI processing stub',
        service: 'ai',
      });
    },
    'GET /agents': async (req, res) =>
      json(res, 200, {
        agents: ['verification', 'pet', 'payment', 'notification', 'plant'],
      }),
  },
});
