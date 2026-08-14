
/**
 * Bounty Controller
 * Handles bounty CRUD operations and reward assignment/minting
 */

const Bounty = require('../models/Bounty');

/**
 * Get all bounties
 */
const getBounties = async (req, res) => {
  try {
    const bounties = await Bounty.find({}).lean();
    res.json({ success: true, data: bounties });
  } catch (error) {
    console.error('Error fetching bounties:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get a single bounty by ID
 */
const getBountyById = async (req, res) => {
  try {
    const bounty = await Bounty.findById(req.params.id).lean();
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }
    res.json({ success: true, data: bounty });
  } catch (error) {
    console.error('Error fetching bounty:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create a new bounty
 */
const createBounty = async (req, res) => {
  try {
    const { title, description, reward, currency, assignee } = req.body;

    if (!title || !description || reward === undefined) {
      return res.status(400).json({
        success: false,
        error: 'title, description, and reward are required'
      });
    }

    const bounty = await Bounty.create({
      title,
      description,
      reward: Number(reward),
      currency: currency || 'XMR',
      assignee: assignee || null,
      status: 'open',
      minted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ success: true, data: bounty });
  } catch (error) {
    console.error('Error creating bounty:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Automatically assign a bounty to a user
 */
const assignBounty = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignee, userId } = req.body;

    const recipient = assignee || userId;
    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'assignee or userId is required'
      });
    }

    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }

    if (bounty.status === 'completed' || bounty.status === 'assigned') {
      return res.status(409).json({
        success: false,
        error: `Bounty is already ${bounty.status}`
      });
    }

    bounty.assignee = recipient;
    bounty.status = 'assigned';
    bounty.assignedAt = new Date();
    bounty.updatedAt = new Date();
    await bounty.save();

    console.log(`[BountyController] Bounty ${id} assigned to ${recipient}`);

    res.json({
      success: true,
      data: bounty,
      message: `Bounty successfully assigned to ${recipient}`
    });
  } catch (error) {
    console.error('Error assigning bounty:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Mint reward for a completed bounty (automatic reward minting)
 */
const mintReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { txHash, walletAddress } = req.body;

    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }

    if (!bounty.assignee) {
      return res.status(400).json({
        success: false,
        error: 'Bounty must be assigned before minting reward'
      });
    }

    if (bounty.minted) {
      return res.status(409).json({
        success: false,
        error: 'Reward has already been minted for this bounty'
      });
    }

    // Perform automatic reward minting
    const mintResult = await performMinting({
      bountyId: id,
      reward: bounty.reward,
      currency: bounty.currency || 'XMR',
      assignee: bounty.assignee,
      walletAddress: walletAddress || bounty.walletAddress,
      txHash
    });

    bounty.minted = true;
    bounty.status = 'completed';
    bounty.mintedAt = new Date();
    bounty.mintTxHash = mintResult.txHash;
    bounty.updatedAt = new Date();
    await bounty.save();

    console.log(`[BountyController] Reward minted for bounty ${id}: ${mintResult.txHash}`);

    res.json({
      success: true,
      data: bounty,
      mint: mintResult,
      message: `Reward of ${bounty.reward} ${bounty.currency || 'XMR'} minted successfully`
    });
  } catch (error) {
    console.error('Error minting reward:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Automatically assign and mint reward in one step
 */
const assignAndMint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignee, userId, walletAddress, txHash } = req.body;

    const recipient = assignee || userId;
    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'assignee or userId is required'
      });
    }

    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }

    if (bounty.minted) {
      return res.status(409).json({
        success: false,
        error: 'Reward has already been minted for this bounty'
      });
    }

    // Assign
    bounty.assignee = recipient;
    bounty.assignedAt = new Date();

    // Mint
    const mintResult = await performMinting({
      bountyId: id,
      reward: bounty.reward,
      currency: bounty.currency || 'XMR',
      assignee: recipient,
      walletAddress: walletAddress || bounty.walletAddress,
      txHash
    });

    bounty.minted = true;
    bounty.status = 'completed';
    bounty.mintedAt = new Date();
    bounty.mintTxHash = mintResult.txHash;
    bounty.walletAddress = walletAddress || bounty.walletAddress;
    bounty.updatedAt = new Date();
    await bounty.save();

    console.log(`[BountyController] Bounty ${id} auto-assigned to ${recipient} and reward minted: ${mintResult.txHash}`);

    res.json({
      success: true,
      data: bounty,
      mint: mintResult,
      message: `Bounty assigned to ${recipient} and reward of ${bounty.reward} ${bounty.currency || 'XMR'} minted successfully`
    });
  } catch (error) {
    console.error('Error in assignAndMint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get reward status for a bounty
 */
const getRewardStatus = async (req, res) => {
  try {
    const bounty = await Bounty.findById(req.params.id).lean();
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }

    res.json({
      success: true,
      data: {
        bountyId: bounty._id,
        status: bounty.status,
        minted: bounty.minted || false,
        assignee: bounty.assignee || null,
        reward: bounty.reward,
        currency: bounty.currency || 'XMR',
        mintTxHash: bounty.mintTxHash || null,
        mintedAt: bounty.mintedAt || null,
        assignedAt: bounty.assignedAt || null
      }
    });
  } catch (error) {
    console.error('Error fetching reward status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update bounty status
 */
const updateBounty = async (req, res) => {
  try {
    const bounty = await Bounty.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }
    res.json({ success: true, data: bounty });
  } catch (error) {
    console.error('Error updating bounty:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a bounty
 */
const deleteBounty = async (req, res) => {
  try {
    const bounty = await Bounty.findByIdAndDelete(req.params.id);
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }
    res.json({ success: true, message: 'Bounty deleted successfully' });
  } catch (error) {
    console.error('Error deleting bounty:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Internal helper: perform the actual minting logic
 * In production this would interact with the Monero/blockchain backend
 */
async function performMinting({ bountyId, reward, currency, assignee, walletAddress, txHash }) {
  // If a txHash is provided externally, use it (manual/external mint confirmation)
  if (txHash) {
    return {
      txHash,
      bountyId,
      reward,
      currency,
      assignee,
      walletAddress,
      mintedAt: new Date().toISOString(),
      source: 'external'
    };
  }

  // Auto-generate a deterministic placeholder tx hash for tracking
  // In production, this would call the Monero RPC or smart contract
  const crypto = require('crypto');
  const autoTxHash = crypto
    .createHash('sha256')
    .update(`${bountyId}-${assignee}-${reward}-${Date.now()}`)
    .digest('hex');

  console.log(`[BountyController] Auto-minting ${reward} ${currency} to ${assignee} (bounty: ${bountyId})`);

  return {
    txHash: autoTxHash,
    bountyId,
    reward,
    currency,
    assignee,
    walletAddress: walletAddress || null,
    mintedAt: new Date().toISOString(),
    source: 'auto'
  };
}

module.exports = {
  getBounties,
  getBountyById,
  createBounty,
  assignBounty,
  mintReward,
  assignAndMint,
  getRewardStatus,
  updateBounty,
  deleteBounty
};
    