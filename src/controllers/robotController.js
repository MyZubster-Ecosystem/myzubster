const RobotWallet = require('../models/RobotWallet');
const RobotJob = require('../models/RobotJob');
const RobotEscrow = require('../models/RobotEscrow');
const RobotReputation = require('../models/RobotReputation');
const agentCoreService = require('../services/agentCoreService');
const x402bService = require('../services/x402bService');
const erc8004Service = require('../services/erc8004Service');
const crypto = require('crypto');

// ============================================================
// ROBOT WALLET MANAGEMENT
// ============================================================

/**
 * POST /robots/register
 * Register a new robot and create its wallet via AWS AgentCore
 */
exports.registerRobot = async (req, res) => {
  try {
    const { robotName, description, chain } = req.body;
    const owner = req.userId;
    const ownerUsername = req.username;

    if (!robotName) {
      return res.status(400).json({
        success: false,
        message: 'robotName is required'
      });
    }

    // Generate unique robot ID
    const robotId = 'robot-' + crypto.createHash('sha256')
      .update(robotName + owner + Date.now())
      .digest('hex')
      .substring(0, 12);

    // Create wallet via AgentCore
    const walletResult = await agentCoreService.createWallet(
      robotId,
      robotName,
      chain || 'base-mainnet'
    );

    if (!walletResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create wallet via AgentCore',
        error: walletResult.error
      });
    }

    // Save wallet to database
    const wallet = new RobotWallet({
      robotId,
      robotName,
      description,
      owner,
      ownerUsername,
      agentCoreWalletId: walletResult.walletId,
      walletAddress: walletResult.address,
      walletPublicKey: walletResult.publicKey,
      chain: walletResult.chain,
      token: walletResult.token,
      auditTrail: [{
        action: 'wallet_created',
        details: `Wallet created via AgentCore: ${walletResult.walletId}`,
        timestamp: new Date()
      }]
    });

    await wallet.save();

    // Initialize reputation NFT
    const reputationResult = await erc8004Service.mintReputationNFT({
      walletAddress: walletResult.address,
      robotId: robotId,
      chain: walletResult.chain
    });

    // Save reputation
    const reputation = new RobotReputation({
      robot: wallet._id,
      robotId: robotId,
      walletAddress: walletResult.address,
      nftTokenId: reputationResult.tokenId,
      nftContractAddress: reputationResult.contractAddress,
      nftTxHash: reputationResult.txHash,
      chain: walletResult.chain,
      scores: reputationResult.nftData.scores,
      attestations: [{
        eventType: 'score_updated',
        txHash: reputationResult.txHash,
        newScore: reputationResult.nftData.scores.overall
      }]
    });

    await reputation.save();

    res.status(201).json({
      success: true,
      message: 'Robot registered successfully',
      data: {
        robotId,
        robotName,
        wallet: {
          address: walletResult.address,
          chain: walletResult.chain,
          token: walletResult.token,
          agentCoreWalletId: walletResult.walletId
        },
        reputation: {
          tokenId: reputationResult.tokenId,
          contractAddress: reputationResult.contractAddress,
          scores: reputationResult.nftData.scores,
          explorerUrl: reputationResult.explorerUrl
        },
        governance: {
          dailyCapUSD: wallet.dailyCapUSD,
          perTransactionCapUSD: wallet.perTransactionCapUSD
        }
      }
    });
  } catch (error) {
    console.error('registerRobot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register robot',
      error: error.message
    });
  }
};

/**
 * GET /robots
 * List all robots for the authenticated user
 */
exports.listRobots = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { owner: req.userId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const robots = await RobotWallet.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RobotWallet.countDocuments(query);

    // Get reputation for each robot
    const robotsWithRep = await Promise.all(
      robots.map(async (robot) => {
        const rep = await RobotReputation.findOne({ robot: robot._id });
        return {
          ...robot.toObject(),
          reputation: rep ? rep.scores : null
        };
      })
    );

    res.json({
      success: true,
      count: robotsWithRep.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: robotsWithRep
    });
  } catch (error) {
    console.error('listRobots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list robots',
      error: error.message
    });
  }
};

/**
 * GET /robots/:robotId
 * Get robot details
 */
