const assert = require('node:assert/strict');
const test = require('node:test');

function verificationInput(order, txId) {
  const payment = order.payment || {};
  if (!['BTC','ETH'].includes(payment.asset)) throw new Error('UNSUPPORTED_ASSET');
  if (!payment.expectedRecipient || !/^\d+$/.test(String(payment.expectedAtomicAmount || '')) || BigInt(payment.expectedAtomicAmount) <= 0n) throw new Error('PAYMENT_INTENT_INCOMPLETE');
  return { asset:payment.asset, network:payment.network, expectedRecipient:payment.expectedRecipient, expectedAtomicAmount:String(payment.expectedAtomicAmount), txId };
}

test('expected recipient and amount come from server-owned order payment', () => {
  const order={payment:{asset:'ETH',network:'sepolia',expectedRecipient:'0xserver',expectedAtomicAmount:'1000'}};
  assert.deepEqual(verificationInput(order,'0xtx'),{asset:'ETH',network:'sepolia',expectedRecipient:'0xserver',expectedAtomicAmount:'1000',txId:'0xtx'});
});

test('rejects incomplete payment intent', () => {
  assert.throws(()=>verificationInput({payment:{asset:'BTC',network:'testnet'}},'tx'),/PAYMENT_INTENT_INCOMPLETE/);
});

test('rejects unsupported asset before verifier execution', () => {
  assert.throws(()=>verificationInput({payment:{asset:'XMR',expectedRecipient:'x',expectedAtomicAmount:'1'}},'tx'),/UNSUPPORTED_ASSET/);
});

test('atomic amount must be a positive integer', () => {
  assert.throws(()=>verificationInput({payment:{asset:'ETH',network:'sepolia',expectedRecipient:'0xserver',expectedAtomicAmount:'0'}},'tx'),/PAYMENT_INTENT_INCOMPLETE/);
});
