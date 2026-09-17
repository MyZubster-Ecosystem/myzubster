const mongoose = require('mongoose');
const User = require('../models/User');
const SellerMembership = require('../models/SellerMembership');
const Dashboard = require('../models/dashboardModel');

// #218: Admin Dashboard - Monitoraggio Lavori e Pagamenti
// Dashboard is the project's registered balance/transaction ledger model.

const since = days => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// Get system overview
exports.getOverview = async (req, res) => {
  try {
    const d1 = since(1), d7 = since(7), d30 = since(30);
    const [
      totalUsers, totalSellers, activeSellers, totalWallets,
      users24h, users7d, users30d,
      sellers24h, sellers7d, sellers30d,
      activeSellers24h, activeSellers7d, activeSellers30d
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
      SellerMembership.countDocuments({ status: 'ACTIVE', createdAt: { $gte: d30 } })
    ]);
    const dashboard = await Dashboard.aggregate([{$group: {_id: null, totalMYZ: {$sum: '$balanceMYZ'}, totalXMR: {$sum: '$balanceXMR'}}}]);
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
      totalMYZInCirculation: dashboard[0]?.totalMYZ || 0,
      totalXMRInCirculation: dashboard[0]?.totalXMR || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Get payment monitoring
exports.getPaymentMonitoring = async (req, res) => {
  try {
    const dashboards = await Dashboard.find({});
    const allTxs = dashboards.flatMap(d => d.transactions || []);
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
      totalVolume
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
      robots: dashboards.map(d => ({robotId: d.robotId, jobsCompleted: d.jobsCompleted, totalEarnings: d.totalEarnings, balanceMYZ: d.balanceMYZ}))
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
