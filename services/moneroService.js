// services/moneroService.js
// MyZubsterGateway Monero Service with FCMP++ Support

const axios = require('axios');
const FCMPTransactionService = require('./fcmpTransactionService');
const { isEnabled, getConfig, getStatus } = require('./fcmpConfig');

class MoneroService {
  constructor() {
    this.rpcUrl = process.env.MONERO_RPC_URL || 'http://localhost:18081/json_rpc';
    this.daemonAddress = process.env.MONERO_DAEMON_ADDRESS || 'node.moneroworld.com:18081';
    this.network = process.env.MONERO_NETWORK || 'mainnet';
    
    // Initialize FCMP++ service
    this.fcmpService = new FCMPTransactionService();
    
    console.log(`🔐 MoneroService started on ${this.network}`);
    console.log(`📡 Daemon: ${this.daemonAddress}`);
    console.log(`🔮 FCMP++: ${isEnabled() ? 'ENABLED' : 'DISABLED (RingCT only)'}`);
  }

  /**
   * Generate a subaddress for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<string>} Subaddress
   */
  async generateSubaddress(orderId) {
    try {
      const response = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        id: '0',
        method: 'create_address',
        params: {
          account_index: 0,
          label: `Order-${orderId}`
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      const subaddress = response.data.result.address;
      console.log(`✅ Subaddress generated for order ${orderId}: ${subaddress}`);
      return subaddress;
    } catch (error) {
      console.error('❌ Error generating subaddress:', error.message);
      throw error;
    }
  }

  /**
   * Create a transaction (FCMP++ or RingCT based on config)
   * @param {Object} params - Transaction parameters
   * @returns {Promise<Object>} Transaction result
   */
  async createTransaction(params) {
    // Delegate to FCMP++ service
    return this.fcmpService.createTransaction(params);
  }

  /**
   * Verify a transaction (FCMP++ or RingCT)
   * @param {Object} params - Verification parameters
   * @returns {Promise<Object>} Verification result
   */
  async verifyTransaction(params) {
    return this.fcmpService.verifyTransaction(params);
  }

  /**
   * Handle FCMP++ edge cases
   * @param {string} edgeCase - Edge case type
   * @param {Object} params - Parameters
   * @returns {Promise<Object>} Resolution
   */
  async handleFCMPPEdgeCase(edgeCase, params) {
    return this.fcmpService.handleEdgeCase(edgeCase, params);
  }

  /**
   * Check payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async checkPayment(transactionId) {
    try {
      // In production, query the Monero RPC for payment status
      // For now, return simulated status
      return {
        transactionId,
        status: 'confirmed',
        confirmations: 10,
        amount: 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error checking payment:', error.message);
      throw error;
    }
  }

  /**
   * Get FCMP++ status
   * @returns {Object} FCMP++ status
   */
  getFCMPPStatus() {
    return getStatus();
  }

  /**
   * Get FCMP++ configuration
   * @returns {Object} FCMP++ config
   */
  getFCMPPConfig() {
    return getConfig();
  }

  /**
   * Make RPC call to Monero daemon
   * @private
   */
  async _rpcCall(method, params = {}) {
    const response = await axios.post(this.rpcUrl, {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    });
    
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    
    return response.data.result;
  }
}

module.exports = MoneroService;