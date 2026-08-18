const test = require('node:test');
const assert = require('node:assert/strict');
const { validateObserved } = require('../src/verifier');

const expected = {
  txid: 'tx-123',
  recipient: 'recipient-1',
  asset: 'MYZ',
  network: 'tari-mainnet',
  amount: 25,
  transactionStatus: 'confirmed',
};

test('accepts an exact confirmed transaction', () => {
  const result = validateObserved(expected, { ...expected });
  assert.equal(result.verified, true);
  assert.equal(result.txid, expected.txid);
  assert.equal(result.recipient, expected.recipient);
  assert.equal(result.asset, 'MYZ');
  assert.equal(result.network, expected.network);
  assert.equal(result.amount, 25);
  assert.equal(result.transactionStatus, 'confirmed');
  assert.deepEqual(result.checks, {
    txid: true,
    recipient: true,
    asset: true,
    network: true,
    amount: true,
    transactionStatus: true,
  });
});

for (const [name, change] of [
  ['txid', { txid: 'other' }],
  ['recipient', { recipient: 'other' }],
  ['asset', { asset: 'XMR' }],
  ['network', { network: 'tari-testnet' }],
  ['amount', { amount: 24 }],
  ['status', { transactionStatus: 'pending' }],
]) {
  test(`fails closed on ${name} mismatch`, () => {
    const result = validateObserved(expected, { ...expected, ...change });
    assert.equal(result.verified, false);
  });
}

test('rejects malformed upstream data', () => {
  assert.equal(validateObserved(expected, null).verified, false);
  assert.equal(validateObserved(expected, { txid: expected.txid }).verified, false);
});
