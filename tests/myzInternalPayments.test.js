const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../src/services/zorgaxEntitlementService', () => ({
  grantPurchaseEntitlement: jest.fn()
}));

const { MyzLedgerApiService } = require('../src/services/myzLedgerApiService');
const { createMarketplaceMyzPaymentService } = require('../src/services/marketplaceMyzPaymentService');
const { createZorgaxMyzCheckoutService } = require('../src/services/zorgaxMyzCheckoutService');

function tempLedger(entries = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'myz-internal-payments-'));
  const file = path.join(dir, 'ledger.json');
  fs.writeFileSync(file, JSON.stringify({
    schema: 'myzubster-myz-ledger/v1',
    asset: 'MYZ',
    asset_type: 'internal-reward-accounting-unit',
    on_chain: false,
    entries,
    integrity: { canonicalization: 'json-key-sort-v1', sha256: null, signature: null },
    notes: []
  }, null, 2));
  return { dir, file };
}

function credit(accountId, amount, id = 'OPENING') {
  return {
    entry_id: id,
    timestamp: new Date().toISOString(),
    account_id: accountId,
    amount_myz: String(amount),
    entry_type: 'BOUNTY_REWARD',
    reference: {},
    status: 'RECORDED',
    evidence: [],
    reverses_entry_id: null,
    note: 'test opening credit'
  };
}

function fakeOrder({ id, buyer = 'alice', seller = 'bob', price = 250, quantity = 1 }) {
  return {
    _id: id,
    listingId: `listing-${id}`,
    buyerId: buyer,
    sellerId: seller,
    quantity,
    status: 'ACCEPTED',
    snapshot: { title:'Test', price, currency:'MYZ', exchangeMode:'payment' },
    payment: { status:'AWAITING_PAYMENT' },
    save: jest.fn(async function save() { return this; })
  };
}

