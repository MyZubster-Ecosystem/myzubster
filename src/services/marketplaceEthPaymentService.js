'use strict';

const { parseEther, formatEther } = require('ethers');
const { normalizeAddress } = require('./evmWalletLinkService');

const ETH_PAYMENT_NETWORK = 'sepolia';
const ETH_PAYMENT_CHAIN_ID = 11155111;
const ETH_PAYMENT_CHAIN_HEX = '0xaa36a7';
const ETH_MIN_CONFIRMATIONS = 3;

function decimalEthString(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    const error = new Error('Importo ETH non valido');
    error.code = 'INVALID_ETH_PAYMENT_AMOUNT';
    throw error;
  }

  const raw = String(value);
  if (/^\d+(?:\.\d+)?$/.test(raw)) return raw;
  const fixed = numeric.toFixed(18).replace(/0+$/,'').replace(/\.$/,'');
  if (!fixed || fixed === '0') {
    const error = new Error('Importo ETH non valido');
    error.code = 'INVALID_ETH_PAYMENT_AMOUNT';
    throw error;
  }
  return fixed;
}

function calculateOrderWei(order) {
  const quantity = Number(order?.quantity || 0);
  if (!Number.isInteger(quantity) || quantity < 1) {
    const error = new Error('Quantità ordine non valida');
    error.code = 'INVALID_ETH_PAYMENT_QUANTITY';
    throw error;
  }

  let unitWei;
  try {
    unitWei = parseEther(decimalEthString(order?.snapshot?.price));
  } catch (error) {
    if (error?.code === 'INVALID_ETH_PAYMENT_AMOUNT') throw error;
    const invalid = new Error('Importo ETH non convertibile in wei');
    invalid.code = 'INVALID_ETH_PAYMENT_AMOUNT';
    throw invalid;
  }

  const totalWei = unitWei * BigInt(quantity);
  if (totalWei <= 0n) {
    const error = new Error('Importo ETH non valido');
    error.code = 'INVALID_ETH_PAYMENT_AMOUNT';
    throw error;
  }
  return totalWei;
}

function verifiedWallet(user, label) {
  if (!user?.evmWallet || user.evmWallet.status !== 'WALLET_VERIFIED' || !user.evmWallet.address) {
    const error = new Error(`${label} deve avere un wallet EVM verificato`);
    error.code = label === 'Buyer' ? 'BUYER_ETH_WALLET_NOT_READY' : 'SELLER_ETH_WALLET_NOT_READY';
    throw error;
  }
  return normalizeAddress(user.evmWallet.address);
}

function publicEthPaymentIntent(order) {
  const payment = order?.payment || {};
  return {
    asset:'ETH',
    network:ETH_PAYMENT_NETWORK,
    chainId:ETH_PAYMENT_CHAIN_ID,
    chainHex:ETH_PAYMENT_CHAIN_HEX,
    expectedSender:payment.expectedSender || null,
    expectedRecipient:payment.expectedRecipient || null,
    expectedAmountWei:payment.expectedAtomicAmount || null,
    expectedAmountEth:payment.expectedAtomicAmount ? formatEther(payment.expectedAtomicAmount) : null,
    minConfirmations:ETH_MIN_CONFIRMATIONS,
    paymentStatus:payment.status || 'AWAITING_PAYMENT',
    txId:payment.txId || null,
    testnet:true
  };
}

function initializeEthPaymentIntent({ order, buyer, seller }) {
  if (!order) {
    const error = new Error('Ordine non trovato');
    error.code = 'ORDER_NOT_FOUND';
    throw error;
  }
  if (String(order.status) !== 'ACCEPTED') {
    const error = new Error('Il Seller deve prima accettare la richiesta');
    error.code = 'ORDER_NOT_ACCEPTED';
    throw error;
  }
  if (String(order.snapshot?.currency || '').toUpperCase() !== 'ETH') {
    const error = new Error('Questo ordine non è prezzato in ETH');
    error.code = 'ORDER_ASSET_NOT_ETH';
    throw error;
  }
  if (order.payment?.status === 'PAID') return publicEthPaymentIntent(order);
  if (order.payment?.status === 'CONFIRMING' && order.payment?.txId) return publicEthPaymentIntent(order);

  const expectedSender = verifiedWallet(buyer, 'Buyer');
  const expectedRecipient = verifiedWallet(seller, 'Seller');
  const expectedAmountWei = calculateOrderWei(order).toString();

  order.payment = order.payment || {};
  order.payment.status = 'AWAITING_PAYMENT';
  order.payment.asset = 'ETH';
  order.payment.network = ETH_PAYMENT_NETWORK;
  order.payment.chainId = ETH_PAYMENT_CHAIN_ID;
  order.payment.expectedSender = expectedSender;
  order.payment.expectedRecipient = expectedRecipient;
  order.payment.expectedAtomicAmount = expectedAmountWei;
  order.payment.intentCreatedAt = new Date();
  order.payment.txId = undefined;
  order.payment.confirmations = 0;
  order.payment.failureCode = undefined;

  return publicEthPaymentIntent(order);
}

module.exports = {
  ETH_PAYMENT_NETWORK,
  ETH_PAYMENT_CHAIN_ID,
  ETH_PAYMENT_CHAIN_HEX,
  ETH_MIN_CONFIRMATIONS,
  decimalEthString,
  calculateOrderWei,
  publicEthPaymentIntent,
  initializeEthPaymentIntent
};
