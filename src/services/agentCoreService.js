/**
 * AWS AgentCore Payments Service
 * 
 * Integrates with AWS Bedrock AgentCore Payments for wallet creation
 * and USDC management on Base network.
 * 
 * AgentCore provides:
 * - Automatic wallet creation (no private key management)
 * - USDC on Base chain
 * - Payment routing and governance
 * - Audit trail via CloudWatch
 */

const axios = require('axios');

const AGENTCORE_API_BASE = process.env.AGENTCORE_API_BASE || 'https://agentcore.payments.aws.dev/v1';
const AGENTCORE_API_KEY = process.env.AGENTCORE_API_KEY || '';
const AGENTCORE_AGENT_ID = process.env.AGENTCORE_AGENT_ID || '';
const BASE_CHAIN_ID = 8453; // Base mainnet
const BASE_SEPOLIA_CHAIN_ID = 84532;

class AgentCoreService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: AGENTCORE_API_BASE,
      headers: {
        'Authorization': `Bearer ${AGENTCORE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Agent-Id': AGENTCORE_AGENT_ID
      },
      timeout: 30000
    });
  }

  /**
   * Create a new wallet for a robot via AgentCore
   * Returns wallet address without exposing private keys
   */
  async createWallet(robotId, robotName, chain = 'base-mainnet') {
    try {
      const response = await this.apiClient.post('/wallets', {
        agent_id: AGENTCORE_AGENT_ID,
        robot_id: robotId,
        robot_name: robotName,
        chain_id: chain === 'base-mainnet' ? BASE_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID,
        token: 'USDC',
        governance: {
          daily_cap_usd: 50,
          per_transaction_cap_usd: 20
        }
      });

      return {
        success: true,
        walletId: response.data.wallet_id,
        address: response.data.address,
        publicKey: response.data.public_key,
        chain: chain,
        token: 'USDC'
      };
    } catch (error) {
      console.error('AgentCore createWallet error:', error.message);
      
      // Fallback: generate deterministic wallet for demo/testing
      if (process.env.NODE_ENV !== 'production') {
        return this._fallbackCreateWallet(robotId, chain);
      }
      
      throw error;
    }
  }

  /**
   * Check spending governance (daily cap, per-tx cap)
   */
  async checkSpendingGovernance(walletId, amountUSD) {
    try {
      const response = await this.apiClient.get(`/wallets/${walletId}/governance`);
      const governance = response.data;

      // Check daily cap
      if (governance.daily_spent_usd + amountUSD > governance.daily_cap_usd) {
        return {
          allowed: false,
          reason: `Daily cap exceeded: $${governance.daily_spent_usd}/$${governance.daily_cap_usd} spent`
        };
      }

      // Check per-transaction cap
      if (amountUSD > governance.per_transaction_cap_usd) {
        return {
          allowed: false,
          reason: `Per-transaction cap exceeded: $${amountUSD} > $${governance.per_transaction_cap_usd}`
        };
      }

      return { allowed: true, governance };
    } catch (error) {
      console.error('AgentCore checkSpendingGovernance error:', error.message);
      
      // Fallback: use local governance check
      return this._fallbackGovernanceCheck(amountUSD);
    }
  }

  /**
   * Execute payment from robot wallet
   */
  async executePayment(walletId, toAddress, amountUSD, currency = 'USDC') {
    try {
      const response = await this.apiClient.post(`/wallets/${walletId}/payments`, {
        to_address: toAddress,
        amount: amountUSD,
        currency: currency,
        chain_id: BASE_CHAIN_ID,
        memo: `MyZubster payment ${amountUSD} ${currency}`
      });

      return {
        success: true,
        txHash: response.data.tx_hash,
        amount: amountUSD,
        currency: currency,
        toAddress: toAddress,
        status: response.data.status
      };
    } catch (error) {
      console.error('AgentCore executePayment error:', error.message);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletId) {
    try {
      const response = await this.apiClient.get(`/wallets/${walletId}/balance`);
      return {
        success: true,
        balance: response.data.balance,
        currency: response.data.currency,
        chain: response.data.chain
      };
    } catch (error) {
      console.error('AgentCore getBalance error:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction history (audit trail)
   */
  async getAuditTrail(walletId, limit = 50) {
    try {
      const response = await this.apiClient.get(`/wallets/${walletId}/transactions`, {
        params: { limit }
      });
      return {
        success: true,
        transactions: response.data.transactions
      };
    } catch (error) {
      console.error('AgentCore getAuditTrail error:', error.message);
      throw error;
    }
  }

  /**
   * Update spending governance (admin only)
   */
  async updateGovernance(walletId, dailyCapUSD, perTransactionCapUSD) {
    try {
      const response = await this.apiClient.patch(`/wallets/${walletId}/governance`, {
        daily_cap_usd: dailyCapUSD,
        per_transaction_cap_usd: perTransactionCapUSD
      });
      return { success: true, governance: response.data };
    } catch (error) {
      console.error('AgentCore updateGovernance error:', error.message);
      throw error;
    }
  }

  // --- Fallback methods for demo/testing ---

  _fallbackCreateWallet(robotId, chain) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(robotId).digest('hex');
    const address = '0x' + hash.substring(0, 40);
    const publicKey = '0x' + hash.substring(0, 64);

    return {
      success: true,
      walletId: `agentcore-fallback-${robotId}`,
      address: address,
      publicKey: publicKey,
      chain: chain,
      token: 'USDC',
      fallback: true
    };
  }

  _fallbackGovernanceCheck(amountUSD) {
    return {
      allowed: amountUSD <= 20,
      governance: {
        daily_cap_usd: 50,
        per_transaction_cap_usd: 20,
        daily_spent_usd: 0
      },
      fallback: true
    };
  }
}

module.exports = new AgentCoreService();
