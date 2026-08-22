const { ethers } = require('ethers');

function rpcUrlForChain(chainId) {
  return process.env[`EVM_RPC_URL_${chainId}`] || process.env.EVM_RPC_URL || null;
}

function allowedContractsForChain(chainId) {
  const raw = process.env[`NFT_CONTRACT_ALLOWLIST_${chainId}`] || process.env.NFT_CONTRACT_ALLOWLIST || '';
  return raw.split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
}

function myzTokenAddressForChain(chainId) {
  const raw = process.env[`MYZ_TOKEN_ADDRESS_${chainId}`] || process.env.MYZ_TOKEN_ADDRESS || null;
  return raw ? ethers.getAddress(raw).toLowerCase() : null;
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

async function assertNetwork(provider, chainId) {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== Number(chainId)) throw new Error('RPC chainId mismatch');
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
  await assertNetwork(provider, chainId);

  return {
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash,
    contractAddress: normalizedContract,
    ownerWallet: normalizedOwner,
    tokenId: expectedTokenId
  };
}

async function verifyNftTransferReceipt({ chainId, contractAddress, tokenId, transferTxHash, sellerWallet, buyerWallet }) {
  const provider = getProvider(chainId);
  const normalizedContract = assertAllowedContract(chainId, contractAddress);
  const seller = ethers.getAddress(sellerWallet).toLowerCase();
  const buyer = ethers.getAddress(buyerWallet).toLowerCase();
  const expectedTokenId = BigInt(tokenId).toString();
  const receipt = await provider.getTransactionReceipt(transferTxHash);

  if (!receipt) throw new Error('Transazione di trasferimento NFT non trovata');
  if (receipt.status !== 1) throw new Error('Transazione di trasferimento NFT fallita');

  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  const sellerTopic = ethers.zeroPadValue(seller, 32).toLowerCase();
  const buyerTopic = ethers.zeroPadValue(buyer, 32).toLowerCase();

  const transferLog = receipt.logs.find(log => {
    if (log.address.toLowerCase() !== normalizedContract) return false;
    if (!log.topics || log.topics.length < 4 || log.topics[0] !== transferTopic) return false;
    if (log.topics[1].toLowerCase() !== sellerTopic) return false;
    if (log.topics[2].toLowerCase() !== buyerTopic) return false;
    return BigInt(log.topics[3]).toString() === expectedTokenId;
  });

  if (!transferLog) throw new Error('Trasferimento ERC-721 seller -> buyer non trovato');

  const nft = new ethers.Contract(normalizedContract, ['function ownerOf(uint256) view returns (address)'], provider);
  const currentOwner = (await nft.ownerOf(expectedTokenId)).toLowerCase();
  if (currentOwner !== buyer) throw new Error('Il buyer non risulta owner corrente del token');

  await assertNetwork(provider, chainId);
  return { blockNumber: receipt.blockNumber, transactionHash: receipt.hash, ownerWallet: buyer };
}

async function verifyMyzPaymentReceipt({ chainId, paymentTxHash, buyerWallet, sellerWallet, priceMyz }) {
  const provider = getProvider(chainId);
  const tokenAddress = myzTokenAddressForChain(chainId);
  if (!tokenAddress) throw new Error(`MYZ token non configurato per chain ${chainId}`);

  const buyer = ethers.getAddress(buyerWallet).toLowerCase();
  const seller = ethers.getAddress(sellerWallet).toLowerCase();
  const receipt = await provider.getTransactionReceipt(paymentTxHash);

  if (!receipt) throw new Error('Transazione di pagamento MYZ non trovata');
  if (receipt.status !== 1) throw new Error('Transazione di pagamento MYZ fallita');

  const token = new ethers.Contract(tokenAddress, ['function decimals() view returns (uint8)'], provider);
  const decimals = Number(await token.decimals());
  const expectedAmount = ethers.parseUnits(String(priceMyz), decimals);
  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  const buyerTopic = ethers.zeroPadValue(buyer, 32).toLowerCase();
  const sellerTopic = ethers.zeroPadValue(seller, 32).toLowerCase();

  const paymentLog = receipt.logs.find(log => {
    if (log.address.toLowerCase() !== tokenAddress) return false;
    if (!log.topics || log.topics.length < 3 || log.topics[0] !== transferTopic) return false;
    if (log.topics[1].toLowerCase() !== buyerTopic) return false;
    if (log.topics[2].toLowerCase() !== sellerTopic) return false;
    try {
      return BigInt(log.data) >= expectedAmount;
    } catch {
      return false;
    }
  });

  if (!paymentLog) throw new Error('Pagamento MYZ buyer -> seller insufficiente o non trovato');
  await assertNetwork(provider, chainId);

  return {
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash,
    tokenAddress,
    amount: expectedAmount.toString(),
    decimals
  };
}

module.exports = {
  verifyMintReceipt,
  verifyNftTransferReceipt,
  verifyMyzPaymentReceipt,
  assertAllowedContract
};
