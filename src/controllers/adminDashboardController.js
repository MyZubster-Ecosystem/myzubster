const mongoose = require('mongoose');

// #218: Admin Dashboard - Monitoraggio Lavori e Pagamenti
// Uses existing models (Dashboard, Wallet, Escrow, Dispute, etc.)

// Get system overview
exports.getOverview = async (req, res) => {
  try {
    const Dashboard = mongoose.model('Dashboard');
    const Wallet = mongoose.model('Wallet');
    const totalUsers = await Dashboard.countDocuments();
    const totalWallets = await Wallet.countDocuments();
    const dashboard = await Dashboard.aggregate([{$group: {_id: null, totalMYZ: {$sum: '$balanceMYZ'}, totalXMR: {$sum: '$balanceXMR'}}}]);
    const wallets = await Wallet.aggregate([{$group: {_id: null, totalMYZ: {$sum: '$balanceMYZ'}, totalXMR: {$sum: '$balanceXMR'}}}]);
    res.json({
      totalUsers,
      totalWallets,
      totalMYZInCirculation: (dashboard[0]?.totalMYZ || 0) + (wallets[0]?.totalMYZ || 0),
      totalXMRInCirculation: (dashboard[0]?.totalXMR || 0) + (wallets[0]?.totalXMR || 0)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Get payment monitoring
exports.getPaymentMonitoring = async (req, res) => {
  try {
    const Wallet = mongoose.model('Wallet');
    const wallets = await Wallet.find({});
    const allTxs = wallets.flatMap(w => w.transactions);
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
    const Dashboard = mongoose.model('Dashboard');
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
