'use strict';

/**
 * paymentDashboard routes — myzubster#306
 *
 * Covers role separation, contributor scoping, filters and the empty/error
 * states the issue asks to be shown explicitly.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const paymentDashboardRoutes = require('../src/routes/paymentDashboardRoutes');

const SECRET = 'test-secret-for-payment-dashboard';

function app() {
  const server = express();
  server.use('/api/payment-dashboard', paymentDashboardRoutes);
  return server;
}

function tokenFor(claims) {
  return `Bearer ${jwt.sign(claims, SECRET, { expiresIn: '10m' })}`;
}

const ADMIN = tokenFor({ userId: 'admin-1', role: 'admin' });
const CONTRIBUTOR = tokenFor({ userId: 'u-1', role: 'contributor', github: 'Luzijano' });
const OUTSIDER = tokenFor({ userId: 'u-2', role: 'contributor', github: 'nobody' });

let originalSecret;

beforeAll(() => {
  originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = SECRET;
});

afterAll(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

describe('authentication', () => {
  test('rejects a request without a token', async () => {
    const res = await request(app()).get('/api/payment-dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No token/i);
  });

  test('rejects a malformed token', async () => {
    const res = await request(app()).get('/api/payment-dashboard/summary').set('Authorization', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  test('reports 503 when JWT_SECRET is not configured', async () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      const res = await request(app()).get('/api/payment-dashboard/summary').set('Authorization', ADMIN);
      expect(res.status).toBe(503);
      expect(res.body.error).toMatch(/not configured/i);
    } finally {
      process.env.JWT_SECRET = saved;
    }
  });
});

describe('role separation', () => {
  test('a contributor cannot read treasury funding inputs', async () => {
    const res = await request(app()).get('/api/payment-dashboard/funding-inputs').set('Authorization', CONTRIBUTOR);
    expect(res.status).toBe(403);
  });

  test('a contributor cannot read the available balance', async () => {
    const res = await request(app()).get('/api/payment-dashboard/available-balance').set('Authorization', CONTRIBUTOR);
    expect(res.status).toBe(403);
  });

  test('a contributor cannot read the conversion layer', async () => {
    const res = await request(app()).get('/api/payment-dashboard/conversion').set('Authorization', CONTRIBUTOR);
    expect(res.status).toBe(403);
  });

  test('an admin can read treasury layers', async () => {
    const res = await request(app()).get('/api/payment-dashboard/funding-inputs').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.items).toEqual([]);
  });
});

describe('summary payload', () => {
  test('exposes the six layers separately', async () => {
    const res = await request(app()).get('/api/payment-dashboard/summary').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.layers)).toEqual(
      expect.arrayContaining([
        'funding_inputs',
        'available_balance',
        'conversion',
        'escrow',
        'bounty_rewards',
        'xmr_payouts'
      ])
    );
  });

  test('never reports an XMR balance', async () => {
    const res = await request(app()).get('/api/payment-dashboard/summary').set('Authorization', ADMIN);
    expect(res.body.balances.xmr.amount).toBeNull();
  });

  test('reports the MYZ balance with its basis and source', async () => {
    const res = await request(app()).get('/api/payment-dashboard/balances').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.myz.amount).toBe(80);
    expect(res.body.myz.onChain).toBe(false);
    expect(res.body.myz.source).toBe('myz/ledger.json');
    expect(res.body.myz.basis).toMatch(/RECORDED/);
  });

  test('exposes the published policy state chain', async () => {
    const res = await request(app()).get('/api/payment-dashboard/meta').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.policy.states).toEqual(expect.arrayContaining(['BOUNTY_APPROVED', 'XMR_PAID', 'SETTLEMENT_FAILED']));
    expect(res.body.policy.rules.incoming_funds_do_not_approve_bounties).toBe(true);
    expect(res.body.policy.rules.stripe_is_not_xmr_converter).toBe(true);
  });
});

describe('contributor scoping', () => {
  test('a contributor sees only their own bounty rewards', async () => {
    const res = await request(app()).get('/api/payment-dashboard/bounties').set('Authorization', CONTRIBUTOR);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    res.body.items.forEach((item) => {
      expect(item.accountId).toBe('contributor:github:Luzijano');
    });
  });

  test('a contributor with no ledger entries sees an empty list, not samples', async () => {
    const res = await request(app()).get('/api/payment-dashboard/bounties').set('Authorization', OUTSIDER);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  test('the contributor summary narrows items but keeps the policy visible', async () => {
    const res = await request(app()).get('/api/payment-dashboard/summary').set('Authorization', OUTSIDER);
    expect(res.status).toBe(200);
    expect(res.body.layers.bounty_rewards.items).toEqual([]);
    expect(res.body.layers.xmr_payouts.items).toEqual([]);
    expect(res.body.policy.states).toEqual(expect.any(Array));
  });

  test('an admin is not narrowed', async () => {
    const res = await request(app()).get('/api/payment-dashboard/bounties').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});

describe('filters', () => {
  test('an unmatched query returns an empty result set', async () => {
    const res = await request(app())
      .get('/api/payment-dashboard/bounties?q=definitely-not-present')
      .set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  test('a program filter narrows the result set', async () => {
    const res = await request(app())
      .get('/api/payment-dashboard/bounties?program=gateway-marketing')
      .set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].program).toBe('gateway-marketing');
  });

  test('a status filter that matches nothing returns an empty result set', async () => {
    const res = await request(app())
      .get('/api/payment-dashboard/bounties?status=REVERSED')
      .set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  test('the settlement queue is empty and reported as such', async () => {
    const res = await request(app()).get('/api/payment-dashboard/payouts').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});

describe('escrow', () => {
  test('is reported as unconfigured rather than inferred from payout status', async () => {
    const res = await request(app()).get('/api/payment-dashboard/escrow').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.reason).toMatch(/unknown rather than derived/i);
    expect(res.body.items).toEqual([]);
  });
});
