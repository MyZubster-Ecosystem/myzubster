'use strict';

const SUPPORTED_ASSETS = Object.freeze(['BTC', 'XMR', 'ETH']);

function cleanAddress(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateWalletAddress(asset, address) {
  const value = cleanAddress(address);
  if (!value) return true;
  if (asset === 'BTC') {
    return /^(?:bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,61})$/.test(value);
  }
  if (asset === 'XMR') {
    return /^[48][1-9A-HJ-NP-Za-km-z]{94}$/.test(value);
  }
  if (asset === 'ETH') {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  }
  return false;
}

function normalizeContributorWallets(input) {
  const value = input && typeof input === 'object' ? input : {};
  const wallets = {};
  for (const asset of SUPPORTED_ASSETS) {
    const raw = value[asset] && typeof value[asset] === 'object' ? value[asset] : {};
    const address = cleanAddress(raw.address);
    if (!address) {
      wallets[asset] = { address: '', status: 'unverified', verifiedAt: null, testTxHash: '' };
      continue;
    }
    if (!validateWalletAddress(asset, address)) {
      const error = new Error(`Indirizzo ${asset} non valido`);
      error.code = 'INVALID_CONTRIBUTOR_WALLET';
      throw error;
    }
    wallets[asset] = {
      address,
      status: 'unverified',
      verifiedAt: null,
      testTxHash: ''
    };
  }
  return wallets;
}

module.exports = { SUPPORTED_ASSETS, validateWalletAddress, normalizeContributorWallets };
