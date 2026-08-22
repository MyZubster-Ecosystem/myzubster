const { ethers } = require('ethers');

function rpcUrlForChain(chainId) {
  return process.env[`EVM_RPC_URL_${chainId}`] || process.env.EVM_RPC_URL || null;
}

function escrowAddressForChain(chainId) {
  const raw = process.env[`MYZ_MARKETPLACE_ESCROW_ADDRESS_${chainId}`] || process.env.MYZ_MARKETPLACE_ESCROW_ADDRESS || null;
  return raw ? ethers.getAddress(raw).toLowerCase() : null;
}

function myzTokenAddressForChain(chainId) {
  const raw = process.env[`MYZ_TOKEN_ADDRESS_${chainId}`] || process.env.MYZ_TOKEN_ADDRESS || null;
  return raw ? ethers.getAddress(raw).toLowerCase() : null;
}

function allowedContractsForChain(chainId) {
  const raw = process.env[`NFT_CONTRACT_ALLOWLIST_${chainId}`] || process.env.NFT_CONTRACT_ALLOWLIST || '';
  return raw.split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
}

function providerForChain(chainId) {
  const url = rpcUrlForChain(chainId);
  if (!url) throw new Error(`RPC non configurato per chain ${chainId}`);
  return new ethers.JsonRpcProvider(url, Number(chainId));
}

async function assertNetwork(provider, chainId) {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== Number(chainId)) throw new Error('RPC chainId mismatch');
}

function assertAllowedNft(chainId, address) {
  const normalized = ethers.getAddress(address).toLowerCase();
  const allowlist = allowedContractsForChain(chainId);
  if (!allowlist.includes(normalized)) throw new Error('NFT contract non autorizzato');
  return normalized;
}

const escrowAbi = [
  'event Listed(uint256 indexed listingId,address indexed seller,address indexed nftContract,uint256 tokenId,uint256 price)',
  'event Purchased(uint256 indexed listingId,address indexed buyer,address indexed seller,uint256 price)',
  'function listings(uint256) view returns (address seller,address nftContract,uint256 tokenId,uint256 price,bool active)'
];

async function verifyEscrowListingReceipt({ chainId, listTxHash, sellerWallet, nftContract, tokenId, priceMyz }) {
  const provider = providerForChain(chainId);
  const escrowAddress = escrowAddressForChain(chainId);
  const tokenAddress = myzTokenAddressForChain(chainId);
  if (!escrowAddress) throw new Error(`Marketplace escrow non configurato per chain ${chainId}`);
  if (!tokenAddress) throw new Error(`MYZ token non configurato per chain ${chainId}`);

  const seller = ethers.getAddress(sellerWallet).toLowerCase();
  const nftAddress = assertAllowedNft(chainId, nftContract);
  const receipt = await provider.getTransactionReceipt(listTxHash);
  if (!receipt) throw new Error('Transazione escrow listing non trovata');
  if (receipt.status !== 1) throw new Error('Transazione escrow listing fallita');
  if (!receipt.to || receipt.to.toLowerCase() !== escrowAddress) throw new Error('Listing transaction non inviata al marketplace escrow configurato');

  const token = new ethers.Contract(tokenAddress, ['function decimals() view returns (uint8)'], provider);
  const decimals = Number(await token.decimals());
  const expectedPrice = ethers.parseUnits(String(priceMyz), decimals);
  const iface = new ethers.Interface(escrowAbi);

  let listed = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== escrowAddress) continue;
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name !== 'Listed') continue;
      if (parsed.args.seller.toLowerCase() !== seller) continue;
      if (parsed.args.nftContract.toLowerCase() !== nftAddress) continue;
      if (BigInt(parsed.args.tokenId).toString() !== BigInt(tokenId).toString()) continue;
      if (BigInt(parsed.args.price) !== expectedPrice) continue;
      listed = parsed;
      break;
    } catch {}
  }
  if (!listed) throw new Error('Evento Listed coerente non trovato');

  const escrow = new ethers.Contract(escrowAddress, escrowAbi, provider);
  const listingId = BigInt(listed.args.listingId).toString();
  const onchain = await escrow.listings(listingId);
  if (!onchain.active) throw new Error('Listing escrow non attiva');
  if (onchain.seller.toLowerCase() !== seller) throw new Error('Seller escrow mismatch');
  if (onchain.nftContract.toLowerCase() !== nftAddress) throw new Error('NFT escrow mismatch');
  if (BigInt(onchain.tokenId).toString() !== BigInt(tokenId).toString()) throw new Error('Token ID escrow mismatch');
  if (BigInt(onchain.price) !== expectedPrice) throw new Error('Prezzo escrow mismatch');

  const nft = new ethers.Contract(nftAddress, ['function ownerOf(uint256) view returns (address)'], provider);
  const owner = (await nft.ownerOf(tokenId)).toLowerCase();
  if (owner !== escrowAddress) throw new Error('NFT non custodito dal marketplace escrow');

  await assertNetwork(provider, chainId);
  return {
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash.toLowerCase(),
    escrowAddress,
    escrowListingId: listingId,
    tokenAddress,
    decimals,
    price: expectedPrice.toString()
  };
}

