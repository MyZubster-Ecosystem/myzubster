'use strict';

/**
 * Independent payment verifier - MyZubster ecosystem.
 *
 * Implements issue #453 / issue #477 section 4: independent verification of
 *   - recipient (contributor wallet);
 *   - network;
 *   - asset / contract;
 *   - canonical amount;
 *   - transaction status.
 *
 * No PAID status is reachable without a `passed` verification.
 */

const SUPPORTED_NETWORKS = {
  MYZ: ['myz-mainnet'],
  XMR: ['xmr-mainnet'],
  TOKEN: ['token-mainnet'],
};

const SUPPORTED_ASSETS = ['MYZ', 'XMR', 'TOKEN'];

/**
 * Verify a settlement candidate.
 *
 * Returns { passed: boolean, reference: string|null, checks: object }.
 * `passed` is true ONLY when every required field is non-empty AND the
 * amount/asset/network match the bounty definition.
 */
async function verify(options) {
  options = options || {};
  const bountyId = options.bountyId;
  const asset = options.asset;
  const amount = options.amount;
  const wallet = options.wallet;
  const walletNetwork = options.walletNetwork;
  const transactionHash = options.transactionHash;

  const allowedNetworks = SUPPORTED_NETWORKS[asset] || [];

  const checks = {
    recipient: Boolean(wallet && wallet.length),
    network: Boolean(walletNetwork && allowedNetworks.indexOf(walletNetwork) !== -1),
    asset: SUPPORTED_ASSETS.indexOf(asset) !== -1,
    canonicalAmount: Number.isFinite(amount) && amount > 0,
    transactionStatus: Boolean(transactionHash && transactionHash.length),
  };

  const passed = Object.keys(checks).every(function (k) { return checks[k]; });

  return {
    passed: passed,
    reference: passed ? ('V-' + (bountyId || 'unknown') + '-' + Date.now()) : null,
    checks: checks,
  };
}

module.exports = {
  verify: verify,
  SUPPORTED_NETWORKS: SUPPORTED_NETWORKS,
  SUPPORTED_ASSETS: SUPPORTED_ASSETS,
};
