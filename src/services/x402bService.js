/**
 * Boson Protocol x402B Escrow Service
 * 
 * Integrates with Boson Protocol Diamond Escrow for autonomous robot payments.
 * 
 * Boson x402B provides:
 * - Trustless escrow for robot jobs
 * - Automatic release on job completion
 * - Dispute resolution mechanism
 * - 2% fee to MyZubster on REDEEMED
 */

const axios = require('axios');

const BOSON_API_BASE = process.env.BOSON_API_BASE || 'https://api.bosonprotocol.io/v1';
const BOSON_DIAMOND_ADDRESS = process.env.BOSON_DIAMOND_ADDRESS || '0x83C6F1F526E9D3b642F7B3a48E4f41F2e48Bb6Cb';
const BOSON_API_KEY = process.env.BOSON_API_KEY || '';

class X402BService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: BOSON_API_BASE,
      headers: {
        'Authorization': `Bearer ${BOSON_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.feePercent = 2; // MyZ fee percentage
  }

  /**
   * Create a Boson offer (listing) for a robot job
   */
  async createOffer({ sellerAddress, amountUSD, token, chain, jobId, description }) {
    try {
      const response = await this.apiClient.post('/offers', {
        seller: sellerAddress,
        price: {
          amount: this._usdToUnits(amountUSD),
          token: token || 'USDC',
          chainId: chain === 'base-mainnet' ? 8453 : 84532
        },
        metadata: {
          jobId: jobId,
          description: description,
          platform: 'myzubster',
          feePercent: this.feePercent
        },
        voucherValidDays: 30,
        redemptionPeriodDays: 7,
        disputePeriodDays: 14
      });

      return {
        success: true,
        offerId: response.data.offerId,
        sellerAddress: sellerAddress,
        amountUSD: amountUSD,
        chain: chain
      };
    } catch (error) {
      console.error('x402B createOffer error:', error.message);
      
      // Fallback: generate local offer ID for demo
      if (process.env.NODE_ENV !== 'production') {
        return this._fallbackCreateOffer(sellerAddress, amountUSD, jobId);
      }
      
      throw error;
    }
  }

  /**
   * Commit to an offer (buyer locks funds in escrow)
   */
  async commitToOffer(offerId, buyerAddress, amountUSD) {
    try {
      const response = await this.apiClient.post('/exchanges', {
        offerId: offerId,
        buyer: buyerAddress,
        quantity: 1
      });

      return {
        success: true,
        exchangeId: response.data.exchangeId,
        offerId: offerId,
        buyerAddress: buyerAddress,
        amountUSD: amountUSD,
        state: 'committed',
        commitTxHash: response.data.commitTxHash
      };
    } catch (error) {
      console.error('x402B commitToOffer error:', error.message);
      
      if (process.env.NODE_ENV !== 'production') {
        return this._fallbackCommit(offerId, buyerAddress, amountUSD);
      }
      
      throw error;
    }
  }

  /**
   * Redeem the escrow (robot completes job, releases funds)
   * This triggers the 2% fee collection for MyZubster
   */
  async redeemEscrow(exchangeId, sellerAddress, deliveryProof) {
    try {
      const response = await this.apiClient.post(`/exchanges/${exchangeId}/redeem`, {
        seller: sellerAddress,
        deliveryProof: deliveryProof,
        metadata: {
          platform: 'myzubster',
          timestamp: new Date().toISOString()
        }
      });

      const amountUSD = response.data.amount || 0;
      const feeAmount = amountUSD * (this.feePercent / 100);
      const robotPayout = amountUSD - feeAmount;

      return {
        success: true,
        exchangeId: exchangeId,
        state: 'redeemed',
        redeemTxHash: response.data.redeemTxHash,
        amountUSD: amountUSD,
        feePercent: this.feePercent,
        feeAmountUSD: feeAmount,
        robotPayoutUSD: robotPayout,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('x402B redeemEscrow error:', error.message);
      
      if (process.env.NODE_ENV !== 'production') {
        return this._fallbackRedeem(exchangeId, amountUSD || 20);
      }
      
      throw error;
    }
  }

  /**
   * Refund escrow (dispute resolved or cancelled)
   */
  async refundEscrow(exchangeId, sellerAddress, reason) {
    try {
      const response = await this.apiClient.post(`/exchanges/${exchangeId}/refund`, {
        seller: sellerAddress,
        reason: reason
      });

      return {
        success: true,
        exchangeId: exchangeId,
        state: 'refunded',
        refundTxHash: response.data.refundTxHash
      };
    } catch (error) {
      console.error('x402B refundEscrow error:', error.message);
      
      if (process.env.NODE_ENV !== 'production') {
        return this._fallbackRefund(exchangeId);
      }
      
      throw error;
    }
  }

  /**
   * Get escrow status
   */
  async getEscrowStatus(exchangeId) {
    try {
      const response = await this.apiClient.get(`/exchanges/${exchangeId}`);
      return {
        success: true,
        exchangeId: exchangeId,
        state: response.data.state,
        amountUSD: response.data.amount,
        buyer: response.data.buyer,
        seller: response.data.seller,
        offerId: response.data.offerId
      };
    } catch (error) {
      console.error('x402B getEscrowStatus error:', error.message);
      throw error;
    }
  }

  // --- Fallback methods for demo/testing ---

  _fallbackCreateOffer(sellerAddress, amountUSD, jobId) {
    const crypto = require('crypto');
    const offerId = 'boson-fallback-' + crypto.createHash('sha256').update(jobId + Date.now()).digest('hex').substring(0, 16);

    return {
      success: true,
      offerId: offerId,
      sellerAddress: sellerAddress,
      amountUSD: amountUSD,
      chain: 'base-mainnet',
      fallback: true
    };
  }

  _fallbackCommit(offerId, buyerAddress, amountUSD) {
    const crypto = require('crypto');
    const exchangeId = 'ex-' + crypto.createHash('sha256').update(offerId + Date.now()).digest('hex').substring(0, 12);

    return {
      success: true,
      exchangeId: exchangeId,
      offerId: offerId,
      buyerAddress: buyerAddress,
      amountUSD: amountUSD,
      state: 'committed',
      commitTxHash: '0x' + crypto.randomBytes(32).toString('hex'),
      fallback: true
    };
  }

  _fallbackRedeem(exchangeId, amountUSD) {
    const crypto = require('crypto');
    const feeAmount = amountUSD * (this.feePercent / 100);

    return {
      success: true,
      exchangeId: exchangeId,
      state: 'redeemed',
      redeemTxHash: '0x' + crypto.randomBytes(32).toString('hex'),
      amountUSD: amountUSD,
      feePercent: this.feePercent,
      feeAmountUSD: feeAmount,
      robotPayoutUSD: amountUSD - feeAmount,
      completedAt: new Date().toISOString(),
      fallback: true
    };
  }

  _fallbackRefund(exchangeId) {
    const crypto = require('crypto');

    return {
      success: true,
      exchangeId: exchangeId,
      state: 'refunded',
      refundTxHash: '0x' + crypto.randomBytes(32).toString('hex'),
      fallback: true
    };
  }

  _usdToUnits(amountUSD) {
    // USDC has 6 decimals
    return Math.round(amountUSD * 1000000).toString();
  }
}

module.exports = new X402BService();
