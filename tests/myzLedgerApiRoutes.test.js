const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

function makeLedger() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'myz-ledger-api-'));
  const file = path.join(dir, 'ledger.json');
  fs.writeFileSync(file, JSON.stringify({
    schema: 'myzubster-myz-ledger/v1',
    asset: 'MYZ',
    asset_type: 'internal-reward-accounting-unit',
    on_chain: false,
    entries: [{
      entry_id: 'A',
      timestamp: new Date().toISOString(),
      account_id: 'marketplace:user:alice',
      amount_myz: '100',
      entry_type: 'BOUNTY_REWARD',
      reference: {},
      status: 'RECORDED',
      evidence: [],
      reverses_entry_id: null,
      note: 'fixture'
    }],
    integrity: { canonicalization: 'json-key-sort-v1', sha256: null, signature: null },
    notes: []
  }, null, 2));
  return { dir, file };
}

describe('MYZ ledger API routes', () => {
  let dir;
  let app;

  beforeEach(() => {
    const fixture = makeLedger();
    dir = fixture.dir;
    process.env.MYZ_LEDGER_PATH = fixture.file;
    process.env.MYZ_LEDGER_SERVICE_TOKEN = 'test-ledger-secret';
    process.env.MYZ_LEDGER_ALLOWED_ACCOUNT_PREFIXES = 'marketplace:user:';
    jest.resetModules();
    const router = require('../src/routes/myzLedgerApiRoutes');
    app = express();
    app.use(express.json());
    app.use('/v1/myz', router);
  });

  afterEach(() => {
    delete process.env.MYZ_LEDGER_PATH;
    delete process.env.MYZ_LEDGER_SERVICE_TOKEN;
    delete process.env.MYZ_LEDGER_ALLOWED_ACCOUNT_PREFIXES;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('rejects requests without service authentication', async () => {
    const response = await request(app).get('/v1/myz/accounts/marketplace%3Auser%3Aalice/balance');
    expect(response.status).toBe(401);
  });

  test('reads balance and appends debit using Marketplace Idempotency-Key header', async () => {
    const auth = { Authorization: 'Bearer test-ledger-secret' };
    const balance = await request(app)
      .get('/v1/myz/accounts/marketplace%3Auser%3Aalice/balance')
      .set(auth);
    expect(balance.status).toBe(200);
    expect(balance.body.balanceMyz).toBe('100');

    const payload = {
      schema: 'myzubster-myz-ledger-entry-request/v1',
      asset: 'MYZ',
      account_id: 'marketplace:user:alice',
      amount_myz: '-25.5',
      entry_type: 'ADJUSTMENT_DEBIT',
      status: 'RECORDED',
      reference: { redemption_id: 'RED-1', provider_transaction_id: 'tx-1' },
      evidence: ['sha256:abc']
    };

    const first = await request(app)
      .post('/v1/myz/entries')
      .set(auth)
      .set('Idempotency-Key', 'myz-ledger-debit-red-1')
      .send(payload);
    expect(first.status).toBe(201);
    expect(first.body.status).toBe('RECORDED');
    expect(first.body.amount_myz).toBe('-25.5');

    const replay = await request(app)
      .post('/v1/myz/entries')
      .set(auth)
      .set('Idempotency-Key', 'myz-ledger-debit-red-1')
      .send(payload);
    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);
    expect(replay.body.entry_id).toBe(first.body.entry_id);

    const after = await request(app)
      .get('/v1/myz/accounts/marketplace%3Auser%3Aalice/balance')
      .set(auth);
    expect(after.body.balanceMyz).toBe('74.5');
  });

  test('creates an atomic idempotent transfer and exposes account history', async () => {
    const auth = { Authorization: 'Bearer test-ledger-secret' };
    const payload = {
      from_account_id: 'marketplace:user:alice',
      to_account_id: 'marketplace:user:bob',
      amount_myz: '30',
      transfer_id: 'MYZ-TEST-TRANSFER-1',
      reference: { type: 'MARKETPLACE_ORDER', order_id: 'ORDER-1' }
    };

    const first = await request(app)
      .post('/v1/myz/transfers')
      .set(auth)
      .set('Idempotency-Key', 'transfer-order-1')
      .send(payload);
    expect(first.status).toBe(201);
    expect(first.body.asset).toBe('MYZ');
    expect(first.body.on_chain).toBe(false);
    expect(first.body.transfer_id).toBe('MYZ-TEST-TRANSFER-1');
    expect(first.body.debit_entry.amount_myz).toBe('-30');
    expect(first.body.credit_entry.amount_myz).toBe('30');
    expect(first.body.from_balance_myz).toBe('70');
    expect(first.body.to_balance_myz).toBe('30');

    const replay = await request(app)
      .post('/v1/myz/transfers')
      .set(auth)
      .set('Idempotency-Key', 'transfer-order-1')
      .send(payload);
    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);
    expect(replay.body.debit_entry.entry_id).toBe(first.body.debit_entry.entry_id);
    expect(replay.body.credit_entry.entry_id).toBe(first.body.credit_entry.entry_id);

    const history = await request(app)
      .get('/v1/myz/accounts/marketplace%3Auser%3Abob/history')
      .set(auth);
    expect(history.status).toBe(200);
    expect(history.body.balanceMyz).toBe('30');
    expect(history.body.entries[0].transfer_id).toBe('MYZ-TEST-TRANSFER-1');
  });

});
