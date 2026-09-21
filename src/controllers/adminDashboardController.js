const mongoose = require('mongoose');
const User = require('../models/User');
const SellerMembership = require('../models/SellerMembership');
const Dashboard = require('../models/dashboardModel');
const MarketplaceListing = require('../models/MarketplaceListing');
const PaymentIntent = require('../models/PaymentIntent');
const PaymentDashboardTransaction = require('../models/PaymentDashboardTransaction');
const { stripeFundingInputsProvider } = require('../services/paymentDashboardStripeProvider');
const settlementDashboard = require('../services/settlementDashboardService');

// #218: Admin Dashboard - Monitoraggio Lavori e Pagamenti
// Dashboard remains the legacy XMR/operations model. Canonical MYZ accounting lives in myzLedgerApiService.

const since = days => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// Get system overview
exports.getOverview = async (req, res) => {
  try {
    const d1 = since(1), d7 = since(7), d30 = since(30);
    const [
      totalUsers, totalSellers, activeSellers, totalWallets,
      users24h, users7d, users30d,
      sellers24h, sellers7d, sellers30d,
      activeSellers24h, activeSellers7d, activeSellers30d,
      totalListings, activeListings, confirmedCryptoPurchases, stripePaidTransactions, stripeRevenue
    ] = await Promise.all([
      User.countDocuments(),
      SellerMembership.countDocuments(),
      SellerMembership.countDocuments({ status: 'ACTIVE' }),
      Dashboard.countDocuments(),
      User.countDocuments({ createdAt: { $gte: d1 } }),
      User.countDocuments({ createdAt: { $gte: d7 } }),
      User.countDocuments({ createdAt: { $gte: d30 } }),
      SellerMembership.countDocuments({ createdAt: { $gte: d1 } }),
      SellerMembership.countDocuments({ createdAt: { $gte: d7 } }),
      SellerMembership.countDocuments({ createdAt: { $gte: d30 } }),
      SellerMembership.countDocuments({ status: 'ACTIVE', createdAt: { $gte: d1 } }),
      SellerMembership.countDocuments({ status: 'ACTIVE', createdAt: { $gte: d7 } }),
      SellerMembership.countDocuments({ status: 'ACTIVE', createdAt: { $gte: d30 } }),
      MarketplaceListing.countDocuments(),
      MarketplaceListing.countDocuments({ status: 'active' }),
      PaymentIntent.countDocuments({ status: 'CONFIRMED' }),
      PaymentDashboardTransaction.countDocuments({ paymentStatus: 'paid', livemode: true }),
      PaymentDashboardTransaction.aggregate([{ $match: { paymentStatus: 'paid', livemode: true } }, { $group: { _id: '$currency', amountCents: { $sum: '$amountCents' }, count: { $sum: 1 } } }])
    ]);
    const dashboard = await Dashboard.aggregate([{$group: {_id: null, totalXMR: {$sum: '$balanceXMR'}}}]);
    let stripeLive = { configured: false, items: [], error: null };
    try { stripeLive = await stripeFundingInputsProvider(); }
    catch (error) { stripeLive = { configured: true, items: [], error: error.message }; }
    const settledStripe = (stripeLive.items || []).filter(item => item.livemode === true && (item.status === 'SETTLED' || item.status === 'CONFIRMED'));
    const stripeLiveRevenueByAsset = Object.values(settledStripe.reduce((acc, item) => { const asset = item.asset || 'UNKNOWN'; if (!acc[asset]) acc[asset] = { currency: asset, amount: 0, transactions: 0 }; acc[asset].amount += Number(item.amount || 0); acc[asset].transactions += 1; return acc; }, {}));
    const stripeMongoRevenue = stripeRevenue.map(row => ({ currency: row._id, amountMinor: row.amountCents, amount: row.amountCents / 100, transactions: row.count }));
    const stripeEffectiveCount = stripeLive.configured && !stripeLive.error ? settledStripe.length : stripePaidTransactions;
    const stripeEffectiveRevenue = stripeLive.configured && !stripeLive.error ? stripeLiveRevenueByAsset : stripeMongoRevenue;
    const treasury = settlementDashboard.buildDashboard();
    const settledFunding = treasury.layers?.funding_inputs?.items || [];
    const settledByAsset = asset => settledFunding.filter(item => item.status === 'SETTLED' && item.asset === asset).reduce((sum,item) => sum + Number(item.amount || 0), 0);
    const btcBalance = settledByAsset('BTC');
    res.json({
      totalUsers,
      totalSellers,
      activeSellers,
      growth: {
        users: { last24h: users24h, last7d: users7d, last30d: users30d },
        sellers: { last24h: sellers24h, last7d: sellers7d, last30d: sellers30d },
        activeSellers: { last24h: activeSellers24h, last7d: activeSellers7d, last30d: activeSellers30d }
      },
      totalWallets,
      totalMYZInCirculation: null,
      totalMYZAccountingSource: 'canonical-ledger',
      totalXMRInCirculation: dashboard[0]?.totalXMR || 0,
      cryptoBalances: {
        BTC: { amount: btcBalance, source: 'settled-funding-inputs', verified: true },
        XMR: { amount: treasury.balances?.xmr?.amount ?? null, source: treasury.balances?.xmr?.source ?? null, verified: false, reason: treasury.balances?.xmr?.reason || 'Monero wallet RPC balance unavailable' },
        ETH: { amount: null, source: null, verified: false, reason: 'No verified Ethereum treasury balance provider is configured' }
      },
      commerce: {
        listings: { total: totalListings, active: activeListings },
        purchases: { stripePaid: stripeEffectiveCount, cryptoConfirmed: confirmedCryptoPurchases, total: stripeEffectiveCount + confirmedCryptoPurchases },
        stripeRevenue: stripeEffectiveRevenue,
        stripeSource: stripeLive.configured && !stripeLive.error ? 'stripe-live-readonly' : 'verified-mongodb',
        stripeWindowLimit: stripeLive.configured && !stripeLive.error ? Number(process.env.PAYMENT_DASHBOARD_STRIPE_LIMIT || 25) : null,
        stripeError: stripeLive.error || null
      },
      funnel: {
        visitors: null,
        visitorsSource: 'vercel-analytics-external',
        registeredUsers: totalUsers,
        sellers: totalSellers,
        purchasers: stripeEffectiveCount + confirmedCryptoPurchases
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Get payment monitoring
exports.getPaymentMonitoring = async (req, res) => {
  try {
    const dashboards = await Dashboard.find({});
    const allTxs = dashboards.flatMap(d => d.transactions || []).filter(tx => tx.currency !== 'MYZ');
    const today = new Date().toISOString().slice(0,10);
    const todayTxs = allTxs.filter(t => new Date(t.timestamp).toISOString().slice(0,10) === today);
    const pending = allTxs.filter(t => t.status === 'pending');
    const failed = allTxs.filter(t => t.status === 'failed');
    const totalVolume = allTxs.reduce((s, t) => s + t.amount, 0);
    res.json({
      totalTransactions: allTxs.length,
      todayTransactions: todayTxs.length,
      pendingTransactions: pending.length,
      failedTransactions: failed.length,
      totalVolume,
      myzAccountingSource:'canonical-ledger'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Get job monitoring
exports.getJobMonitoring = async (req, res) => {
  try {
    const dashboards = await Dashboard.find({ robotId: { $ne: null } });
    const totalRobots = dashboards.length;
    const totalJobs = dashboards.reduce((s, d) => s + d.jobsCompleted, 0);
    const totalEarnings = dashboards.reduce((s, d) => s + d.totalEarnings, 0);
    res.json({
      totalRobots,
      totalJobsCompleted: totalJobs,
      totalRobotEarnings: totalEarnings,
      robots: dashboards.map(d => ({robotId: d.robotId, jobsCompleted: d.jobsCompleted, totalEarnings: d.totalEarnings, balanceMYZ:null, balanceMYZSource:'canonical-ledger-unmapped-robot-account'}))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Get system health
exports.getSystemHealth = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const memUsage = process.memoryUsage();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      database: dbState,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
