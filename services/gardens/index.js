'use strict';

/**
 * Gardens microservice.
 * Wraps urban garden + plant concerns
 * (see src/controllers/urbanGardenController.js, plantController.js in the monolith).
 * In-memory store is a stand-in; wire to the models / DB in a follow-up.
 */

const { startService, json } = require('../_shared/service');

const PORT = parseInt(process.env.GARDENS_PORT || '8082', 10);

const gardens = [];

startService({
  name: 'gardens',
  port: PORT,
  handlers: {
    'GET /': async (req, res) => json(res, 200, { gardens }),
    'POST /': async (req, res, { body }) => {
      const data = JSON.parse(body || '{}');
      const garden = {
        id: gardens.length + 1,
        ...data,
        createdAt: new Date().toISOString(),
      };
      gardens.push(garden);
      return json(res, 201, garden);
    },
    'GET /plants': async (req, res) =>
      json(res, 200, { plants: [], note: 'plant catalog' }),
  },
});
