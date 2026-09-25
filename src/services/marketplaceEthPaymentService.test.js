'use strict';

const {
  ETH_PAYMENT_CHAIN_ID,
  ETH_PAYMENT_CHAIN_HEX,
  calculateOrderWei,
  initializeEthPaymentIntent
} = require('./marketplaceEthPaymentService');

describe('Marketplace Sepolia ETH payment intent', () => {
  test('calculates total wei from unit ETH price and quantity without floating multiplication', () => {
    const order = { quantity:3, snapshot:{ price:0.1, currency:'ETH' } };
    expect(calculateOrderWei(order).toString()).toBe('300000000000000000');
  });

  test('builds a testnet payment intent from verified buyer and seller wallets', () => {
    const order = {
      status:'ACCEPTED',
      quantity:2,
      snapshot:{ price:0.01, currency:'ETH' },
      payment:{ status:'AWAITING_PAYMENT' }
    };
    const buyer = { evmWallet:{ status:'WALLET_VERIFIED', address:'0x1111111111111111111111111111111111111111' } };
    const seller = { evmWallet:{ status:'WALLET_VERIFIED', address:'0x2222222222222222222222222222222222222222' } };

    const intent = initializeEthPaymentIntent({ order, buyer, seller });

    expect(intent.network).toBe('sepolia');
    expect(intent.chainId).toBe(ETH_PAYMENT_CHAIN_ID);
    expect(intent.chainHex).toBe(ETH_PAYMENT_CHAIN_HEX);
    expect(intent.expectedSender).toBe('0x1111111111111111111111111111111111111111');
    expect(intent.expectedRecipient).toBe('0x2222222222222222222222222222222222222222');
    expect(intent.expectedAmountWei).toBe('20000000000000000');
    expect(intent.expectedAmountEth).toBe('0.02');
    expect(intent.testnet).toBe(true);
    expect(order.payment.txId).toBeUndefined();
  });

  test('requires verified wallets on both sides', () => {
    const order = {
      status:'ACCEPTED',
      quantity:1,
      snapshot:{ price:0.01, currency:'ETH' },
      payment:{}
    };
    expect(() => initializeEthPaymentIntent({
      order,
      buyer:{ evmWallet:{ status:'WALLET_DISCONNECTED' } },
      seller:{ evmWallet:{ status:'WALLET_VERIFIED', address:'0x2222222222222222222222222222222222222222' } }
    })).toThrow('Buyer deve avere un wallet EVM verificato');
  });
});
