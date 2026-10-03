'use strict';

const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('MYZ Mongo ledger service', () => {
  let replset;
  let service;
  let Account;

  beforeAll(async () => {
    replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = replset.getUri();
    process.env.MYZ_LEDGER_ALLOWED_ACCOUNT_PREFIXES = 'marketplace:user:';
    jest.resetModules();

    const models = require('../src/models/MyzLedgerMongo');
    Account = models.MyzLedgerAccount;
    service = require('../src/services/myzLedgerMongoService');
    await service.ensureIndexes();
  }, 60000);

  afterAll(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.MYZ_LEDGER_ALLOWED_ACCOUNT_PREFIXES;
    await mongoose.disconnect();
    if (replset) await replset.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await service.ensureIndexes();
    await Account.create({
      accountId: 'marketplace:user:alice',
      balanceUnits: mongoose.Types.Decimal128.fromString('100000000000000000000')
    });
  });

  test('transfers atomically and replays the original transfer', async () => {
    const input = {
      from_account_id: 'marketplace:user:alice',
      to_account_id: 'marketplace:user:bob',
      amount_myz: '30',
      transfer_id: 'MYZ-MONGO-1',
      idempotency_key: 'idem-mongo-1',
      reference: { order_id: 'ORDER-1' }
    };

    const first = await service.transfer(input);
    expect(first.duplicate).toBe(false);
    expect(first.fromBalanceMyz).toBe('70');
    expect(first.toBalanceMyz).toBe('30');

    const replay = await service.transfer(input);
    expect(replay.duplicate).toBe(true);
    expect(replay.debitEntry.entry_id).toBe(first.debitEntry.entry_id);
    expect(replay.creditEntry.entry_id).toBe(first.creditEntry.entry_id);
  });

  test('rejects changed payload under the same idempotency key', async () => {
    await service.transfer({
      from_account_id: 'marketplace:user:alice',
      to_account_id: 'marketplace:user:bob',
      amount_myz: '10',
      idempotency_key: 'same-key'
    });

    await expect(service.transfer({
      from_account_id: 'marketplace:user:alice',
      to_account_id: 'marketplace:user:bob',
      amount_myz: '11',
      idempotency_key: 'same-key'
    })).rejects.toMatchObject({ code: 'MYZ_LEDGER_IDEMPOTENCY_CONFLICT' });
  });

  test('never permits a negative source balance', async () => {
    await expect(service.transfer({
      from_account_id: 'marketplace:user:alice',
      to_account_id: 'marketplace:user:bob',
      amount_myz: '101',
      idempotency_key: 'too-much'
    })).rejects.toMatchObject({ code: 'INSUFFICIENT_MYZ_BALANCE' });

    const balance = await service.getBalance('marketplace:user:alice');
    expect(balance.balanceMyz).toBe('100');
  });

  test('concurrent attempts cannot overspend the account', async () => {
    const make = index => service.transfer({
      from_account_id: 'marketplace:user:alice',
      to_account_id: 'marketplace:user:bob',
      amount_myz: '60',
      idempotency_key: 'concurrent-' + index
    });

    const results = await Promise.allSettled([make(1), make(2)]);
    expect(results.filter(item => item.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(item => item.status === 'rejected')).toHaveLength(1);

    const alice = await service.getBalance('marketplace:user:alice');
    const bob = await service.getBalance('marketplace:user:bob');
    expect(alice.balanceMyz).toBe('40');
    expect(bob.balanceMyz).toBe('60');
  });
});
