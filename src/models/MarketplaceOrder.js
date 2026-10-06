const mongoose = require('mongoose');
const { notifyAdminActivity } = require('../services/adminActivityNotificationService');
const { createMarketplaceEvidence } = require('../services/marketplaceEvidenceService');

const marketplaceOrderSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quantity: { type: Number, min: 1, max: 1000, default: 1 },
  note: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['REQUESTED','ACCEPTED','REJECTED','COMPLETED','CANCELLED'], default: 'REQUESTED', index: true },
  snapshot: { title: { type: String, required: true }, price: { type: Number, default: 0 }, currency: { type: String, required: true }, exchangeMode: { type: String, required: true } },
  payment: {
    status: { type: String, enum: ['NOT_REQUIRED','AWAITING_PAYMENT','CONFIRMING','PAID','FAILED'], default: 'AWAITING_PAYMENT', index: true },
    asset: { type: String, enum: ['XMR','BTC','ETH','MYZ'] },
    network: { type: String, enum: ['stagenet','testnet','sepolia','internal-ledger'] },
    expectedRecipient: String,
    expectedAtomicAmount: String,
    txId: { type: String, index: true },
    confirmations: { type: Number, min: 0, default: 0 },
    verifier: { type: String },
    transferId: { type: String, index: true },
    debitEntryId: String,
    creditEntryId: String,
    verifiedAt: Date,
    failureCode: String
  },
  acceptedAt: Date, rejectedAt: Date, completedAt: Date, cancelledAt: Date,
  evidence: {
    schema: { type: String }, payload: { type: mongoose.Schema.Types.Mixed }, algorithm: { type: String }, hash: { type: String, index: true }, generatedAt: Date,
    anchor: { status: { type: String, enum: ['NOT_CONFIGURED','SUBMITTED','CONFIRMED','FAILED'] }, txId: String, network: String, anchoredAt: Date, confirmedAt: Date, explorerUrl: String, error: String }
  }
}, { timestamps: true });

marketplaceOrderSchema.index({ buyerId: 1, createdAt: -1 });
marketplaceOrderSchema.index({ sellerId: 1, createdAt: -1 });
marketplaceOrderSchema.index({ 'payment.asset': 1, 'payment.network': 1, 'payment.txId': 1 }, { unique: true, sparse: true });
marketplaceOrderSchema.post('save', function notifyNewMarketplaceRequest(order) {
  if (!order.createdAt || Math.abs(Date.now() - new Date(order.createdAt).getTime()) > 15000 || order.status !== 'REQUESTED') return;
  void notifyAdminActivity('marketplace_request', { orderId: order._id, listingId: order.listingId, buyerId: order.buyerId, sellerId: order.sellerId, title: order.snapshot?.title, quantity: order.quantity, note: order.note });
});
marketplaceOrderSchema.post('save', async function ensureMarketplaceEvidence(order) {
  if (order.status !== 'COMPLETED' || order.evidence?.hash) return;
  try { const result = await createMarketplaceEvidence(order); await this.constructor.updateOne({ _id: order._id, 'evidence.hash': { $exists: false } }, { $set: { evidence: { schema: result.payload.schema, payload: result.payload, algorithm: result.algorithm, hash: result.evidenceHash, generatedAt: new Date(), anchor: result.anchor } } }); }
  catch (error) { console.error('[MarketplaceEvidence] automatic evidence creation failed', { orderId: String(order._id), error: error.message }); }
});
marketplaceOrderSchema.post('save', async function ensureCircularPassport(order) {
  if (order.status !== 'COMPLETED') return;
  try { const MarketplaceListing = mongoose.models.MarketplaceListing || require('./MarketplaceListing'); const CircularItemPassport = mongoose.models.CircularItemPassport || require('./CircularItemPassport'); const listing = await MarketplaceListing.findById(order.listingId).select('title category').lean(); if (!listing) return; await CircularItemPassport.updateOne({ orderId: order._id }, { $setOnInsert: { ownerId: order.buyerId, listingId: order.listingId, orderId: order._id, title: listing.title || order.snapshot.title, category: listing.category, state: 'IN_USE', events: [{ type: 'ACQUIRED', actorId: order.buyerId, note: 'Marketplace order completed', occurredAt: order.completedAt || new Date() }] } }, { upsert: true }); }
  catch (error) { console.error('[CircularItemPassport] automatic creation failed', { orderId: String(order._id), error: error.message }); }
});
module.exports = mongoose.models.MarketplaceOrder || mongoose.model('MarketplaceOrder', marketplaceOrderSchema);
