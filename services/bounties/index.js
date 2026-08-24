'use strict';

/**
 * Bounties microservice.
 * Wraps bounty concerns (see src/controllers/bountyController.js in the monolith).
 * In-memory store is a stand-in; wire to the Bounty model / DB in a follow-up.
 */

const { startService, json } = require('../_shared/service');

const PORT = parseInt(process.env.BOUNTIES_PORT || '8083', 10);

const bounties = [];

startService({
  name: 'bounties',
  port: PORT,
  handlers: {
    'GET /': async (req, res) => json(res, 200, { bounties }),
    'POST /': async (req, res, { body }) => {
      const data = JSON.parse(body || '{}');
      const bounty = {
        id: bounties.length + 1,
        status: 'open',
        ...data,
        createdAt: new Date().toISOString(),
      };
      bounties.push(bounty);
      return json(res, 201, bounty);
    },
  },
});
