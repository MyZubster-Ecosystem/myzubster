'use strict';

const myzLedgerApiService = require('./myzLedgerApiService');
const { parseUnits, formatUnits } = require('./myzLedgerApiService');

function myzAccountForUser(userId) {
  const normalized = String(userId || '').trim();
  if (!normalized) throw Object.assign(new Error('MYZ user account requires a user id'), { code: 'INVALID_MYZ_ACCOUNT' });
  return `marketplace:user:${normalized}`;
}

function orderMyzAmount(order) {
  const priceUnits = parseUnits(String(order?.snapshot?.price ?? ''));
  const quantityValue = Number(order?.quantity || 0);
  if (priceUnits <= 0n || !Number.isSafeInteger(quantityValue) || quantityValue <= 0) {
    throw Object.assign(new Error('Marketplace MYZ order has an invalid amount'), { code: 'INVALID_MARKETPLACE_MYZ_AMOUNT' });
  }
  return formatUnits(priceUnits * BigInt(quantityValue));
}

function createMarketplaceMyzPaymentService({ ledgerService = myzLedgerApiService } = {}) {
  async function payOrder({ order, buyerId, clientIdempotencyKey }) {
    if (!order?._id) throw Object.assign(new Error('Order is required'), { code: 'ORDER_NOT_FOUND' });
    const normalizedBuyerId = String(buyerId || '').trim();
    if (String(order.buyerId) !== normalizedBuyerId) {
      throw Object.assign(new Error('Only the buyer can pay this order'), { code: 'ORDER_PAYMENT_FORBIDDEN' });
    }
    if (String(order.buyerId) === String(order.sellerId)) {
      throw Object.assign(new Error('Buyer and seller cannot be the same account'), { code: 'MYZ_SELF_TRANSFER_FORBIDDEN' });
    }
    if (order.status !== 'ACCEPTED') {
      throw Object.assign(new Error('Order must be accepted before payment'), { code: 'ORDER_NOT_ACCEPTED' });
    }

    const asset = String(order.snapshot?.currency || '').toUpperCase();
    if (asset !== 'MYZ') {
      throw Object.assign(new Error('This order is not priced in MYZ; automatic conversion is disabled'), { code: 'ORDER_ASSET_NOT_MYZ' });
    }

    if (order.payment?.status === 'PAID' && String(order.payment?.asset || '').toUpperCase() !== 'MYZ') {
      throw Object.assign(new Error('Order is already paid with another asset'), { code: 'ORDER_ALREADY_PAID' });
    }

    const requestKey = String(clientIdempotencyKey || '').trim();
    if (!requestKey) {
      throw Object.assign(new Error('Idempotency-Key is required'), { code: 'IDEMPOTENCY_KEY_REQUIRED' });
    }

    const amountMyz = orderMyzAmount(order);
    const orderId = String(order._id);
    const transferId = `MYZ-MARKETPLACE-${orderId}`;
    const transfer = ledgerService.transfer({
      from_account_id: myzAccountForUser(order.buyerId),
      to_account_id: myzAccountForUser(order.sellerId),
      amount_myz: amountMyz,
      transfer_id: transferId,
      idempotency_key: `marketplace-order:${orderId}:myz`,
      reference: {
        type: 'MARKETPLACE_ORDER',
        order_id: orderId,
        listing_id: String(order.listingId)
      },
      note: `Marketplace order ${orderId} paid with internal MYZ credits`
    });

    order.payment = order.payment || {};
    order.payment.status = 'PAID';
    order.payment.asset = 'MYZ';
    order.payment.network = 'internal-ledger';
    order.payment.transferId = transfer.transferId;
    // Keep the existing compound uniqueness guard collision-free. This is an internal ledger reference, not an on-chain transaction hash.
    order.payment.txId = `myz:${transfer.transferId}`;
    order.payment.debitEntryId = transfer.debitEntry.entry_id;
    order.payment.creditEntryId = transfer.creditEntry.entry_id;
    order.payment.verifier = 'myzLedgerApiService';
    order.payment.verifiedAt = order.payment.verifiedAt || new Date();
    order.payment.failureCode = undefined;
    if (typeof order.save === 'function') await order.save();

    return {
      schema: 'myzubster-marketplace-myz-receipt/v1',
      asset: 'MYZ',
      assetType: 'internal-reward-accounting-unit',
      onChain: false,
      orderId,
      buyerId: String(order.buyerId),
      sellerId: String(order.sellerId),
      amountMyz,
      transferId: transfer.transferId,
      debitEntryId: transfer.debitEntry.entry_id,
      creditEntryId: transfer.creditEntry.entry_id,
      buyerBalanceMyz: transfer.fromBalanceMyz,
      duplicate: transfer.duplicate,
      paidAt: order.payment.verifiedAt
    };
  }

  return { payOrder };
}

module.exports = {
  createMarketplaceMyzPaymentService,
  myzAccountForUser,
  orderMyzAmount
};
