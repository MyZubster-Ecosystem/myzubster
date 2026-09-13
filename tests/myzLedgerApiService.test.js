const fs = require('fs');
const os = require('os');
const path = require('path');
const { MyzLedgerApiService } = require('../src/services/myzLedgerApiService');

function tempLedger(entries) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'myz-ledger-'));
  const file = path.join(dir, 'ledger.json');
  fs.writeFileSync(file, JSON.stringify({
    schema: 'myzubster-myz-ledger/v1',
    asset: 'MYZ',
    asset_type: 'internal-reward-accounting-unit',
    on_chain: false,
    entries,
    integrity: { canonicalization: 'json-key-sort-v1', sha256: null, signature: null },
    notes: []
  }, null, 2));
  return { dir, file };
}

function entry(overrides = {}) {
  return {
    entry_id: overrides.entry_id || `E-${Math.random()}`,
    timestamp: new Date().toISOString(),
    account_id: 'marketplace:user:alice',
    amount_myz: '100',
    entry_type: 'BOUNTY_REWARD',
    reference: {},
    status: 'RECORDED',
    evidence: [],
    reverses_entry_id: null,
    note: 'test',
    ...overrides
  };
}

describe('MyzLedgerApiService', () => {
  test('computes exact balance and returns a stable revision', () => {
    const { dir, file } = tempLedger([
      entry({ entry_id: 'A', amount_myz: '100.000000000000000001' }),
      entry({ entry_id: 'B', amount_myz: '-0.000000000000000001', entry_type: 'ADJUSTMENT_DEBIT' })
    ]);
    try {
      const service = new MyzLedgerApiService({ ledgerPath: file });
      const result = service.getBalance('marketplace:user:alice');
      expect(result.balanceMyz).toBe('100');
      expect(result.revision).toMatch(/^[a-f0-9]{64}$/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('honors recorded reversal semantics', () => {
    const { dir, file } = tempLedger([
      entry({ entry_id: 'A', amount_myz: '40' }),
      entry({ entry_id: 'R', amount_myz: '-40', entry_type: 'REVERSAL', reverses_entry_id: 'A' })
    ]);
    try {
      const service = new MyzLedgerApiService({ ledgerPath: file });
      expect(service.getBalance('marketplace:user:alice').balanceMyz).toBe('0');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('appends an idempotent debit and verifies persistence', () => {
    const { dir, file } = tempLedger([entry({ entry_id: 'A', amount_myz: '100' })]);
    try {
      const service = new MyzLedgerApiService({ ledgerPath: file });
      const payload = {
        account_id: 'marketplace:user:alice',
        amount_myz: '-25.5',
        idempotency_key: 'redeem-123',
        reference: { redemption_id: 'RED-123' },
        evidence: ['sha256:abc']
      };
      const first = service.appendDebit(payload);
      const second = service.appendDebit(payload);
      expect(first.duplicate).toBe(false);
      expect(first.entry.status).toBe('RECORDED');
      expect(first.entry.amount_myz).toBe('-25.5');
      expect(second.duplicate).toBe(true);
      expect(second.entry.entry_id).toBe(first.entry.entry_id);
      expect(service.getBalance('marketplace:user:alice').balanceMyz).toBe('74.5');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('looks up canonical debit evidence by redemption and reports reversal state', () => {
    const { dir, file } = tempLedger([
      entry({ entry_id: 'OPEN', amount_myz: '100' }),
      entry({
        entry_id: 'DEBIT-1',
        amount_myz: '-25',
        entry_type: 'ADJUSTMENT_DEBIT',
        reference: { idempotency_key: 'redeem-lookup', redemption_id: 'RED-LOOKUP', provider_transaction_id: 'P-TX-1' }
      }),
      entry({ entry_id: 'REV-1', amount_myz: '25', entry_type: 'REVERSAL', reverses_entry_id: 'DEBIT-1' })
    ]);
    try {
      const service = new MyzLedgerApiService({ ledgerPath: file });
      const result = service.lookupEntries({ accountId: 'marketplace:user:alice', redemptionId: 'RED-LOOKUP' });
      expect(result.schema).toBe('myzubster-myz-ledger-lookup/v1');
      expect(result.matched).toBe(1);
      expect(result.entries[0].entry_id).toBe('DEBIT-1');
      expect(result.entries[0].reversed).toBe(true);
      expect(result.entries[0].reversalEntryId).toBe('REV-1');
      expect(result.revision).toMatch(/^[a-f0-9]{64}$/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('rejects canonical lookup without a selector', () => {
    const { dir, file } = tempLedger([entry({ entry_id: 'A', amount_myz: '10' })]);
    try {
      const service = new MyzLedgerApiService({ ledgerPath: file });
      expect(() => service.lookupEntries({ accountId: 'marketplace:user:alice' }))
        .toThrow('At least one canonical ledger lookup selector is required');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('rejects idempotency replay with a different payload', () => {
    const { dir, file } = tempLedger([entry({ entry_id: 'A', amount_myz: '100' })]);
    try {
      const service = new MyzLedgerApiService({ ledgerPath: file });
      service.appendDebit({ account_id: 'marketplace:user:alice', amount_myz: '-10', idempotency_key: 'same-key' });
      expect(() => service.appendDebit({ account_id: 'marketplace:user:alice', amount_myz: '-11', idempotency_key: 'same-key' }))
        .toThrow('Idempotency key already exists with a different ledger payload');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('fails closed on insufficient balance', () => {
    const { dir, file } = tempLedger([entry({ entry_id: 'A', amount_myz: '10' })]);
    try {
      const service = new MyzLedgerApiService({ ledgerPath: file });
      expect(() => service.appendDebit({
        account_id: 'marketplace:user:alice',
        amount_myz: '-11',
        idempotency_key: 'redeem-too-much'
      })).toThrow('Insufficient canonical MYZ balance');
      expect(service.getBalance('marketplace:user:alice').balanceMyz).toBe('10');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('enforces authorized account namespaces', () => {
    const { dir, file } = tempLedger([entry({ entry_id: 'A', amount_myz: '10' })]);
    try {
      const service = new MyzLedgerApiService({ ledgerPath: file, allowedAccountPrefixes: 'marketplace:user:' });
      expect(() => service.getBalance('admin:treasury')).toThrow('outside the authorized MYZ ledger namespace');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
