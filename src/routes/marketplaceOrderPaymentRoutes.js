const express = require('express');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const { authenticate } = require('../middleware/auth');
const { verifyBitcoinTestnetPayment, verifyEthereumSepoliaPayment } = require('../services/marketplaceChainVerifiers');

const router = express.Router();
const NETWORK = { BTC:'testnet', ETH:'sepolia' };
const MIN_CONFIRMATIONS = { BTC:2, ETH:3 };

function participant(order, userId) { return [String(order.buyerId), String(order.sellerId)].includes(String(userId)); }

router.post('/orders/:id/payment/verify', authenticate, async (req, res) => {
  try {
    const order = await MarketplaceOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success:false, code:'ORDER_NOT_FOUND' });
    if (!participant(order, req.userId)) return res.status(403).json({ success:false, code:'ORDER_PAYMENT_FORBIDDEN' });
    if (order.status !== 'ACCEPTED') return res.status(409).json({ success:false, code:'ORDER_NOT_ACCEPTED' });
    if (order.payment?.status === 'PAID') return res.json({ success:true, idempotent:true, payment:order.payment });

    const asset = String(order.payment?.asset || '').toUpperCase();
    const expectedRecipient = String(order.payment?.expectedRecipient || '').trim();
    const expectedAtomicAmount = String(order.payment?.expectedAtomicAmount || '').trim();
    const txId = String(req.body?.txId || '').trim();
    if (!['BTC','ETH'].includes(asset) || order.payment?.network !== NETWORK[asset] || !expectedRecipient || !/^\d+$/.test(expectedAtomicAmount) || BigInt(expectedAtomicAmount) <= 0n) return res.status(409).json({ success:false, code:'PAYMENT_INTENT_NOT_READY' });
    if (!txId) return res.status(400).json({ success:false, code:'TX_ID_REQUIRED' });

    const duplicate = await MarketplaceOrder.findOne({ _id:{ $ne:order._id }, 'payment.asset':asset, 'payment.network':NETWORK[asset], 'payment.txId':txId }).lean();
    if (duplicate) return res.status(409).json({ success:false, code:'PAYMENT_TX_ALREADY_USED' });

    order.payment.status = 'CONFIRMING'; order.payment.txId = txId; order.payment.confirmations = 0; order.payment.verifier = 'marketplaceChainVerifiers'; order.payment.failureCode = undefined;
    await order.save();

    let evidence;
    if (asset === 'BTC') evidence = await verifyBitcoinTestnetPayment({ txid:txId, expectedAddress:expectedRecipient, expectedAmountBtc:Number(BigInt(expectedAtomicAmount)) / 100000000, minConfirmations:MIN_CONFIRMATIONS.BTC });
    else evidence = await verifyEthereumSepoliaPayment({ txHash:txId, expectedAddress:expectedRecipient, expectedAmountWei:expectedAtomicAmount, minConfirmations:MIN_CONFIRMATIONS.ETH });

    order.payment.confirmations = Number(evidence.confirmations || 0);
    if (!evidence.verified) { order.payment.status = 'CONFIRMING'; order.payment.failureCode = evidence.reason || 'PAYMENT_NOT_CONFIRMED'; await order.save(); return res.status(409).json({ success:false, code:'PAYMENT_NOT_VERIFIED', payment:order.payment, evidence }); }

    order.payment.status = 'PAID'; order.payment.verifiedAt = new Date(); order.payment.failureCode = undefined; await order.save();
    return res.json({ success:true, payment:order.payment, evidence });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success:false, code:'PAYMENT_TX_ALREADY_USED' });
    return res.status(503).json({ success:false, code:'ORDER_PAYMENT_VERIFIER_UNAVAILABLE' });
  }
});

module.exports = router;
