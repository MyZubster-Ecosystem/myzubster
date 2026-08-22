const { ethers } = require('ethers');

function rpcUrlForChain(chainId) {
  return process.env[`EVM_RPC_URL_${chainId}`] || process.env.EVM_RPC_URL || null;
}

function allowedContractsForChain(chainId) {
  const raw = process.env[`NFT_CONTRACT_ALLOWLIST_${chainId}`] || process.env.NFT_CONTRACT_ALLOWLIST || '';
  return raw.split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
}

function getProvider(chainId) {
  const url = rpcUrlForChain(chainId);
  if (!url) throw new Error(`RPC non configurato per chain ${chainId}`);
  return new ethers.JsonRpcProvider(url, Number(chainId));
}

function assertAllowedContract(chainId, contractAddress) {
  const normalized = ethers.getAddress(contractAddress).toLowerCase();
  const allowlist = allowedContractsForChain(chainId);
  if (!allowlist.length) throw new Error(`NFT contract allowlist non configurata per chain ${chainId}`);
  if (!allowlist.includes(normalized)) throw new Error('NFT contract non autorizzato');
  return normalized;
}

async function verifyMintReceipt({ chainId, contractAddress, tokenId, mintTxHash, ownerWallet }) {
  const provider = getProvider(chainId);
  const normalizedContract = assertAllowedContract(chainId, contractAddress);
  const normalizedOwner = ethers.getAddress(ownerWallet).toLowerCase();
  const receipt = await provider.getTransactionReceipt(mintTxHash);

  if (!receipt) throw new Error('Transazione di mint non trovata');
  if (receipt.status !== 1) throw new Error('Transazione di mint fallita');
  if (!receipt.to || receipt.to.toLowerCase() !== normalizedContract) {
    throw new Error('La transazione non punta al contratto NFT autorizzato');
  }

  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  const zeroTopic = ethers.zeroPadValue(ethers.ZeroAddress, 32).toLowerCase();
  const ownerTopic = ethers.zeroPadValue(normalizedOwner, 32).toLowerCase();
  const expectedTokenId = BigInt(tokenId).toString();

  const mintLog = receipt.logs.find(log => {
    if (log.address.toLowerCase() !== normalizedContract) return false;
    if (!log.topics || log.topics.length < 4 || log.topics[0] !== transferTopic) return false;
    if (log.topics[1].toLowerCase() !== zeroTopic) return false;
    if (log.topics[2].toLowerCase() !== ownerTopic) return false;
    return BigInt(log.topics[3]).toString() === expectedTokenId;
  });

  if (!mintLog) throw new Error('Evento ERC-721 mint Transfer(0x0, owner, tokenId) non trovato');

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== Number(chainId)) throw new Error('RPC chainId mismatch');

  return {
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash,
    contractAddress: normalizedContract,
    ownerWallet: normalizedOwner,
    tokenId: expectedTokenId
  };
}

module.exports = { verifyMintReceipt, assertAllowedContract };