exports.getRobot = async (req, res) => {
  try {
    const robot = await RobotWallet.findOne({ robotId: req.params.robotId });
    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    const reputation = await RobotReputation.findOne({ robot: robot._id });
    const jobs = await RobotJob.find({ robot: robot._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...robot.toObject(),
        reputation: reputation ? {
          scores: reputation.scores,
          totalJobs: reputation.totalJobs,
          completedJobs: reputation.completedJobs,
          disputedJobs: reputation.disputedJobs,
          successRate: reputation.successRate,
          nftTokenId: reputation.nftTokenId,
          explorerUrl: reputation.nftTokenId
            ? erc8004Service._getTokenExplorerUrl(reputation.nftTokenId, robot.chain)
            : null
        } : null,
        recentJobs: jobs
      }
    });
  } catch (error) {
    console.error('getRobot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get robot',
      error: error.message
    });
  }
};

/**
 * PATCH /robots/:robotId/governance
 * Update spending governance (admin or owner)
 */
exports.updateGovernance = async (req, res) => {
  try {
    const { dailyCapUSD, perTransactionCapUSD } = req.body;
    const robot = await RobotWallet.findOne({ robotId: req.params.robotId });

    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    if (robot.owner.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update on AgentCore
    if (robot.agentCoreWalletId) {
      await agentCoreService.updateGovernance(
        robot.agentCoreWalletId,
        dailyCapUSD,
        perTransactionCapUSD
      );
    }

    // Update local
    if (dailyCapUSD !== undefined) robot.dailyCapUSD = dailyCapUSD;
    if (perTransactionCapUSD !== undefined) robot.perTransactionCapUSD = perTransactionCapUSD;

    robot.auditTrail.push({
      action: 'governance_updated',
      details: `Daily cap: $${robot.dailyCapUSD}, Per-tx cap: $${robot.perTransactionCapUSD}`,
      timestamp: new Date()
    });

    await robot.save();

    res.json({
      success: true,
      message: 'Governance updated',
      data: {
        robotId: robot.robotId,
        dailyCapUSD: robot.dailyCapUSD,
        perTransactionCapUSD: robot.perTransactionCapUSD
      }
    });
  } catch (error) {
    console.error('updateGovernance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update governance',
      error: error.message
    });
  }
};

// ============================================================
// JOB MANAGEMENT
// ============================================================

/**
 * POST /robots/jobs/create
 * Create a new job with Boson x402B escrow
 */
