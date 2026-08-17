jest.mock('axios', () => ({
  post: jest.fn(),
}));

const axios = require('axios');
const { verifyXmrPayment } = require('../src/services/xmrVerifier');

const TXID = 'a'.repeat(64);
const ADDRESS = '48xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.XMR_WALLET_RPC_URL = 'http://wallet-rpc.test/json_rpc';
  process.env.XMR_REQUIRED_CONFIRMATIONS = '10';
});

afterAll(() => {
  delete process.env.XMR_WALLET_RPC_URL;
  delete process.env.XMR_REQUIRED_CONFIRMATIONS;
});

test('verifies txid, recipient, amount and confirmations using wallet RPC', async () => {
  axios.post.mockResolvedValue({
    data: {
      result: {
        transfer: {
          txid: TXID,
          address: ADDRESS,
          amount: 50000000000,
          confirmations: 12,
          type: 'out',
        },
      },
    },
  });

  await expect(verifyXmrPayment({
    txid: TXID,
    address: ADDRESS,
    amount: 0.05,
    currency: 'XMR',
  })).resolves.toMatchObject({ verified: true, confirmations: 12 });

  expect(axios.post).toHaveBeenCalledWith(
    'http://wallet-rpc.test/json_rpc',
    expect.objectContaining({
      method: 'get_transfer_by_txid',
      params: { txid: TXID },
    }),
    expect.objectContaining({ timeout: 10000 })
  );
});

test('fails closed when recipient does not match', async () => {
  axios.post.mockResolvedValue({
    data: {
      result: {
        transfer: {
          txid: TXID,
          address: 'different-address',
          amount: 50000000000,
          confirmations: 12,
          type: 'out',
        },
      },
    },
  });

  await expect(verifyXmrPayment({
    txid: TXID,
    address: ADDRESS,
    amount: 0.05,
    currency: 'XMR',
  })).resolves.toMatchObject({ verified: false, reason: 'recipient mismatch' });
});

test('fails closed when confirmations are insufficient', async () => {
  axios.post.mockResolvedValue({
    data: {
      result: {
        transfer: {
          txid: TXID,
          address: ADDRESS,
          amount: 50000000000,
          confirmations: 2,
          type: 'out',
        },
      },
    },
  });

  await expect(verifyXmrPayment({
    txid: TXID,
    address: ADDRESS,
    amount: 0.05,
    currency: 'XMR',
  })).resolves.toMatchObject({ verified: false, reason: 'insufficient confirmations' });
});

test('requires wallet RPC configuration', async () => {
  delete process.env.XMR_WALLET_RPC_URL;
  await expect(verifyXmrPayment({
    txid: TXID,
    address: ADDRESS,
    amount: 0.05,
    currency: 'XMR',
  })).rejects.toThrow('XMR_WALLET_RPC_URL is not configured');
});
