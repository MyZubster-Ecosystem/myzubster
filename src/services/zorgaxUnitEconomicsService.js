'use strict';

const DEFAULT_PROVIDERS = Object.freeze([
  'openai_api',
  'chatgpt',
  'vercel',
  'aruba',
  'canva',
  'database',
  'storage',
  'monitoring',
  'email',
  'other'
]);

const PLAN_PRICES_EUR = Object.freeze({
  pro: 9.90,
  developer: 29.90
});

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function parseNonNegative(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readMonthlyCosts(env = process.env) {
  let configured = {};
  if (env.ZORGAX_MONTHLY_COSTS_JSON) {
    try {
      configured = JSON.parse(env.ZORGAX_MONTHLY_COSTS_JSON);
    } catch (_error) {
      throw new Error('ZORGAX_MONTHLY_COSTS_JSON must be valid JSON');
    }
  }
  if (!configured || Array.isArray(configured) || typeof configured !== 'object') {
    throw new Error('ZORGAX_MONTHLY_COSTS_JSON must be a JSON object');
  }

  const providers = {};
  for (const provider of DEFAULT_PROVIDERS) {
    providers[provider] = roundMoney(parseNonNegative(configured[provider]));
  }
  for (const [provider, value] of Object.entries(configured)) {
    if (!Object.prototype.hasOwnProperty.call(providers, provider)) {
      providers[provider] = roundMoney(parseNonNegative(value));
    }
  }
  return providers;
}

function calculateEconomics({
  paidSubscriptions = [],
  monthlyCosts = {},
  stripePercent = 0,
  stripeFixedEur = 0
} = {}) {
  const revenueByPlan = { pro: 0, developer: 0 };
  let stripePayments = 0;

  for (const subscription of paidSubscriptions) {
    const plan = String(subscription.plan || '').toLowerCase();
    const price = PLAN_PRICES_EUR[plan];
    if (!price) continue;
    revenueByPlan[plan] += price;
    if (String(subscription.asset || '').toUpperCase() === 'STRIPE') stripePayments += 1;
  }

  const grossRevenueEur = roundMoney(revenueByPlan.pro + revenueByPlan.developer);
  const providerCostsEur = roundMoney(
    Object.values(monthlyCosts).reduce((sum, value) => sum + parseNonNegative(value), 0)
  );
  const stripeFeesEur = roundMoney(
    paidSubscriptions
      .filter((item) => String(item.asset || '').toUpperCase() === 'STRIPE')
      .reduce((sum, item) => {
        const price = PLAN_PRICES_EUR[String(item.plan || '').toLowerCase()] || 0;
        return sum + (price * parseNonNegative(stripePercent) / 100) + parseNonNegative(stripeFixedEur);
      }, 0)
  );
  const totalCostsEur = roundMoney(providerCostsEur + stripeFeesEur);
  const netMarginEur = roundMoney(grossRevenueEur - totalCostsEur);
  const paidCustomers = paidSubscriptions.length;
  const contributionMarginPercent = grossRevenueEur > 0
    ? roundMoney((netMarginEur / grossRevenueEur) * 100)
    : null;

  return {
    currency: 'EUR',
    paidCustomers,
    stripePayments,
    grossRevenueEur,
    revenueByPlanEur: {
      pro: roundMoney(revenueByPlan.pro),
      developer: roundMoney(revenueByPlan.developer)
    },
    costsEur: {
      providers: monthlyCosts,
      providerTotal: providerCostsEur,
      estimatedStripeFees: stripeFeesEur,
      total: totalCostsEur
    },
    netMarginEur,
    contributionMarginPercent,
    averageRevenuePerPaidCustomerEur: paidCustomers
      ? roundMoney(grossRevenueEur / paidCustomers)
      : 0,
    averageCostPerPaidCustomerEur: paidCustomers
      ? roundMoney(totalCostsEur / paidCustomers)
      : null,
    sustainable: grossRevenueEur > 0 && netMarginEur >= 0,
    warning: grossRevenueEur === 0
      ? 'No paid Zorgax revenue recorded for this period'
      : netMarginEur < 0
        ? 'Zorgax costs exceed revenue for this period'
        : null
  };
}

function createZorgaxUnitEconomicsService({
  SubscriptionModel,
  env = process.env
}) {
  if (!SubscriptionModel) throw new Error('SubscriptionModel is required');

  async function getMonthlyReport({ month } = {}) {
    const match = /^(\d{4})-(\d{2})$/.exec(String(month || ''));
    if (!match) throw new Error('month must use YYYY-MM format');
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex < 0 || monthIndex > 11) throw new Error('month must use YYYY-MM format');

    const startsAt = new Date(Date.UTC(year, monthIndex, 1));
    const endsAt = new Date(Date.UTC(year, monthIndex + 1, 1));
    const query = SubscriptionModel.find({
      'verification.status': 'VERIFIED',
      createdAt: { $gte: startsAt, $lt: endsAt }
    });
    const paidSubscriptions = typeof query.lean === 'function' ? await query.lean() : await query;

    return {
      period: { month, startsAt, endsAt },
      ...calculateEconomics({
        paidSubscriptions,
        monthlyCosts: readMonthlyCosts(env),
        stripePercent: parseNonNegative(env.ZORGAX_STRIPE_FEE_PERCENT),
        stripeFixedEur: parseNonNegative(env.ZORGAX_STRIPE_FEE_FIXED_EUR)
      })
    };
  }

  return { getMonthlyReport };
}

module.exports = {
  DEFAULT_PROVIDERS,
  PLAN_PRICES_EUR,
  readMonthlyCosts,
  calculateEconomics,
  createZorgaxUnitEconomicsService
};
