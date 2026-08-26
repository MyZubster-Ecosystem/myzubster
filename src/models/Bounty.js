'use strict';

/**
 * Bounty model - MyZubster ecosystem.
 *
 * Implements the multi-asset bounty model documented in issue #477 section 3.
 *
 * Supported assets (ref #410):
 *   - MYZ
 *   - XMR
 *   - TOKEN
 *   - combinations of the above
 *
 * Rules enforced here (issue #477, section 3):
 *   - no silent asset conversion;
 *   - contributor wallet is captured for the SELECTED asset at settlement;
 *   - XMR may be selected before the XMR rail is live, but the bounty MUST
 *     remain in `XMR_PENDING` until the rail is independently verified;
 *   - TOKEN rewards are non-payable until their chain/asset rail is enabled
 *     and verified (status `TOKEN_PENDING`);
 *   - no `PAID` without an independent verification reference.
 *
 * Civic/institutional references are PROPOSED only (issue #477 section 5/6)
 * and MUST NOT be interpreted as evidence of funds already held
 * (issue #477 section 4).
 */

const ASSET_TYPES = ['MYZ', 'XMR', 'TOKEN'];

const STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_REVIEW: 'IN_REVIEW',
  VERIFIED: 'VERIFIED',
  // Asset-rail pending states. Settlement cannot complete until the rail
  // is independently verified live (issue #453, #477 section 3).
  XMR_PENDING: 'XMR_PENDING',
  TOKEN_PENDING: 'TOKEN_PENDING',
  // Final settled state. Requires an independent verification reference.
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
};

// Asset rails. MYZ is the native rail and is live by default; XMR and TOKEN
// rails are OFF until independently verified (issue #451, #453).
// This is the only legitimate gate to flip; never bypass it from a controller.
const RAIL_STATUS = {
  MYZ: true,
  XMR: false,
  TOKEN: false,
};

class Bounty {
  constructor(data) {
    data = data || {};
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.amount = Number.isFinite(data.amount) ? Number(data.amount) : 0;
    this.assets = normalizeAssets(data.assets || data.asset);
    // Contributor wallet captured for the selected asset at settlement.
    this.wallet = data.wallet || null;
    this.walletNetwork = data.walletNetwork || null;
    this.status = data.status || STATUS.DRAFT;
    // Required for PAID - independent verification reference (#453).
    this.verificationRef = data.verificationRef || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || this.createdAt;
    this.metadata = data.metadata || {};
  }

  /**
   * Validate the bounty against issue #477 section 3 and section 4.
   * Throws on the first violation. Returns true when valid.
   */
  validate() {
    if (!Array.isArray(this.assets) || this.assets.length === 0) {
      throw new Error('Bounty requires at least one asset type');
    }
    for (let i = 0; i < this.assets.length; i++) {
      if (!ASSET_TYPES.includes(this.assets[i])) {
        throw new Error('Unsupported asset type: ' + this.assets[i]);
      }
    }
    if (!(this.amount > 0)) {
      throw new Error('Bounty amount must be greater than zero');
    }
    if (this.status === STATUS.PAID && !this.verificationRef) {
      throw new Error('PAID status requires independent verification reference (#453)');
    }
    if (this.status === STATUS.PAID && (!this.wallet || !this.walletNetwork)) {
      throw new Error('PAID status requires contributor wallet and network captured at settlement');
    }
    return true;
  }

  /**
   * Settle the bounty for a specific declared asset.
   *
   * Enforces:
   *   - no silent asset conversion (selected asset MUST already be declared);
   *   - wallet capture for the selected asset at settlement;
   *   - XMR before rail live -> XMR_PENDING;
   *   - TOKEN before rail enabled -> TOKEN_PENDING;
   *   - no PAID without independent verification reference.
   */
  settle(options) {
    options = options || {};
    var asset = options.asset;
    var wallet = options.wallet;
    var walletNetwork = options.walletNetwork;
    var verificationRef = options.verificationRef;

    if (!ASSET_TYPES.includes(asset)) {
      throw new Error('Unsupported asset type: ' + asset);
    }
    if (!this.assets.includes(asset)) {
      throw new Error('Asset ' + asset + ' is not declared on this bounty - no silent asset conversion (#477 section 3)');
    }
    if (!wallet || !walletNetwork) {
      throw new Error('Contributor wallet and network must be captured for the selected asset at settlement');
    }

    // Pending rails: capture wallet, transition to PENDING, do not pay.
    if (asset === 'XMR' && !RAIL_STATUS.XMR) {
      this.wallet = wallet;
      this.walletNetwork = walletNetwork;
      this.status = STATUS.XMR_PENDING;
      this.updatedAt = new Date().toISOString();
      return this;
    }
    if (asset === 'TOKEN' && !RAIL_STATUS.TOKEN) {
      this.wallet = wallet;
      this.walletNetwork = walletNetwork;
      this.status = STATUS.TOKEN_PENDING;
      this.updatedAt = new Date().toISOString();
      return this;
    }

    if (!verificationRef) {
      throw new Error('No PAID without independent verification (#453, #477 section 3)');
    }

    this.wallet = wallet;
    this.walletNetwork = walletNetwork;
    this.verificationRef = verificationRef;
    this.status = STATUS.PAID;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Mark an asset rail as independently verified live. This is the only
   * legitimate way to flip RAIL_STATUS - never bypass it from a payment
   * flow (issue #451, #452, #453).
   */
  static enableRail(asset, verified) {
    if (!ASSET_TYPES.includes(asset)) {
      throw new Error('Unsupported asset type: ' + asset);
    }
    RAIL_STATUS[asset] = Boolean(verified);
    return RAIL_STATUS[asset];
  }

  static isRailLive(asset) {
    return Boolean(RAIL_STATUS[asset]);
  }

  static get ASSET_TYPES() { return ASSET_TYPES; }
  static get STATUS() { return STATUS; }
  static get RAIL_STATUS() { return RAIL_STATUS; }
}

function normalizeAssets(input) {
  if (Array.isArray(input)) {
    return Array.from(new Set(input));
  }
  if (typeof input === 'string' && input.length) {
    return [input];
  }
  return [];
}

module.exports = Bounty;
module.exports.ASSET_TYPES = ASSET_TYPES;
module.exports.STATUS = STATUS;
module.exports.RAIL_STATUS = RAIL_STATUS;
module.exports.normalizeAssets = normalizeAssets;
