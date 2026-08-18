const test = require('node:test');
const assert = require('node:assert/strict');
const { validateObserved, extractTransferFromReceipt } = require('../src/verifier');

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

test('extracts a committed MYZ transfer from the Tari Ootle indexer receipt', () => {
  const receipt = {
    result: {
      Finalized: {
        final_decision: 'Commit',
        execution_result: {
          finalize: {
            transaction_hash: 'tx-123',
            events: [{
              topic: 'MYZ_TRANSFER',
              payload: {
                resource_address: 'resource_myz',
                recipient: 'recipient-1',
                amount: '25',
              },
            }],
          },
        },
      },
    },
  };

  assert.deepEqual(
    extractTransferFromReceipt(receipt, {
      txid: 'tx-123',
      resourceAddress: 'resource_myz',
      eventTopic: 'MYZ_TRANSFER',
    }),
    {
      txid: 'tx-123',
      recipient: 'recipient-1',
      asset: 'MYZ',
      amount: '25',
      transactionStatus: 'confirmed',
    },
  );
});

test('does not accept a different resource or event topic', () => {
  const receipt = {
    result: {
      Finalized: {
        final_decision: 'Commit',
        execution_result: {
          finalize: {
            transaction_hash: 'tx-123',
            events: [{
              topic: 'OTHER_EVENT',
              payload: { resource_address: 'other_resource', recipient: 'recipient-1', amount: '25' },
            }],
          },
        },
      },
    },
  };

  assert.equal(extractTransferFromReceipt(receipt, {
    txid: 'tx-123',
    resourceAddress: 'resource_myz',
    eventTopic: 'MYZ_TRANSFER',
  }), null);
});

test('does not accept an aborted transaction', () => {
  const receipt = {
    result: {
      Finalized: {
        final_decision: { Abort: 'some-reason' },
        execution_result: null,
      },
    },
  };

  assert.equal(extractTransferFromReceipt(receipt, {
    txid: 'tx-123',
    resourceAddress: 'resource_myz',
    eventTopic: 'MYZ_TRANSFER',
  }), null);
});