exports.createJob = async (req, res) => {
  try {
    const { robotId, title, description, amountUSD } = req.body;

    if (!robotId || !title || !description || !amountUSD) {
      return res.status(400).json({
        success: false,
        message: 'robotId, title, description, and amountUSD are required'
      });
    }

    const robot = await RobotWallet.findOne({ robotId });
    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }

    // Check spending governance
    const govCheck = await agentCoreService.checkSpendingGovernance(
      robot.agentCoreWalletId,
      amountUSD
    );
    if (!govCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: 'Spending governance violation',
        reason: govCheck.reason
      });
    }

    // Calculate fees
    const feePercent = 2;
    const feeAmountUSD = amountUSD * (feePercent / 100);
    const robotPayoutUSD = amountUSD - feeAmountUSD;

    // Generate job ID
    const jobId = 'job-' + crypto.createHash('sha256')
      .update(robotId + title + Date.now())
      .digest('hex')
      .substring(0, 12);

    // Create Boson offer
    const offerResult = await x402bService.createOffer({
      sellerAddress: robot.walletAddress,
      amountUSD: amountUSD,
      token: robot.token,
      chain: robot.chain,
      jobId: jobId,
      description: description
    });

    // Save job
    const job = new RobotJob({
      jobId,
      title,
      description,
      robot: robot._id,
      robotId,
      client: req.userId,
      clientUsername: req.username,
      amountUSD,
      feePercent,
      feeAmountUSD,
      robotPayoutUSD,
      currency: robot.token,
      chain: robot.chain,
      bosonOfferId: offerResult.offerId,
      status: 'created',
      auditTrail: [{
        action: 'job_created',
        by: req.username,
        details: `Job created with $${amountUSD} escrow`,
        timestamp: new Date()
      }]
    });

    await job.save();

    // Commit to escrow
    const commitResult = await x402bService.commitToOffer(
      offerResult.offerId,
      robot.walletAddress,
      amountUSD
    );

    // Update job with escrow info
    job.escrowId = commitResult.exchangeId;
    job.bosonExchangeId = commitResult.exchangeId;
    job.status = 'escrow_committed';
    job.committedAt = new Date();
    job.auditTrail.push({
      action: 'escrow_committed',
      details: `Escrow committed: ${commitResult.exchangeId}`,
      txHash: commitResult.commitTxHash,
      timestamp: new Date()
    });

    await job.save();

    // Create escrow record
    const escrow = new RobotEscrow({
      escrowId: commitResult.exchangeId,
      bosonOfferId: offerResult.offerId,
      bosonExchangeId: commitResult.exchangeId,
      job: job._id,
      jobId,
      seller: robot._id,
      sellerAddress: robot.walletAddress,
      buyer: req.userId,
      amountUSD,
      token: robot.token,
      chain: robot.chain,
      state: 'committed',
      commitTxHash: commitResult.commitTxHash,
      committedAt: new Date(),
      feePercent,
      feeAmountUSD
    });

    await escrow.save();

    res.status(201).json({
      success: true,
      message: 'Job created with escrow',
      data: {
        jobId,
        title,
        amountUSD,
        feePercent,
        feeAmountUSD,
        robotPayoutUSD,
        escrowId: commitResult.exchangeId,
        offerId: offerResult.offerId,
        status: 'escrow_committed',
        robot: {
          robotId,
          address: robot.walletAddress
        }
      }
    });
  } catch (error) {
    console.error('createJob error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
};

/**
 * POST /robots/jobs/:jobId/deliver
 * Robot submits delivery proof
 */
exports.submitDelivery = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { deliveryProof, deliveryUrl } = req.body;

    const job = await RobotJob.findOne({ jobId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'escrow_committed' && job.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit delivery in status: ${job.status}`
      });
    }

    job.deliveryProof = deliveryProof;
    job.deliveryUrl = deliveryUrl;
    job.status = 'submitted';
    job.submittedAt = new Date();
    job.auditTrail.push({
      action: 'delivery_submitted',
      by: req.username,
      details: 'Delivery proof submitted',
      timestamp: new Date()
    });

    await job.save();

    res.json({
      success: true,
      message: 'Delivery submitted',
      data: {
        jobId,
        status: 'submitted',
        submittedAt: job.submittedAt
      }
    });
  } catch (error) {
    console.error('submitDelivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit delivery',
      error: error.message
    });
  }
};

/**
 * POST /robots/jobs/:jobId/verify
 * Client verifies and releases escrow
 */
exports.verifyAndRedeem = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { rating, comment } = req.body;

    const job = await RobotJob.findOne({ jobId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify in status: ${job.status}`
      });
    }

    // Redeem escrow via x402B
    const redeemResult = await x402bService.redeemEscrow(
      job.bosonExchangeId,
      job.robotId,
      job.deliveryProof
    );

    // Update job
    job.status = 'redeemed';
    job.redeemedAt = new Date();
    job.feeTxHash = redeemResult.redeemTxHash;
    job.feeCollectedAt = new Date();
    job.auditTrail.push({
      action: 'escrow_redeemed',
      by: req.username,
      details: `Redeemed: $${redeemResult.robotPayoutUSD} to robot, $${redeemResult.feeAmountUSD} fee`,
      txHash: redeemResult.redeemTxHash,
      timestamp: new Date()
    });

    await job.save();

    // Update reputation
    const reputation = await RobotReputation.findOne({ robot: job.robot });
    if (reputation) {
      const newScores = erc8004Service.calculateScoreUpdate(
        reputation.scores,
        { completed: true, onTime: true, quality: rating >= 4 ? 'good' : 'poor', disputed: false }
      );

      reputation.scores = {
        punctuality: newScores.punctuality,
        quality: newScores.quality,
        reliability: newScores.reliability,
        overall: Math.round(
          (newScores.punctuality + newScores.quality + newScores.reliability) / 3
        )
      };
      reputation.totalJobs += 1;
      reputation.completedJobs += 1;

      // Add review
      reputation.reviews.push({
        job: job._id,
        jobId,
        reviewer: req.userId,
        reviewerUsername: req.username,
        rating: rating || 5,
        comment
      });

      // Attest on-chain
      const attestResult = await erc8004Service.attestJobCompletion({
        tokenId: reputation.nftTokenId,
        jobId,
        rating: rating || 5,
        chain: job.chain
      });

      reputation.attestations.push({
        eventType: 'job_completed',
        txHash: attestResult.txHash,
        newScore: reputation.scores.overall
      });

      reputation.reputationNftId = attestResult.txHash;

      await reputation.save();
    }

    // Update escrow record
    const escrow = await RobotEscrow.findOne({ escrowId: job.bosonExchangeId });
    if (escrow) {
      escrow.state = 'redeemed';
      escrow.redeemTxHash = redeemResult.redeemTxHash;
      escrow.redeemedAt = new Date();
      escrow.feeTxHash = redeemResult.redeemTxHash;
      escrow.feeCollectedAt = new Date();
      await escrow.save();
    }

    res.json({
      success: true,
      message: 'Job verified and escrow redeemed',
      data: {
        jobId,
        status: 'redeemed',
        amountUSD: redeemResult.amountUSD,
        feePercent: redeemResult.feePercent,
        feeAmountUSD: redeemResult.feeAmountUSD,
        robotPayoutUSD: redeemResult.robotPayoutUSD,
        redeemTxHash: redeemResult.redeemTxHash,
        reputation: reputation ? reputation.scores : null
      }
    });
  } catch (error) {
    console.error('verifyAndRedeem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify and redeem',
      error: error.message
    });
  }
};

