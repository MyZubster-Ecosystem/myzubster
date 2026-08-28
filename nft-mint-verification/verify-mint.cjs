const { ethers } = require('ethers');

function normalizeAddress(address) {
  return ethers.getAddress(address).toLowerCase();
}

function assertAllowedContract(contractAddress, allowedContracts) {
  const normalized = normalizeAddress(contractAddress);
  const allowlist = (allowedContracts || []).map(normalizeAddress);
  if (!allowlist.length) throw new Error('NFT contract allowlist is required');
  if (!allowlist.includes(normalized)) throw new Error('NFT contract is not allowed');
  return normalized;
}

function findMintTransferLog({ receipt, contractAddress, ownerWallet, tokenId }) {
  if (!receipt || receipt.status !== 1) throw new Error('successful mint receipt is required');
  const normalizedContract = normalizeAddress(contractAddress);
  const normalizedOwner = normalizeAddress(ownerWallet);
  const expectedTokenId = BigInt(tokenId).toString();
  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  const zeroTopic = ethers.zeroPadValue(ethers.ZeroAddress, 32).toLowerCase();
  const ownerTopic = ethers.zeroPadValue(normalizedOwner, 32).toLowerCase();

  return (receipt.logs || []).find((log) => {
    if (!log.address || normalizeAddress(log.address) !== normalizedContract) return false;
    if (!log.topics || log.topics.length < 4) return false;
    if (log.topics[0].toLowerCase() !== transferTopic.toLowerCase()) return false;
    if (log.topics[1].toLowerCase() !== zeroTopic) return false;
    if (log.topics[2].toLowerCase() !== ownerTopic) return false;
    try {
      return BigInt(log.topics[3]).toString() === expectedTokenId;
    } catch {
      return false;
    }
  }) || null;
}

async function verifyMint({
  chainId,
  expectedChainId,
  receipt,
  contractAddress,
  allowedContracts,
  ownerWallet,
  tokenId,
  metadataUri,
  readOwnerOf,
  readTokenUri
}) {
  if (Number(chainId) !== Number(expectedChainId)) throw new Error('RPC chainId mismatch');
  const normalizedContract = assertAllowedContract(contractAddress, allowedContracts);
  const normalizedOwner = normalizeAddress(ownerWallet);
  if (!receipt || receipt.status !== 1) throw new Error('mint transaction failed or missing');
  if (!receipt.to || normalizeAddress(receipt.to) !== normalizedContract) {
    throw new Error('mint transaction target does not match allowed NFT contract');
  }

  const mintLog = findMintTransferLog({
    receipt,
    contractAddress: normalizedContract,
    ownerWallet: normalizedOwner,
    tokenId
  });
  if (!mintLog) throw new Error('ERC-721 mint Transfer event not found');

  if (typeof readOwnerOf !== 'function' || typeof readTokenUri !== 'function') {
    throw new Error('on-chain readers are required');
  }

  const currentOwner = normalizeAddress(await readOwnerOf(BigInt(tokenId)));
  if (currentOwner !== normalizedOwner) throw new Error('current on-chain owner mismatch');

  const tokenUri = await readTokenUri(BigInt(tokenId));
  if (!tokenUri) throw new Error('on-chain tokenURI is empty');
  if (metadataUri && metadataUri !== tokenUri) throw new Error('metadata URI mismatch');

  return {
    chainId: Number(chainId),
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash,
    contractAddress: normalizedContract,
    ownerWallet: normalizedOwner,
    tokenId: BigInt(tokenId).toString(),
    tokenURI: tokenUri
  };
}

module.exports = {
  normalizeAddress,
  assertAllowedContract,
  findMintTransferLog,
  verifyMint
};
