const express = require('express');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const { authenticate } = require('../middleware/auth');
const { verifyBitcoinTestnetPayment, verifyEthereumSepoliaPayment } = require('../services/marketplaceChainVerifiers');

const router = express.Router();
const NETWORK = { BTC:'testnet', ETH:'sepolia' };

function participant(order, userId) {
  return [String(order.buyerId), String(order.sellerId)].includes(String(userId));
}

router.post('/orders/:id/payment/verify', authenticate, async (req, res) => {
  try {
    const order = await MarketplaceOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success:false, code:'ORDER_NOT_FOUND' });
    if (!participant(order, req.userId)) return res.status(403).json({ success:false, code:'ORDER_PAYMENT_FORBIDDEN' });
    if (order.status !== 'ACCEPTED') return res.status(409).json({ success:false, code:'ORDER_NOT_ACCEPTED' });
    if (order.payment?.status === 'PAID') return res.json({ success:true, idempotent:true, payment:order.payment });

    const asset = String(req.body?.asset || '').toUpperCase();
    const txId = String(req.body?.txId || '').trim();
    const expectedRecipient = String(req.body?.expectedRecipient || '').trim();
    const expectedAtomicAmount = String(req.body?.expectedAtomicAmount || '').trim();
    const minConfirmations = Math.max(1, Number(req.body?.minConfirmations) || 1);
    if (!['BTC','ETH'].includes(asset) || !txId || !expectedRecipient || !/^\d+$/.test(expectedAtomicAmount) || BigInt(expectedAtomicAmount) <= 0n) return res.status(400).json({ success:false, code:'INVALID_PAYMENT_VERIFICATION_REQUEST' });

    const duplicate = await MarketplaceOrder.findOne({ _id:{ $ne:order._id }, 'payment.asset':asset, 'payment.network':NETWORK[asset], 'payment.txId':txId, 'payment.status':'PAID' }).lean();
    if (duplicate) return res.status(409).json({ success:false, code:'PAYMENT_TX_ALREADY_USED' });

    order.payment = { status:'CONFIRMING', asset, network:NETWORK[asset], expectedRecipient, expectedAtomicAmount, txId, confirmations:0, verifier:'marketplaceChainVerifiers' };
    await order.save();

    let evidence;
    if (asset === 'BTC') evidence = await verifyBitcoinTestnetPayment({ txid:txId, expectedAddress:expectedRecipient, expectedAmountBtc:Number(BigInt(expectedAtomicAmount)) / 100000000, minConfirmations });
    else evidence = await verifyEthereumSepoliaPayment({ txHash:txId, expectedAddress:expectedRecipient, expectedAmountWei:expectedAtomicAmount, minConfirmations });

    order.payment.confirmations = Number(evidence.confirmations || 0);
    if (!evidence.verified) {
      order.payment.status = 'CONFIRMING';
      order.payment.failureCode = evidence.reason || 'PAYMENT_NOT_CONFIRMED';
      await order.save();
      return res.status(409).json({ success:false, code:'PAYMENT_NOT_VERIFIED', payment:order.payment, evidence });
    }

    order.payment.status = 'PAID';
    order.payment.verifiedAt = new Date();
    order.payment.failureCode = undefined;
    await order.save();
    return res.json({ success:true, payment:order.payment, evidence });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success:false, code:'PAYMENT_TX_ALREADY_USED' });
    return res.status(503).json({ success:false, code:'ORDER_PAYMENT_VERIFIER_UNAVAILABLE' });
  }
});

module.exports = router;
