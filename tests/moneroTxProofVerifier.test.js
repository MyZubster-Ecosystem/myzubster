'use strict';

const { createMoneroTxProofVerifier } = require('../src/services/moneroTxProofVerifier');

function request(overrides = {}) {
  return {
    txId: 'tx-1',
    recipient: '5-stagenet-recipient',
    asset: 'XMR',
    network: 'stagenet',
    amount: '0.15',
    ...overrides,
  };
}

describe('Monero tx proof verifier', () => {
  test('confirms matching proof at required depth', async () => {
    const submissionStore = {
      getByTxId: jest.fn(async () => ({
        txId: 'tx-1', recipient: '5-stagenet-recipient', amountAtomic: '150000000000', network: 'stagenet',
        proofMessage: 'myzubster-p0:idem-1', proofSignature: 'proof-1',
      })),
    };
    const verifierRpc = {
      checkTxProof: jest.fn(async () => ({ good: true, received: 150000000000, confirmations: 2, in_pool: false })),
    };
    const verifier = createMoneroTxProofVerifier({ verifierRpc, submissionStore, minConfirmations: 1 });

    await expect(verifier.verify(request())).resolves.toMatchObject({
      valid: true,
      transactionStatus: 'confirmed',
      checks: { recipient: true, asset: true, network: true, amount: true, transactionStatus: true },
    });
  });

  test('keeps a valid in-pool proof pending', async () => {
    const submissionStore = {
      getByTxId: jest.fn(async () => ({
        txId: 'tx-1', recipient: '5-stagenet-recipient', amountAtomic: '150000000000', network: 'stagenet',
        proofMessage: 'myzubster-p0:idem-1', proofSignature: 'proof-1',
      })),
    };
    const verifierRpc = { checkTxProof: jest.fn(async () => ({ good: true, received: 150000000000, confirmations: 0, in_pool: true })) };
    const verifier = createMoneroTxProofVerifier({ verifierRpc, submissionStore, minConfirmations: 1 });

    const result = await verifier.verify(request());
    expect(result.valid).toBe(false);
    expect(result.transactionStatus).toBe('pending');
  });

  test('rejects evidence that does not match the requested amount', async () => {
    const submissionStore = {
      getByTxId: jest.fn(async () => ({
        txId: 'tx-1', recipient: '5-stagenet-recipient', amountAtomic: '140000000000', network: 'stagenet',
        proofMessage: 'myzubster-p0:idem-1', proofSignature: 'proof-1',
      })),
    };
    const verifierRpc = { checkTxProof: jest.fn() };
    const verifier = createMoneroTxProofVerifier({ verifierRpc, submissionStore });

    const result = await verifier.verify(request());
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/does not match/);
    expect(verifierRpc.checkTxProof).not.toHaveBeenCalled();
  });
});
