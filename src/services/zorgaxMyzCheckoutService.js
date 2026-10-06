'use strict';

const crypto = require('crypto');
const myzLedgerApiService = require('./myzLedgerApiService');
const { parseUnits, formatUnits } = require('./myzLedgerApiService');
const { grantPurchaseEntitlement } = require('./zorgaxEntitlementService');
const { entitlementForPlan, productIdForPlan, requirePaidPlan } = require('./zorgaxPlanCatalog');

function normalizeConfiguredPrice(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const units = parseUnits(text);
  if (units <= 0n) throw new Error('Configured Zorgax MYZ price must be positive');
  return formatUnits(units);
}

function defaultPriceMap() {
  return {
    pro: process.env.ZORGAX_PRO_PRICE_MYZ,
    developer: process.env.ZORGAX_DEVELOPER_PRICE_MYZ
  };
}

function userAccount(ownerId) {
  const normalized = String(ownerId || '').trim();
  if (!normalized) throw Object.assign(new Error('Owner checkout non valido'), { code: 'INVALID_MYZ_ACCOUNT' });
  return `marketplace:user:${normalized}`;
}

function createZorgaxMyzCheckoutService({
  ledgerService = myzLedgerApiService,
  grantEntitlementFn = grantPurchaseEntitlement,
  priceByPlan = defaultPriceMap(),
  zorgaxAccountId = process.env.ZORGAX_MYZ_ACCOUNT_ID || 'zorgax:system:treasury'
} = {}) {
  function getPlanPrice(planId) {
    const plan = requirePaidPlan(planId);
    let amountMyz;
    try {
      amountMyz = normalizeConfiguredPrice(priceByPlan?.[plan.id]);
    } catch (error) {
      throw Object.assign(new Error(`Prezzo MYZ non valido per Zorgax ${plan.name}`), { code: 'ZORGAX_MYZ_PRICE_INVALID', cause:error });
    }
    if (!amountMyz) {
      throw Object.assign(new Error(`Prezzo MYZ non configurato per Zorgax ${plan.name}`), { code: 'ZORGAX_MYZ_PRICE_NOT_CONFIGURED' });
    }
    return { plan, amountMyz };
  }

  function catalog() {
    return {
      asset: 'MYZ',
      assetType: 'internal-reward-accounting-unit',
      onChain: false,
      conversionEnabled: false,
      redeemable: false,
      plans: ['pro', 'developer'].map(id => {
        const plan = requirePaidPlan(id);
        try {
          const amountMyz = normalizeConfiguredPrice(priceByPlan?.[id]);
          return { id:plan.id, name:plan.name, amountMyz, available:Boolean(amountMyz), configurationError:false };
        } catch (_error) {
          return { id:plan.id, name:plan.name, amountMyz:null, available:false, configurationError:true };
        }
      })
    };
  }

  async function purchase({ ownerId, planId, idempotencyKey }) {
    const owner = String(ownerId || '').trim();
    const requestKey = String(idempotencyKey || '').trim();
    if (!owner) throw Object.assign(new Error('Owner checkout non valido'), { code: 'INVALID_MYZ_ACCOUNT' });
    if (!requestKey) throw Object.assign(new Error('Idempotency-Key is required'), { code: 'IDEMPOTENCY_KEY_REQUIRED' });

    const { plan, amountMyz } = getPlanPrice(planId);
    const digest = crypto.createHash('sha256').update(`${owner}\n${requestKey}`).digest('hex').slice(0, 32);
    const purchaseId = `zmyz_${digest}`;
    const transferId = `MYZ-ZORGAX-${digest}`;
    const canonicalIdempotencyKey = `zorgax-myz:${owner}:${requestKey}`;
    const entitlement = entitlementForPlan(plan.id);

    const transfer = ledgerService.transfer({
      from_account_id: userAccount(owner),
      to_account_id: zorgaxAccountId,
      amount_myz: amountMyz,
      transfer_id: transferId,
      idempotency_key: canonicalIdempotencyKey,
      reference: {
        type: 'ZORGAX_SUBSCRIPTION',
        plan: plan.id,
        product_id: productIdForPlan(plan.id),
        purchase_id: purchaseId
      },
      note: `Zorgax ${plan.name} paid with internal MYZ credits`
    });

    const granted = await grantEntitlementFn({
      ownerId: owner,
      purchaseId,
      productId: productIdForPlan(plan.id),
      entitlementKey: entitlement.key,
      tier: entitlement.tier,
      durationDays: entitlement.durationDays,
      metadata: {
        paymentAsset: 'MYZ',
        paymentNetwork: 'internal-ledger',
        transferId: transfer.transferId,
        debitEntryId: transfer.debitEntry.entry_id,
        creditEntryId: transfer.creditEntry.entry_id
      }
    });

    return {
      receipt: {
        schema: 'myzubster-zorgax-myz-receipt/v1',
        asset: 'MYZ',
        assetType: 'internal-reward-accounting-unit',
        onChain: false,
        conversionEnabled: false,
        redeemable: false,
        ownerId: owner,
        plan: plan.id,
        productId: productIdForPlan(plan.id),
        amountMyz,
        purchaseId,
        transferId: transfer.transferId,
        debitEntryId: transfer.debitEntry.entry_id,
        creditEntryId: transfer.creditEntry.entry_id,
        remainingBalanceMyz: transfer.fromBalanceMyz,
        duplicate: transfer.duplicate
      },
      entitlement: granted?.entitlement || granted || null
    };
  }

  return { catalog, getPlanPrice, purchase };
}

const defaultService = createZorgaxMyzCheckoutService();

module.exports = {
  ...defaultService,
  createZorgaxMyzCheckoutService,
  normalizeConfiguredPrice,
  userAccount
};
