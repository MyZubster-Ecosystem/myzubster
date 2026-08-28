'use strict';

/**
 * Notifications microservice.
 * Wraps notification concerns (see services/notification in the monolith).
 * In-memory history is a stand-in; wire to the notifier/DB in a follow-up.
 */

const { startService, json } = require('../_shared/service');

const PORT = parseInt(process.env.NOTIFICATIONS_PORT || '8085', 10);

const history = [];

startService({
  name: 'notifications',
  port: PORT,
  handlers: {
    'POST /notify': async (req, res, { body }) => {
      const data = JSON.parse(body || '{}');
      const entry = {
        id: history.length + 1,
        ...data,
        sentAt: new Date().toISOString(),
      };
      history.push(entry);
      return json(res, 201, entry);
    },
    'GET /history': async (req, res) => json(res, 200, { history }),
  },
});
