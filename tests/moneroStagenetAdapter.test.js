'use strict';

const { xmrToAtomicString } = require('../src/services/moneroAmount');
const { createMoneroStagenetAdapter } = require('../src/services/moneroStagenetAdapter');

function request(overrides = {}) {
  return {
    amount: '0.15',
    asset: 'XMR',
    network: 'stagenet',
    recipient: '5-stagenet-recipient',
    attemptId: 'attempt-1',
    idempotencyKey: 'idem-1',
    ...overrides,
  };
}

describe('Monero stagenet adapter', () => {
  test('converts XMR to exact atomic units', () => {
    expect(xmrToAtomicString('0.15')).toBe('150000000000');
    expect(xmrToAtomicString('1.000000000001')).toBe('1000000000001');
    expect(() => xmrToAtomicString('0.0000000000001')).toThrow(/at most 12/);
  });

  test('persists do_not_relay metadata before relay and generates proof', async () => {
    const events = [];
    let stored = null;
    const submissionStore = {
      getByIdempotencyKey: jest.fn(async () => null),
      prepare: jest.fn(async data => {
        events.push('persist');
        stored = { ...data, network: 'stagenet', state: 'PREPARED', proofSignature: null };
        return { submission: stored, replay: false };
      }),
      markRelayed: jest.fn(async () => {
        events.push('mark-relayed');
        stored = { ...stored, state: 'RELAYED', txMetadata: null };
        return stored;
      }),
      saveProof: jest.fn(async ({ message, signature }) => {
        events.push('save-proof');
        stored = { ...stored, proofMessage: message, proofSignature: signature };
        return stored;
      }),
    };
    const walletRpc = {
      transfer: jest.fn(async params => {
        events.push('prepare-rpc');
        expect(params.do_not_relay).toBe(true);
        expect(params.get_tx_metadata).toBe(true);
        expect(params.destinations[0].amount).toBe(150000000000);
        return { tx_hash: 'tx-1', tx_metadata: 'metadata-1' };
      }),
      relayTx: jest.fn(async metadata => {
        events.push('relay-rpc');
        expect(metadata).toBe('metadata-1');
        return { tx_hash: 'tx-1' };
      }),
      getTransferByTxId: jest.fn(),
      getTxProof: jest.fn(async () => {
        events.push('proof-rpc');
        return { signature: 'proof-1' };
      }),
    };

    const adapter = createMoneroStagenetAdapter({ walletRpc, submissionStore, allowRelay: true });
    const result = await adapter.submit(request());

    expect(result.txId).toBe('tx-1');
    expect(events).toEqual(['prepare-rpc', 'persist', 'relay-rpc', 'mark-relayed', 'proof-rpc', 'save-proof']);
  });

  test('recovers a prepared transaction by relaying the same metadata without creating a second transfer', async () => {
    let state = {
      idempotencyKey: 'idem-1', attemptId: 'attempt-1', recipient: '5-stagenet-recipient',
      amountAtomic: '150000000000', txId: 'tx-1', txMetadata: 'metadata-1', network: 'stagenet', state: 'PREPARED',
    };
    const submissionStore = {
      getByIdempotencyKey: jest.fn(async () => state),
      markRelayed: jest.fn(async () => (state = { ...state, state: 'RELAYED', txMetadata: null })),
      saveProof: jest.fn(async () => state),
      prepare: jest.fn(),
    };
    const walletRpc = {
      transfer: jest.fn(),
      relayTx: jest.fn(async () => ({ tx_hash: 'tx-1' })),
      getTransferByTxId: jest.fn(),
      getTxProof: jest.fn(async () => ({ signature: 'proof-1' })),
    };

    const adapter = createMoneroStagenetAdapter({ walletRpc, submissionStore, allowRelay: true });
    const recovered = await adapter.recoverSubmission(request());

    expect(recovered).toMatchObject({ txId: 'tx-1', recovered: true });
    expect(walletRpc.transfer).not.toHaveBeenCalled();
    expect(walletRpc.relayTx).toHaveBeenCalledTimes(1);
  });

  test('does not create or relay a transaction when relay guard is disabled', async () => {
    const submissionStore = { getByIdempotencyKey: jest.fn(async () => null), prepare: jest.fn() };
    const walletRpc = { transfer: jest.fn(), relayTx: jest.fn() };
    const adapter = createMoneroStagenetAdapter({ walletRpc, submissionStore, allowRelay: false });

    await expect(adapter.submit(request())).rejects.toMatchObject({ definitelyNotSubmitted: true });
    expect(walletRpc.transfer).not.toHaveBeenCalled();
  });

  test('recovery with no durable record is definitively not submitted', async () => {
    const submissionStore = { getByIdempotencyKey: jest.fn(async () => null), prepare: jest.fn() };
    const walletRpc = { transfer: jest.fn(), relayTx: jest.fn() };
    const adapter = createMoneroStagenetAdapter({ walletRpc, submissionStore, allowRelay: true });

    await expect(adapter.recoverSubmission(request())).resolves.toMatchObject({ definitivelyNotSubmitted: true });
  });
});
