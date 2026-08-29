const ZorgaxProduct = require('../models/ZorgaxProduct');

function requireProductId(productId) {
  const normalized = String(productId || '').trim();

  if (!normalized) {
    throw new Error('productId is required');
  }

  return normalized;
}

function publicProduct(product) {
  const source =
    typeof product?.toObject === 'function'
      ? product.toObject()
      : product;

  if (!source) {
    return null;
  }

  return {
    productId: source.productId,
    name: source.name,
    description: source.description,
    kind: source.kind,
    active: source.active,
    creditsGranted: source.creditsGranted,
    pricing: source.pricing,
    usage: source.usage,
    entitlement: source.entitlement,
    metadata: source.metadata
  };
}

async function getProduct(productId) {
  const normalizedProductId = requireProductId(productId);

  const product = await ZorgaxProduct.findOne({
    productId: normalizedProductId,
    active: true
  });

  if (!product) {
    throw new Error('Zorgax product not found or inactive');
  }

  return product;
}

async function listProducts({
  kind = null
} = {}) {
  const query = {
    active: true
  };

  if (kind) {
    query.kind = String(kind).trim().toUpperCase();
  }

  const products = await ZorgaxProduct.find(query)
    .sort({
      kind: 1,
      productId: 1
    });

  return products.map(publicProduct);
}

function resolveEntitlement(product) {
  if (product.kind !== 'SUBSCRIPTION') {
    return null;
  }

  const tier = String(product.entitlement?.tier || '').trim().toUpperCase();
  const durationDays = Number(product.entitlement?.durationDays);
  const key = String(product.entitlement?.key || 'zorgax.access').trim();

  if (!['PRO', 'DEVELOPER'].includes(tier)) {
    throw new Error('Subscription product must grant PRO or DEVELOPER access');
  }

  if (!Number.isSafeInteger(durationDays) || durationDays <= 0 || durationDays > 3660) {
    throw new Error('Subscription product has invalid entitlement duration');
  }

  if (!key) {
    throw new Error('Subscription product has invalid entitlement key');
  }

  return {
    key,
    tier,
    durationDays
  };
}

async function resolvePurchase(productId) {
  const product = await getProduct(productId);

  if (
    !Number.isSafeInteger(product.creditsGranted) ||
    product.creditsGranted <= 0
  ) {
    throw new Error(
      'Product does not grant purchasable Zorgax credits'
    );
  }

  const amountMinor = product.pricing?.amountMinor;

  if (
    !Number.isSafeInteger(amountMinor) ||
    amountMinor <= 0
  ) {
    throw new Error('Product has invalid pricing');
  }

  return {
    productId: product.productId,
    purpose: `zorgax:${product.productId}`,
    creditsGranted: product.creditsGranted,

    payment: {
      asset: product.pricing.asset,
      network: product.pricing.network,
      amountMinor: product.pricing.amountMinor
    },

    entitlement: resolveEntitlement(product),
    product: publicProduct(product)
  };
}

async function resolveUsage(productId, units = 1) {
  const product = await getProduct(productId);

  if (!Number.isSafeInteger(units) || units <= 0) {
    throw new Error('units must be a positive safe integer');
  }

  const creditsPerUnit = product.usage?.creditsPerUnit;

  if (
    !Number.isSafeInteger(creditsPerUnit) ||
    creditsPerUnit <= 0
  ) {
    throw new Error(
      'Product does not define billable Zorgax usage'
    );
  }

  const credits = creditsPerUnit * units;

  if (!Number.isSafeInteger(credits)) {
    throw new Error('Calculated Zorgax credit cost is unsafe');
  }

  return {
    productId: product.productId,
    unit: product.usage.unit,
    units,
    creditsPerUnit,
    credits
  };
}

module.exports = {
  getProduct,
  listProducts,
  publicProduct,
  requireProductId,
  resolveEntitlement,
  resolvePurchase,
  resolveUsage
};
