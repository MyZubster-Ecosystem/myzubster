const express = require('express');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const { authenticate } = require('../middleware/auth');
const { verifyBitcoinTestnetPayment, verifyEthereumSepoliaPayment } = require('../services/marketplaceChainVerifiers');
const { createMarketplaceMyzPaymentService } = require('../services/marketplaceMyzPaymentService');

const router = express.Router();
const NETWORK = { BTC:'testnet', ETH:'sepolia' };
const MIN_CONFIRMATIONS = { BTC:2, ETH:3 };
const marketplaceMyzPaymentService = createMarketplaceMyzPaymentService();

function participant(order, userId) { return [String(order.buyerId), String(order.sellerId)].includes(String(userId)); }

router.post('/orders/:id/payment/myz', authenticate, async (req, res) => {
  try {
    const order = await MarketplaceOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success:false, code:'ORDER_NOT_FOUND' });
    const receipt = await marketplaceMyzPaymentService.payOrder({
      order,
      buyerId:req.userId,
      clientIdempotencyKey:req.headers['idempotency-key']
    });
    return res.status(receipt.duplicate ? 200 : 201).json({ success:true, payment:order.payment, receipt });
  } catch (error) {
    const code = error?.code || 'MARKETPLACE_MYZ_PAYMENT_FAILED';
    if (code === 'ORDER_NOT_FOUND') return res.status(404).json({ success:false, code, message:error.message });
    if (['ORDER_PAYMENT_FORBIDDEN'].includes(code)) return res.status(403).json({ success:false, code, message:error.message });
    if (['ORDER_NOT_ACCEPTED','ORDER_ASSET_NOT_MYZ','ORDER_ALREADY_PAID','INSUFFICIENT_MYZ_BALANCE','MYZ_LEDGER_IDEMPOTENCY_CONFLICT','MYZ_LEDGER_TRANSFER_CONFLICT'].includes(code)) {
      return res.status(409).json({ success:false, code, message:error.message });
    }
    if (['IDEMPOTENCY_KEY_REQUIRED','INVALID_MARKETPLACE_MYZ_AMOUNT','MYZ_SELF_TRANSFER_FORBIDDEN','INVALID_MYZ_AMOUNT'].includes(code)) {
      return res.status(400).json({ success:false, code, message:error.message });
    }
    return res.status(503).json({ success:false, code, message:'Pagamento MYZ interno temporaneamente non disponibile' });
  }
});

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
