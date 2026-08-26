'use strict';

/**
 * Payment lifecycle service - MyZubster ecosystem.
 *
 * Coordinates bounty settlement per issue #477 section 4:
 *   - #451: blocks payment flow shortcuts until verifier/security
 *           boundaries are closed;
 *   - #452: treasury reservation, concurrency protection,
 *           reconciliation, audit trail;
 *   - #453: independent verification of recipient, network,
 *           asset/contract, canonical amount, transaction status.
 *
 * The lifecycle MUST NOT bypass the verifier. PAID is unreachable until
 * an independent verification reference is captured.
 */

const Bounty = require('../models/Bounty');
const paymentVerifier = require('./paymentVerifier');

const AUDIT_LOG = [];

class PaymentLifecycle {
  constructor(options) {
    options = options || {};
    this.treasury = options.treasury || new InMemoryTreasury();
    this.verifier = options.verifier || paymentVerifier;
  }

  /**
   * Reserve treasury funds for a bounty.
   * - Concurrency-safe reservation (per-bounty locking).
   * - Recorded in the audit trail.
   * - Bounty definitions are NOT evidence of funds already held
   *   (issue #477 section 4).
   */
  async reserve(bounty) {
    if (!(bounty instanceof Bounty)) {
      throw new Error('reserve() requires a Bounty instance');
    }
    bounty.validate();
    const reservation = await this.treasury.reserve(bounty);
    AUDIT_LOG.push({
      ts: new Date().toISOString(),
      action: 'reserve',
      bountyId: bounty.id,
      assets: bounty.assets,
      amount: bounty.amount,
      reservationId: reservation && reservation.id,
    });
    return reservation;
  }

  /**
   * Attempt settlement for a declared asset.
   *
   * Flow:
   *   1. Confirm a treasury reservation exists (no shortcut - #451).
   *   2. Capture contributor wallet for the selected asset.
   *   3. Invoke the independent verifier (#453).
   *   4. Transition the bounty: XMR_PENDING / TOKEN_PENDING / PAID.
   *
   * Never silently converts assets.
   */
  async settle(bounty, options) {
    options = options || {};
    const asset = options.asset;
    const wallet = options.wallet;
    const walletNetwork = options.walletNetwork;
    const transactionHash = options.transactionHash;

    if (!(bounty instanceof Bounty)) {
      throw new Error('settle() requires a Bounty instance');
    }
    if (!asset || !wallet || !walletNetwork) {
      throw new Error('settle() requires { asset, wallet, walletNetwork }');
    }
    if (!bounty.assets.includes(asset)) {
      throw new Error('Asset ' + asset + ' not declared on bounty - no silent asset conversion');
    }

    const reservation = await this.treasury.getReservation(bounty.id);
    if (!reservation) {
      throw new Error('No treasury reservation - payment flow shortcut blocked (#451)');
    }

    // Pending rails: capture wallet, transition to PENDING, do not pay.
    if (!Bounty.isRailLive(asset)) {
      bounty.settle({ asset: asset, wallet: wallet, walletNetwork: walletNetwork });
      AUDIT_LOG.push({
        ts: new Date().toISOString(),
        action: 'pending',
        bountyId: bounty.id,
        asset: asset,
        status: bounty.status,
      });
      return bounty;
    }

    // Rail live - require independent verification before PAID (#453).
    const verification = await this.verifier.verify({
      bountyId: bounty.id,
      asset: asset,
      amount: bounty.amount,
      wallet: wallet,
      walletNetwork: walletNetwork,
      transactionHash: transactionHash,
    });

    if (!verification || !verification.passed) {
      throw new Error('Independent verification failed - PAID blocked (#453)');
    }

    bounty.settle({
      asset: asset,
      wallet: wallet,
      walletNetwork: walletNetwork,
      verificationRef: verification.reference,
    });

    AUDIT_LOG.push({
      ts: new Date().toISOString(),
      action: 'paid',
      bountyId: bounty.id,
      asset: asset,
      verificationRef: verification.reference,
    });

    return bounty;
  }

  static getAuditLog() {
    return AUDIT_LOG.slice();
  }
}

/**
 * Minimal in-memory treasury stub.
 * The authoritative multi-asset Treasury source-of-truth lives behind #452;
 * this stub only enforces reservation presence and per-bounty concurrency
 * so the lifecycle is testable in isolation.
 */
class InMemoryTreasury {
  constructor() {
    this._reservations = new Map();
    this._locks = new Map();
    this._nextId = 1;
  }

  async reserve(bounty) {
    if (this._locks.has(bounty.id)) {
      throw new Error('Treasury reservation in progress - concurrency guard');
    }
    this._locks.set(bounty.id, true);
    try {
      if (this._reservations.has(bounty.id)) {
        return this._reservations.get(bounty.id);
      }
      const reservation = {
        id: 'R-' + String(this._nextId++).padStart(5, '0'),
        bountyId: bounty.id,
        assets: bounty.assets.slice(),
        amount: bounty.amount,
        createdAt: new Date().toISOString(),
      };
      this._reservations.set(bounty.id, reservation);
      return reservation;
    } finally {
      this._locks.delete(bounty.id);
    }
  }

  async getReservation(bountyId) {
    return this._reservations.get(bountyId) || null;
  }
}

module.exports = PaymentLifecycle;
module.exports.AUDIT_LOG = AUDIT_LOG;
module.exports.InMemoryTreasury = InMemoryTreasury;
