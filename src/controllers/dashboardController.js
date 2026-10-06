const Dashboard = require('../models/dashboardModel');
const myzLedgerApiService = require('../services/myzLedgerApiService');
const { myzAccountForUser } = require('../services/marketplaceMyzPaymentService');

// #242: User dashboard - balance and transaction history
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (String(req.user?.userId || '') !== String(userId) && req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const d = await Dashboard.getOrCreate(userId);
    const myz = myzLedgerApiService.getHistory({ accountId:myzAccountForUser(userId), limit:20 });
    res.json({
      userId: d.userId,
      balanceMYZ: myz.balanceMyz,
      balanceMYZSource: 'canonical-ledger',
      balanceXMR: d.balanceXMR,
      transactionCount: myz.entries.length + d.transactions.filter(tx => tx.currency !== 'MYZ').length,
      myzTransactions: myz.entries,
      transactions: d.transactions.filter(tx => tx.currency !== 'MYZ').slice(-20).reverse(),
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
      balanceMYZ: null,
      balanceMYZSource: 'canonical-ledger-unmapped-robot-account',
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

    if (currency === 'MYZ') {
      if (String(req.user?.userId || '') !== String(senderId) && req.user?.role !== 'admin') return res.status(403).json({ error: 'Sender must match authenticated user' });
      const idempotencyKey = String(req.headers['idempotency-key'] || '').trim();
      if (!idempotencyKey) return res.status(400).json({ error: 'Idempotency-Key is required' });
      const transfer = myzLedgerApiService.transfer({
        from_account_id:myzAccountForUser(senderId),
        to_account_id:myzAccountForUser(receiverId),
        amount_myz:String(amount),
        idempotency_key:`dashboard-p2p:${senderId}:${idempotencyKey}`,
        reference:{ type:'DASHBOARD_P2P', client_idempotency_key:idempotencyKey },
        note:description || `P2P transfer to ${receiverId}`
      });
      return res.json({
        message:'P2P MYZ transfer recorded in canonical ledger',
        senderId, receiverId, amount:String(amount), currency:'MYZ',
        transferId:transfer.transferId,
        debitEntryId:transfer.debitEntry.entry_id,
        creditEntryId:transfer.creditEntry.entry_id,
        senderBalance:transfer.fromBalanceMyz,
        receiverBalance:transfer.toBalanceMyz,
        duplicate:transfer.duplicate
      });
    }

    const sender = await Dashboard.getOrCreate(senderId);
    const receiver = await Dashboard.getOrCreate(receiverId);
    if (currency === 'XMR' && sender.balanceXMR < amount)
      return res.status(400).json({ error: 'Insufficient XMR balance' });

    sender.addTransaction('transfer_out', amount, currency, receiverId, description || `P2P transfer to ${receiverId}`);
    receiver.addTransaction('transfer_in', amount, currency, senderId, description || `P2P transfer from ${senderId}`);
    await sender.save();
    await receiver.save();

    res.json({
      message: 'P2P transfer successful',
      senderId, receiverId, amount, currency,
      senderBalance: sender.balanceXMR,
      receiverBalance: receiver.balanceXMR
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

    if (method === 'MYZ') {
      return res.status(410).json({
        error:'Legacy MYZ checkout is disabled',
        code:'MYZ_CHECKOUT_MOVED',
        next:'/api/marketplace/orders/:id/payment/myz',
        message:'Usa il pagamento MYZ dell’ordine Marketplace: il dashboard legacy non è una fonte contabile MYZ.'
      });
    }

    const d = await Dashboard.getOrCreate(userId);
    if (method === 'XMR' && d.balanceXMR < amount)
      return res.status(400).json({ error: 'Insufficient XMR balance for checkout' });

    d.addTransaction('purchase', amount, method, orderId, `Marketplace checkout for order ${orderId}`);
    await d.save();

    res.json({
      message: 'Payment processed for marketplace checkout',
      orderId, amount, currency: method,
      remainingBalance: d.balanceXMR
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
    if (String(req.user?.userId || '') !== String(userId) && req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (String(currency || '').toUpperCase() === 'MYZ') {
      const history = myzLedgerApiService.getHistory({ accountId:myzAccountForUser(userId), limit:100 });
      return res.json({ count:history.entries.length, asset:'MYZ', source:'canonical-ledger', balanceMYZ:history.balanceMyz, transactions:history.entries });
    }
    const d = await Dashboard.getOrCreate(userId);
    let txs = d.transactions.filter(t => t.currency !== 'MYZ');
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
    const totalXMR = await Dashboard.aggregate([
      { $group: { _id: null, total: { $sum: '$balanceXMR' } } }
    ]);
    const totalTransactions = await Dashboard.aggregate([
      { $project: { txCount: { $size: '$transactions' } } },
      { $group: { _id: null, total: { $sum: '$txCount' } } }
    ]);
    res.json({
      totalUsers,
      totalMYZInCirculation: null,
      totalMYZAccountingSource: 'canonical-ledger',
      totalXMRInCirculation: totalXMR[0]?.total || 0,
      totalTransactions: totalTransactions[0]?.total || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