async function verifyAtomicPurchaseReceipt({ chainId, saleTxHash, escrowListingId, buyerWallet, sellerWallet, nftContract, tokenId, priceMyz }) {
  const provider = providerForChain(chainId);
  const escrowAddress = escrowAddressForChain(chainId);
  const tokenAddress = myzTokenAddressForChain(chainId);
  if (!escrowAddress) throw new Error(`Marketplace escrow non configurato per chain ${chainId}`);
  if (!tokenAddress) throw new Error(`MYZ token non configurato per chain ${chainId}`);

  const buyer = ethers.getAddress(buyerWallet).toLowerCase();
  const seller = ethers.getAddress(sellerWallet).toLowerCase();
  const nftAddress = assertAllowedNft(chainId, nftContract);
  const receipt = await provider.getTransactionReceipt(saleTxHash);
  if (!receipt) throw new Error('Transazione acquisto escrow non trovata');
  if (receipt.status !== 1) throw new Error('Transazione acquisto escrow fallita');
  if (!receipt.to || receipt.to.toLowerCase() !== escrowAddress) throw new Error('Acquisto non inviato al marketplace escrow configurato');

  const token = new ethers.Contract(tokenAddress, ['function decimals() view returns (uint8)'], provider);
  const decimals = Number(await token.decimals());
  const expectedPrice = ethers.parseUnits(String(priceMyz), decimals);
  const iface = new ethers.Interface(escrowAbi);

  let purchased = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== escrowAddress) continue;
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name !== 'Purchased') continue;
      if (BigInt(parsed.args.listingId).toString() !== BigInt(escrowListingId).toString()) continue;
      if (parsed.args.buyer.toLowerCase() !== buyer) continue;
      if (parsed.args.seller.toLowerCase() !== seller) continue;
      if (BigInt(parsed.args.price) !== expectedPrice) continue;
      purchased = true;
      break;
    } catch {}
  }
  if (!purchased) throw new Error('Evento Purchased coerente non trovato');

  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  const buyerTopic = ethers.zeroPadValue(buyer, 32).toLowerCase();
  const sellerTopic = ethers.zeroPadValue(seller, 32).toLowerCase();
  const escrowTopic = ethers.zeroPadValue(escrowAddress, 32).toLowerCase();

  const paymentFound = receipt.logs.some(log => {
    if (log.address.toLowerCase() !== tokenAddress || log.topics?.[0] !== transferTopic || log.topics.length < 3) return false;
    if (log.topics[1].toLowerCase() !== buyerTopic || log.topics[2].toLowerCase() !== sellerTopic) return false;
    try { return BigInt(log.data) >= expectedPrice; } catch { return false; }
  });
  if (!paymentFound) throw new Error('Pagamento MYZ atomico non trovato');

  const nftTransferFound = receipt.logs.some(log => {
    if (log.address.toLowerCase() !== nftAddress || log.topics?.[0] !== transferTopic || log.topics.length < 4) return false;
    if (log.topics[1].toLowerCase() !== escrowTopic || log.topics[2].toLowerCase() !== buyerTopic) return false;
    return BigInt(log.topics[3]).toString() === BigInt(tokenId).toString();
  });
  if (!nftTransferFound) throw new Error('Trasferimento NFT escrow -> buyer non trovato');

  const nft = new ethers.Contract(nftAddress, ['function ownerOf(uint256) view returns (address)'], provider);
  const owner = (await nft.ownerOf(tokenId)).toLowerCase();
  if (owner !== buyer) throw new Error('Buyer non risulta owner corrente dell NFT');

  await assertNetwork(provider, chainId);
  return {
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash.toLowerCase(),
    escrowAddress,
    escrowListingId: BigInt(escrowListingId).toString(),
    tokenAddress,
    amount: expectedPrice.toString(),
    decimals,
    ownerWallet: buyer
  };
}

module.exports = {
  verifyEscrowListingReceipt,
  verifyAtomicPurchaseReceipt,
  escrowAddressForChain
};
