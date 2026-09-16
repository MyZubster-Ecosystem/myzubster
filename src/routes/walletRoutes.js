const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const WalletLink = require('../models/WalletLink');
const WalletChallenge = require('../models/WalletChallenge');

const {
  normalizeAddress,
  createNonce,
  buildLinkMessage,
  recoverAddress
} = require('../services/walletSignatureService');
const {
  consumeLinkWalletChallenge
} = require('../services/walletChallengeConsumptionService');

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

router.post('/challenge', authenticate, async (req, res) => {
  try {
    const walletAddress = normalizeAddress(req.body?.walletAddress);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS);
    const nonce = createNonce();

    const message = buildLinkMessage({
      userId: req.userId,
      walletAddress,
      nonce,
      issuedAt: now,
      expiresAt
    });

    const challenge = await WalletChallenge.create({
      userId: req.userId,
      walletAddress,
      nonce,
      action: 'LINK_WALLET',
      message,
      expiresAt
    });

    return res.status(201).json({
      success: true,
      challengeId: challenge._id,
      walletAddress,
      message,
      expiresAt
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'WALLET_CHALLENGE_FAILED',
      message: 'Unable to create wallet challenge'
    });
  }
});

router.post('/verify', authenticate, async (req, res) => {
  try {
    const challenge = await WalletChallenge.findOne({
      _id: req.body?.challengeId,
      userId: req.userId
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        code: 'WALLET_CHALLENGE_NOT_FOUND'
      });
    }

    if (challenge.usedAt) {
      return res.status(409).json({
        success: false,
        code: 'WALLET_CHALLENGE_ALREADY_USED'
      });
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      return res.status(410).json({
        success: false,
        code: 'WALLET_CHALLENGE_EXPIRED'
      });
    }

    const recovered = recoverAddress(
      challenge.message,
      req.body?.signature
    );

    if (recovered !== challenge.walletAddress) {
      return res.status(401).json({
        success: false,
        code: 'WALLET_SIGNATURE_MISMATCH'
      });
    }

    const now = new Date();

    const existingOwner = await WalletLink.findOne({
      walletAddress: recovered,
      userId: { $ne: req.userId }
    });

    if (existingOwner) {
      return res.status(409).json({
        success: false,
        code: 'WALLET_ALREADY_LINKED'
      });
    }

    const consumedChallenge = await consumeLinkWalletChallenge({
      WalletChallenge,
      challengeId: challenge._id,
      userId: req.userId,
      now
    });

    if (!consumedChallenge) {
      return res.status(409).json({
        success: false,
        code: 'WALLET_CHALLENGE_NOT_CONSUMABLE'
      });
    }

    const wallet = await WalletLink.findOneAndUpdate(
      {
        userId: req.userId,
        walletAddress: recovered
      },
      {
        $set: {
          status: 'VERIFIED',
          lastVerifiedAt: now,
          disconnectedAt: null
        },
        $setOnInsert: {
          verifiedAt: now,
          networkFamily: 'EVM'
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return res.json({
      success: true,
      state: 'WALLET_VERIFIED',
      wallet: {
        address: wallet.walletAddress,
        networkFamily: wallet.networkFamily,
        verifiedAt: wallet.verifiedAt,
        lastVerifiedAt: wallet.lastVerifiedAt
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'WALLET_VERIFICATION_FAILED',
      message: 'Unable to verify wallet signature'
    });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const wallets = await WalletLink.find({
    userId: req.userId,
    status: 'VERIFIED'
  })
    .select('-__v')
    .lean();

  return res.json({
    success: true,
    state: wallets.length ? 'WALLET_VERIFIED' : 'WALLET_NOT_CONNECTED',
    wallets
  });
});

router.delete('/disconnect', authenticate, async (req, res) => {
  try {
    const walletAddress = normalizeAddress(req.body?.walletAddress);

    const wallet = await WalletLink.findOneAndUpdate(
      {
        userId: req.userId,
        walletAddress,
        status: 'VERIFIED'
      },
      {
        $set: {
          status: 'DISCONNECTED',
          disconnectedAt: new Date()
        }
      },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        code: 'WALLET_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      state: 'WALLET_DISCONNECTED'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'WALLET_DISCONNECT_FAILED'
    });
  }
});

module.exports = router;