/**
 * POST /robots/jobs/:jobId/dispute
 * Open a dispute
 */
exports.openDispute = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;

    const job = await RobotJob.findOne({ jobId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.status = 'disputed';
    job.auditTrail.push({
      action: 'dispute_opened',
      by: req.username,
      details: `Reason: ${reason}`,
      timestamp: new Date()
    });

    await job.save();

    // Update escrow
    const escrow = await RobotEscrow.findOne({ escrowId: job.bosonExchangeId });
    if (escrow) {
      escrow.state = 'disputed';
      escrow.disputeReason = reason;
      escrow.disputedAt = new Date();
      await escrow.save();
    }

    // Update reputation
    const reputation = await RobotReputation.findOne({ robot: job.robot });
    if (reputation) {
      reputation.disputedJobs += 1;
      await reputation.save();
    }

    res.json({
      success: true,
      message: 'Dispute opened',
      data: { jobId, status: 'disputed', reason }
    });
  } catch (error) {
    console.error('openDispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to open dispute',
      error: error.message
    });
  }
};

/**
 * GET /robots/jobs
 * List jobs
 */
exports.listJobs = async (req, res) => {
  try {
    const { robotId, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (robotId) query.robotId = robotId;
    if (status) query.status = status;

    // Non-admin users only see their own jobs
    if (req.userRole !== 'admin') {
      query.$or = [
        { client: req.userId },
        { owner: req.userId }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await RobotJob.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RobotJob.countDocuments(query);

    res.json({
      success: true,
      count: jobs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: jobs
    });
  } catch (error) {
    console.error('listJobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list jobs',
      error: error.message
    });
  }
};

/**
 * GET /robots/jobs/:jobId
 * Get job details
 */
exports.getJob = async (req, res) => {
  try {
    const job = await RobotJob.findOne({ jobId: req.params.jobId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const escrow = await RobotEscrow.findOne({ escrowId: job.bosonExchangeId });

    res.json({
      success: true,
      data: {
        ...job.toObject(),
        escrow: escrow || null
      }
    });
  } catch (error) {
    console.error('getJob error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job',
      error: error.message
    });
  }
};

/**
 * GET /robots/dashboard
 * Admin dashboard for all escrows and disputes
 */
exports.getDashboard = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const totalRobots = await RobotWallet.countDocuments();
    const activeRobots = await RobotWallet.countDocuments({ status: 'active' });

    const jobStats = await RobotJob.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amountUSD' } } }
    ]);

    const pendingEscrows = await RobotEscrow.find({ state: 'committed' })
      .populate('job')
      .limit(20);

    const disputes = await RobotEscrow.find({ state: 'disputed' })
      .populate('job')
      .limit(20);

    const recentRedemptions = await RobotEscrow.find({ state: 'redeemed' })
      .sort({ redeemedAt: -1 })
      .limit(10);

    const totalFeesCollected = await RobotEscrow.aggregate([
      { $match: { state: 'redeemed' } },
      { $group: { _id: null, total: { $sum: '$feeAmountUSD' } } }
    ]);

    res.json({
      success: true,
      data: {
        robots: { total: totalRobots, active: activeRobots },
        jobs: jobStats,
        pendingEscrows,
        disputes,
        recentRedemptions,
        totalFeesCollected: totalFeesCollected[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard',
      error: error.message
    });
  }
};
