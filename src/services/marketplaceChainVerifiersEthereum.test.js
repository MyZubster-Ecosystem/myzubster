'use strict';

const { verifyEthereumSepoliaPayment } = require('./marketplaceChainVerifiers');

describe('Ethereum Sepolia payment verifier', () => {
  const previousFetch = global.fetch;
  const previousRpc = process.env.ETH_SEPOLIA_RPC_URL;

  beforeEach(() => {
    process.env.ETH_SEPOLIA_RPC_URL = 'https://rpc.example.test';
  });

  afterEach(() => {
    global.fetch = previousFetch;
    if (previousRpc === undefined) delete process.env.ETH_SEPOLIA_RPC_URL;
    else process.env.ETH_SEPOLIA_RPC_URL = previousRpc;
  });

  function rpcFetch({ from = '0x1111111111111111111111111111111111111111', to = '0x2222222222222222222222222222222222222222', value = '0xde0b6b3a7640000', status = '0x1', blockNumber = '0x64', latest = '0x66' } = {}) {
    global.fetch = jest.fn(async (_url, options) => {
      const body = JSON.parse(options.body);
      let result;
      if (body.method === 'eth_getTransactionByHash') result = { from, to, value };
      else if (body.method === 'eth_getTransactionReceipt') result = { status, blockNumber };
      else if (body.method === 'eth_blockNumber') result = latest;
      else throw new Error('unexpected RPC method');
      return {
        ok:true,
        async json(){ return { jsonrpc:'2.0', id:1, result }; }
      };
    });
  }

  test('verifies sender, recipient, amount, successful receipt and confirmations', async () => {
    rpcFetch();
    const evidence = await verifyEthereumSepoliaPayment({
      txHash:'0xtest',
      expectedSender:'0x1111111111111111111111111111111111111111',
      expectedAddress:'0x2222222222222222222222222222222222222222',
      expectedAmountWei:'1000000000000000000',
      minConfirmations:3
    });

    expect(evidence.verified).toBe(true);
    expect(evidence.reason).toBeNull();
    expect(evidence.senderMatches).toBe(true);
    expect(evidence.recipientMatches).toBe(true);
    expect(evidence.confirmations).toBe(3);
  });

  test('rejects a transaction sent by a different wallet', async () => {
    rpcFetch({ from:'0x3333333333333333333333333333333333333333' });
    const evidence = await verifyEthereumSepoliaPayment({
      txHash:'0xwrong-sender',
      expectedSender:'0x1111111111111111111111111111111111111111',
      expectedAddress:'0x2222222222222222222222222222222222222222',
      expectedAmountWei:'1000000000000000000',
      minConfirmations:3
    });

    expect(evidence.verified).toBe(false);
    expect(evidence.reason).toBe('SENDER_MISMATCH');
  });

  test('keeps a valid transaction confirming until the required block depth', async () => {
    rpcFetch({ latest:'0x65' });
    const evidence = await verifyEthereumSepoliaPayment({
      txHash:'0xconfirming',
      expectedSender:'0x1111111111111111111111111111111111111111',
      expectedAddress:'0x2222222222222222222222222222222222222222',
      expectedAmountWei:'1000000000000000000',
      minConfirmations:3
    });

    expect(evidence.verified).toBe(false);
    expect(evidence.reason).toBe('INSUFFICIENT_CONFIRMATIONS');
    expect(evidence.confirmations).toBe(2);
  });
});
