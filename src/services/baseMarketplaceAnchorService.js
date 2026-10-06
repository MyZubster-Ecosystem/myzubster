const { ethers } = require('ethers');

const BASE_SEPOLIA_CHAIN_ID = 84532;
const DEFAULT_RPC_URL = 'https://sepolia.base.org';
const DEFAULT_EXPLORER_URL = 'https://sepolia.basescan.org';

function getBaseAnchorConfig() {
  return {
    rpcUrl: process.env.MARKETPLACE_BASE_RPC_URL || DEFAULT_RPC_URL,
    privateKey: process.env.MARKETPLACE_BASE_ANCHOR_PRIVATE_KEY,
    confirmations: Number(process.env.MARKETPLACE_BASE_CONFIRMATIONS || 1),
    explorerUrl: process.env.MARKETPLACE_BASE_EXPLORER_URL || DEFAULT_EXPLORER_URL
  };
}

function encodeEvidenceHash(evidenceHash) {
  if (!/^[0-9a-f]{64}$/i.test(evidenceHash || '')) {
    throw new Error('Marketplace evidence hash must be a 32-byte SHA-256 hex string');
  }
  return `0x${evidenceHash.toLowerCase()}`;
}

async function anchorMarketplaceEvidenceOnBase(evidenceHash) {
  const config = getBaseAnchorConfig();
  if (!config.privateKey) return { status: 'NOT_CONFIGURED' };

  const provider = new ethers.JsonRpcProvider(config.rpcUrl, BASE_SEPOLIA_CHAIN_ID, { staticNetwork: true });
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error(`Unexpected Base chain id: ${network.chainId}`);
  }

  const wallet = new ethers.Wallet(config.privateKey, provider);
  const transaction = await wallet.sendTransaction({
    to: wallet.address,
    value: 0n,
    data: encodeEvidenceHash(evidenceHash)
  });

  const submittedAt = new Date();
  const receipt = await transaction.wait(config.confirmations);
  if (!receipt || receipt.status !== 1) {
    throw new Error('Base anchoring transaction was not confirmed successfully');
  }

  const block = await provider.getBlock(receipt.blockNumber);
  const confirmedAt = block?.timestamp ? new Date(Number(block.timestamp) * 1000) : new Date();

  return {
    status: 'CONFIRMED',
    txId: transaction.hash,
    network: 'base-sepolia',
    chainId: BASE_SEPOLIA_CHAIN_ID,
    anchoredAt: submittedAt,
    confirmedAt,
    blockNumber: receipt.blockNumber,
    explorerUrl: `${config.explorerUrl.replace(/\/$/, '')}/tx/${transaction.hash}`
  };
}

module.exports = {
  BASE_SEPOLIA_CHAIN_ID,
  encodeEvidenceHash,
  anchorMarketplaceEvidenceOnBase
};
