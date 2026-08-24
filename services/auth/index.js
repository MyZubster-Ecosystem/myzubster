'use strict';

/**
 * Auth microservice.
 * Wraps authentication concerns (see src/controllers/authController.js in the monolith).
 * In-memory store is a stand-in; wire to the User model / DB in a follow-up.
 */

const { startService, json } = require('../_shared/service');

const PORT = parseInt(process.env.AUTH_PORT || '8081', 10);

const users = new Map();
const tokens = new Map();

function makeToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

startService({
  name: 'auth',
  port: PORT,
  handlers: {
    'POST /register': async (req, res, { body }) => {
      const { email, password } = JSON.parse(body || '{}');
      if (!email || !password) {
        return json(res, 400, { error: 'email and password are required' });
      }
      if (users.has(email)) {
        return json(res, 409, { error: 'user already exists' });
      }
      users.set(email, { email, password });
      return json(res, 201, { created: true, email });
    },
    'POST /login': async (req, res, { body }) => {
      const { email, password } = JSON.parse(body || '{}');
      const user = users.get(email);
      if (!user || user.password !== password) {
        return json(res, 401, { error: 'invalid credentials' });
      }
      const token = makeToken();
      tokens.set(token, email);
      return json(res, 200, { token, email });
    },
    'GET /me': async (req, res) => {
      const auth = req.headers.authorization || '';
      const token = auth.replace(/^Bearer\s+/i, '');
      const email = tokens.get(token);
      if (!email) {
        return json(res, 401, { error: 'unauthorized' });
      }
      return json(res, 200, { email });
    },
  },
});
