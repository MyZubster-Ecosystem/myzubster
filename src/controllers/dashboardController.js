const Dashboard = require('../models/dashboardModel');
const { v4: uuidv4 } = require('uuid');

// #242: User dashboard - balance and transaction history
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const d = await Dashboard.getOrCreate(userId);
    res.json({
      userId: d.userId,
      balanceMYZ: d.balanceMYZ,
      balanceXMR: d.balanceXMR,
      transactionCount: d.transactions.length,
      transactions: d.transactions.slice(-20).reverse(),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #245: Robot dashboard - earnings and work history
exports.getRobotDashboard = async (req, res) => {
  try {
    const { robotId } = req.params;
    if (!robotId) return res.status(400).json({ error: 'robotId is required' });
    const d = await Dashboard.findOne({ robotId });
    if (!d) return res.status(404).json({ error: 'Robot not found' });
    const earnings = d.transactions.filter(t => t.type === 'earn');
    res.json({
      robotId: d.robotId,
      totalEarnings: d.totalEarnings,
      jobsCompleted: d.jobsCompleted,
      balanceMYZ: d.balanceMYZ,
      balanceXMR: d.balanceXMR,
      earningsHistory: earnings.slice(-20).reverse(),
      allTransactions: d.transactions.slice(-20).reverse()
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #243: P2P transfer endpoint
exports.createP2PTransfer = async (req, res) => {
  try {
    const { senderId, receiverId, amount, currency, description } = req.body;
    if (!senderId || !receiverId || !amount || !currency)
      return res.status(400).json({ error: 'senderId, receiverId, amount, and currency are required' });
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot transfer to self' });
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

    const sender = await Dashboard.getOrCreate(senderId);
    const receiver = await Dashboard.getOrCreate(receiverId);

    // Check balance
    if (currency === 'MYZ' && sender.balanceMYZ < amount)
      return res.status(400).json({ error: 'Insufficient MYZ balance' });
    if (currency === 'XMR' && sender.balanceXMR < amount)
      return res.status(400).json({ error: 'Insufficient XMR balance' });

    // Execute transfer
    sender.addTransaction('transfer_out', amount, currency, receiverId, description || `P2P transfer to ${receiverId}`);
    receiver.addTransaction('transfer_in', amount, currency, senderId, description || `P2P transfer from ${senderId}`);
    await sender.save();
    await receiver.save();

    res.json({
      message: 'P2P transfer successful',
      senderId, receiverId, amount, currency,
      senderBalance: currency === 'MYZ' ? sender.balanceMYZ : sender.balanceXMR,
      receiverBalance: currency === 'MYZ' ? receiver.balanceMYZ : receiver.balanceXMR
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #241: Add payment option to marketplace checkout
exports.addCheckoutPayment = async (req, res) => {
  try {
    const { userId, orderId, amount, currency, paymentMethod } = req.body;
    if (!userId || !orderId || !amount || !currency)
      return res.status(400).json({ error: 'userId, orderId, amount, and currency are required' });
    const method = paymentMethod || currency;
    if (!['MYZ', 'XMR'].includes(method))
      return res.status(400).json({ error: 'Payment method must be MYZ or XMR' });

    const d = await Dashboard.getOrCreate(userId);
    // Check balance
    if (method === 'MYZ' && d.balanceMYZ < amount)
      return res.status(400).json({ error: 'Insufficient MYZ balance for checkout' });
    if (method === 'XMR' && d.balanceXMR < amount)
      return res.status(400).json({ error: 'Insufficient XMR balance for checkout' });

    d.addTransaction('purchase', amount, method, orderId, `Marketplace checkout for order ${orderId}`);
    await d.save();

    res.json({
      message: 'Payment processed for marketplace checkout',
      orderId, amount, currency: method,
      remainingBalance: method === 'MYZ' ? d.balanceMYZ : d.balanceXMR
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// #244: Handle real Monero webhook
exports.handleMoneroWebhook = async (req, res) => {
  try {
    const { txHash, userId, amount, confirmations, blockHeight } = req.body;
    if (!txHash || !userId || !amount)
      return res.status(400).json({ error: 'txHash, userId, and amount are required' });

    const d = await Dashboard.getOrCreate(userId);
    // Check for duplicate webhook
    const existing = d.transactions.find(t => t.txId === txHash);
    if (existing)
      return res.json({ message: 'Webhook already processed', txHash, status: existing.status });

    d.addTransaction('webhook', amount, 'XMR', null, `Monero payment received: ${txHash}`);
    await d.save();

    res.json({
      message: 'Monero webhook processed',
      txHash, userId, amount,
      newBalanceXMR: d.balanceXMR,
      confirmations: confirmations || 0,
      blockHeight: blockHeight || null
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// List transactions
exports.listTransactions = async (req, res) => {
  try {
    const { userId, type, currency } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const d = await Dashboard.getOrCreate(userId);
    let txs = d.transactions;
    if (type) txs = txs.filter(t => t.type === type);
    if (currency) txs = txs.filter(t => t.currency === currency);
    res.json({
      count: txs.length,
      transactions: txs.slice(-100).reverse()
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Get stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await Dashboard.countDocuments();
    const totalMYZ = await Dashboard.aggregate([
      { $group: { _id: null, total: { $sum: '$balanceMYZ' } } }
    ]);
    const totalXMR = await Dashboard.aggregate([
      { $group: { _id: null, total: { $sum: '$balanceXMR' } } }
    ]);
    const totalTransactions = await Dashboard.aggregate([
      { $project: { txCount: { $size: '$transactions' } } },
      { $group: { _id: null, total: { $sum: '$txCount' } } }
    ]);
    res.json({
      totalUsers,
      totalMYZInCirculation: totalMYZ[0]?.total || 0,
      totalXMRInCirculation: totalXMR[0]?.total || 0,
      totalTransactions: totalTransactions[0]?.total || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
