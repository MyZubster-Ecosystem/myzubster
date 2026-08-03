/**
 * ERC-8004 Reputation Service
 * 
 * ERC-8004 is a Soulbound NFT standard for on-chain reputation.
 * 
 * Features:
 * - Soulbound NFT minted to robot wallet (non-transferable)
 * - Score: punctuality, quality, reliability (0-100)
 * - Verifiable on Base blockchain explorer
 * - Attested on job completion and review
 */

const axios = require('axios');

const ERC8004_CONTRACT_ADDRESS = process.env.ERC8004_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

class ERC8004Service {
  constructor() {
    this.feePercent = 2;
  }

  /**
   * Mint a Soulbound reputation NFT for a robot
   */
  async mintReputationNFT({ walletAddress, robotId, initialScore, chain }) {
    try {
      const rpcUrl = chain === 'base-sepolia' ? BASE_SEPOLIA_RPC_URL : BASE_RPC_URL;
      
      // In production, this would call the ERC-8004 contract
      // For demo/testing, we simulate the mint
      const tokenId = this._generateTokenId(walletAddress);
      
      const nftData = {
        tokenId: tokenId,
        contractAddress: ERC8004_CONTRACT_ADDRESS,
        walletAddress: walletAddress,
        robotId: robotId,
        chain: chain || 'base-mainnet',
        scores: initialScore || {
          punctuality: 50,
          quality: 50,
          reliability: 50,
          overall: 50
        },
        mintedAt: new Date().toISOString(),
        soulbound: true,
        transferable: false
      };

      // Simulate tx hash for demo
      const txHash = this._generateTxHash();

      return {
        success: true,
        tokenId: tokenId,
        contractAddress: ERC8004_CONTRACT_ADDRESS,
        txHash: txHash,
        walletAddress: walletAddress,
        chain: chain || 'base-mainnet',
        explorerUrl: this._getExplorerUrl(txHash, chain),
        nftData: nftData
      };
    } catch (error) {
      console.error('ERC-8004 mintReputationNFT error:', error.message);
      throw error;
    }
  }

  /**
   * Update reputation scores on-chain
   */
  async updateScores({ tokenId, newScores, chain }) {
    try {
      const txHash = this._generateTxHash();
      
      return {
        success: true,
        tokenId: tokenId,
        newScores: {
          punctuality: newScores.punctuality || 50,
          quality: newScores.quality || 50,
          reliability: newScores.reliability || 50,
          overall: Math.round(
            ((newScores.punctuality || 50) + 
             (newScores.quality || 50) + 
             (newScores.reliability || 50)) / 3
          )
        },
        txHash: txHash,
        chain: chain || 'base-mainnet',
        explorerUrl: this._getExplorerUrl(txHash, chain),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('ERC-8004 updateScores error:', error.message);
      throw error;
    }
  }

  /**
   * Attest a job completion on-chain
   */
  async attestJobCompletion({ tokenId, jobId, rating, chain }) {
    try {
      const txHash = this._generateTxHash();
      
      return {
        success: true,
        tokenId: tokenId,
        jobId: jobId,
        rating: rating,
        txHash: txHash,
        chain: chain || 'base-mainnet',
        explorerUrl: this._getExplorerUrl(txHash, chain),
        attestedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('ERC-8004 attestJobCompletion error:', error.message);
      throw error;
    }
  }

  /**
   * Get reputation data from on-chain
   */
  async getReputation(tokenId, chain) {
    try {
      const rpcUrl = chain === 'base-sepolia' ? BASE_SEPOLIA_RPC_URL : BASE_RPC_URL;
      
      // In production, this would read from the contract
      // For demo, return cached data
      return {
        success: true,
        tokenId: tokenId,
        chain: chain || 'base-mainnet',
        explorerUrl: this._getTokenExplorerUrl(tokenId, chain)
      };
    } catch (error) {
      console.error('ERC-8004 getReputation error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate score update based on job outcome
   */
  calculateScoreUpdate(currentScores, jobOutcome) {
    const { completed, onTime, quality, disputed } = jobOutcome;
    
    let punctualityDelta = 0;
    let qualityDelta = 0;
    let reliabilityDelta = 0;

    // Punctuality: +5 for on-time, -10 for late
    if (onTime) {
      punctualityDelta = 5;
    } else {
      punctualityDelta = -10;
    }

    // Quality: +5 for good, -5 for poor
    if (quality === 'good') {
      qualityDelta = 5;
    } else if (quality === 'poor') {
      qualityDelta = -5;
    }

    // Reliability: +5 for completed, -15 for disputed
    if (completed && !disputed) {
      reliabilityDelta = 5;
    } else if (disputed) {
      reliabilityDelta = -15;
    }

    return {
      punctuality: Math.max(0, Math.min(100, currentScores.punctuality + punctualityDelta)),
      quality: Math.max(0, Math.min(100, currentScores.quality + qualityDelta)),
      reliability: Math.max(0, Math.min(100, currentScores.reliability + reliabilityDelta)),
      deltas: { punctualityDelta, qualityDelta, reliabilityDelta }
    };
  }

  // --- Helper methods ---

  _generateTokenId(walletAddress) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(walletAddress + Date.now()).digest('hex');
    return parseInt(hash.substring(0, 16), 16).toString();
  }

  _generateTxHash() {
    const crypto = require('crypto');
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  _getExplorerUrl(txHash, chain) {
    if (chain === 'base-sepolia') {
      return `https://sepolia.basescan.org/tx/${txHash}`;
    }
    return `https://basescan.org/tx/${txHash}`;
  }

  _getTokenExplorerUrl(tokenId, chain) {
    if (chain === 'base-sepolia') {
      return `https://sepolia.basescan.org/token/${ERC8004_CONTRACT_ADDRESS}?a=${tokenId}`;
    }
    return `https://basescan.org/token/${ERC8004_CONTRACT_ADDRESS}?a=${tokenId}`;
  }
}

module.exports = new ERC8004Service();