describe('MYZ internal spending vertical slices', () => {
  test('Marketplace buyer -> seller is one canonical paired transfer and is idempotent', async () => {
    const { dir, file } = tempLedger([credit('marketplace:user:alice', 300)]);
    try {
      const ledger = new MyzLedgerApiService({
        ledgerPath:file,
        allowedAccountPrefixes:'marketplace:user:,zorgax:system:'
      });
      const payments = createMarketplaceMyzPaymentService({ ledgerService:ledger });
      const order = fakeOrder({ id:'order-1' });

      const first = await payments.payOrder({
        order,
        buyerId:'alice',
        clientIdempotencyKey:'browser-order-1'
      });
      const replay = await payments.payOrder({
        order,
        buyerId:'alice',
        clientIdempotencyKey:'browser-order-1'
      });

      expect(first.amountMyz).toBe('250');
      expect(first.duplicate).toBe(false);
      expect(replay.duplicate).toBe(true);
      expect(replay.transferId).toBe(first.transferId);
      expect(order.payment.status).toBe('PAID');
      expect(order.payment.asset).toBe('MYZ');
      expect(order.payment.network).toBe('internal-ledger');
      expect(ledger.getBalance('marketplace:user:alice').balanceMyz).toBe('50');
      expect(ledger.getBalance('marketplace:user:bob').balanceMyz).toBe('250');

      const history = ledger.getHistory({ accountId:'marketplace:user:alice' });
      const legs = history.entries.filter(entry => entry.transfer_id === first.transferId);
      expect(legs).toHaveLength(1);
      expect(legs[0].entry_type).toBe('INTERNAL_TRANSFER_DEBIT');

      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      const pair = raw.entries.filter(entry => entry.transfer_id === first.transferId);
      expect(pair).toHaveLength(2);
      expect(new Set(pair.map(entry => entry.reference.transfer_id))).toEqual(new Set([first.transferId]));
      expect(pair.map(entry => entry.amount_myz).sort()).toEqual(['-250', '250']);
    } finally {
      fs.rmSync(dir, { recursive:true, force:true });
    }
  });

  test('two competing 250 MYZ orders cannot overspend a 300 MYZ balance', async () => {
    const { dir, file } = tempLedger([credit('marketplace:user:alice', 300)]);
    try {
      const ledger = new MyzLedgerApiService({
        ledgerPath:file,
        allowedAccountPrefixes:'marketplace:user:,zorgax:system:'
      });
      const payments = createMarketplaceMyzPaymentService({ ledgerService:ledger });
      const orderA = fakeOrder({ id:'order-a', seller:'bob' });
      const orderB = fakeOrder({ id:'order-b', seller:'carol' });

      const results = await Promise.allSettled([
        payments.payOrder({ order:orderA, buyerId:'alice', clientIdempotencyKey:'concurrent-a' }),
        payments.payOrder({ order:orderB, buyerId:'alice', clientIdempotencyKey:'concurrent-b' })
      ]);

      expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
      expect(results.find(result => result.status === 'rejected').reason.code).toBe('INSUFFICIENT_MYZ_BALANCE');
      expect(ledger.getBalance('marketplace:user:alice').balanceMyz).toBe('50');

      const sellerTotal =
        Number(ledger.getBalance('marketplace:user:bob').balanceMyz) +
        Number(ledger.getBalance('marketplace:user:carol').balanceMyz);
      expect(sellerTotal).toBe(250);
    } finally {
      fs.rmSync(dir, { recursive:true, force:true });
    }
  });

  test('Zorgax user -> internal account grants entitlement after canonical MYZ transfer', async () => {
    const { dir, file } = tempLedger([credit('marketplace:user:user-1', 100)]);
    try {
      const ledger = new MyzLedgerApiService({
        ledgerPath:file,
        allowedAccountPrefixes:'marketplace:user:,zorgax:system:'
      });
      const grantEntitlementFn = jest.fn(async input => ({
        replay:false,
        entitlement:{ tier:input.tier, sourcePurchaseId:input.purchaseId }
      }));
      const checkout = createZorgaxMyzCheckoutService({
        ledgerService:ledger,
        grantEntitlementFn,
        priceByPlan:{ pro:'40', developer:'80' },
        zorgaxAccountId:'zorgax:system:treasury'
      });

      const first = await checkout.purchase({
        ownerId:'user-1',
        planId:'pro',
        idempotencyKey:'zorgax-browser-1'
      });
      const replay = await checkout.purchase({
        ownerId:'user-1',
        planId:'pro',
        idempotencyKey:'zorgax-browser-1'
      });

      expect(first.receipt.amountMyz).toBe('40');
      expect(first.receipt.duplicate).toBe(false);
      expect(replay.receipt.duplicate).toBe(true);
      expect(replay.receipt.transferId).toBe(first.receipt.transferId);
      expect(ledger.getBalance('marketplace:user:user-1').balanceMyz).toBe('60');
      expect(ledger.getBalance('zorgax:system:treasury').balanceMyz).toBe('40');
      expect(grantEntitlementFn).toHaveBeenCalledWith(expect.objectContaining({
        ownerId:'user-1',
        tier:'PRO',
        metadata:expect.objectContaining({ paymentAsset:'MYZ', paymentNetwork:'internal-ledger' })
      }));
    } finally {
      fs.rmSync(dir, { recursive:true, force:true });
    }
  });

  test('an idempotency key cannot be reused for a different Zorgax plan even at the same price', async () => {
    const { dir, file } = tempLedger([credit('marketplace:user:user-1', 100)]);
    try {
      const ledger = new MyzLedgerApiService({
        ledgerPath:file,
        allowedAccountPrefixes:'marketplace:user:,zorgax:system:'
      });
      const checkout = createZorgaxMyzCheckoutService({
        ledgerService:ledger,
        grantEntitlementFn:jest.fn(async input => ({ entitlement:{ tier:input.tier } })),
        priceByPlan:{ pro:'40', developer:'40' },
        zorgaxAccountId:'zorgax:system:treasury'
      });

      await checkout.purchase({ ownerId:'user-1', planId:'pro', idempotencyKey:'same-key' });
      await expect(checkout.purchase({ ownerId:'user-1', planId:'developer', idempotencyKey:'same-key' }))
        .rejects.toMatchObject({ code:'MYZ_LEDGER_IDEMPOTENCY_CONFLICT' });
      expect(ledger.getBalance('marketplace:user:user-1').balanceMyz).toBe('60');
      expect(ledger.getBalance('zorgax:system:treasury').balanceMyz).toBe('40');
    } finally {
      fs.rmSync(dir, { recursive:true, force:true });
    }
  });
});
