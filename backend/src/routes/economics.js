const express = require('express');

const router = express.Router();

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

router.post('/simulate', (req, res) => {
  const {
    transactions,
    average_ticket,
    zorgax_pro_users,
    zorgax_developer_users,
    marketplace_commission_percent,
    payment_fee_percent,
    payment_fee_fixed,
    ai_monthly_cost,
    hosting_monthly_cost,
    other_monthly_cost
  } = req.body || {};

  const tx = Math.max(0, number(transactions));
  const ticket = Math.max(0, number(average_ticket));

  const gmv = tx * ticket;

  const marketplaceRevenue =
    gmv *
    Math.max(0, number(marketplace_commission_percent)) /
    100;

  /*
   * No subscription prices are assumed here.
   * Until explicit Zorgax pricing is supplied, these remain zero.
   */
  const zorgaxProRevenue = 0;
  const zorgaxDeveloperRevenue = 0;

  const paymentCost =
    gmv * Math.max(0, number(payment_fee_percent)) / 100 +
    tx * Math.max(0, number(payment_fee_fixed));

  const aiCost = Math.max(0, number(ai_monthly_cost));
  const hostingCost = Math.max(0, number(hosting_monthly_cost));
  const otherCost = Math.max(0, number(other_monthly_cost));

  const monthlyRevenue =
    marketplaceRevenue +
    zorgaxProRevenue +
    zorgaxDeveloperRevenue;

  const monthlyCosts =
    paymentCost +
    aiCost +
    hostingCost +
    otherCost;

  const monthlyMargin = monthlyRevenue - monthlyCosts;

  res.json({
    success: true,
    simulation: true,

    gmv,

    marketplace: {
      revenue: marketplaceRevenue
    },

    zorgax: {
      pro: {
        users: Math.max(0, number(zorgax_pro_users)),
        revenue: zorgaxProRevenue
      },
      developer: {
        users: Math.max(0, number(zorgax_developer_users)),
        revenue: zorgaxDeveloperRevenue
      }
    },

    costs: {
      payment_cost: paymentCost,
      ai_monthly_cost: aiCost,
      hosting_monthly_cost: hostingCost,
      other_monthly_cost: otherCost
    },

    monthly_revenue: monthlyRevenue,
    monthly_costs: monthlyCosts,
    monthly_margin: monthlyMargin,

    annualized_revenue: monthlyRevenue * 12,
    annualized_costs: monthlyCosts * 12,
    annualized_margin: monthlyMargin * 12
  });
});

module.exports = router;