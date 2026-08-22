const { ethers } = require('ethers');
const NFTAsset = require('../models/NFTAsset');
const MarketplaceListing = require('../models/MarketplaceListing');
const Wallet = require('../models/Wallet');
const { escrowAddressForChain } = require('../services/escrowMarketplaceVerificationService');

function myzTokenAddressForChain(chainId) {
  const raw = process.env[`MYZ_TOKEN_ADDRESS_${chainId}`] || process.env.MYZ_TOKEN_ADDRESS || null;
  return raw ? ethers.getAddress(raw) : null;
}

const erc721Interface = new ethers.Interface([
  'function approve(address to,uint256 tokenId)'
]);
const erc20Interface = new ethers.Interface([
  'function approve(address spender,uint256 amount) returns (bool)'
]);
const escrowInterface = new ethers.Interface([
  'function list(address nftContract,uint256 tokenId,uint256 price) returns (uint256)',
  'function buy(uint256 listingId)'
]);

async function assertVerifiedUserWallet(req, chainId, address) {
  const wallet = await Wallet.findOne({
    userId: req.userId,
    address: ethers.getAddress(address).toLowerCase(),
    chainId: Number(chainId),
    verified: true
  });
  if (!wallet) throw new Error('Wallet non verificato per questo utente e chainId');
}

exports.buildTransactionData = async (req, res) => {
  try {
    const { action, walletAddress, assetId, priceMyz, listingId } = req.body;
    if (!action || !walletAddress) {
      return res.status(400).json({ success: false, message: 'action and walletAddress are required' });
    }

    if (action === 'approve_nft' || action === 'list_nft') {
      if (!assetId) return res.status(400).json({ success: false, message: 'assetId is required' });
      const asset = await NFTAsset.findOne({ assetId });
      if (!asset) return res.status(404).json({ success: false, message: 'NFT asset not found' });
      if (!asset.ownerUserId || asset.ownerUserId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: 'NFT non appartenente a questo utente' });
      }
      if (!asset.chainId || !asset.contractAddress || !asset.tokenId || !asset.ownerWallet) {
        return res.status(409).json({ success: false, message: 'NFT on-chain data incomplete' });
      }
      if (asset.ownerWallet.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(409).json({ success: false, message: 'Connected wallet does not match NFT owner' });
      }
      await assertVerifiedUserWallet(req, asset.chainId, walletAddress);
      const escrow = escrowAddressForChain(asset.chainId);
      if (!escrow) throw new Error(`Marketplace escrow non configurato per chain ${asset.chainId}`);

      if (action === 'approve_nft') {
        return res.json({
          success: true,
          chainId: Number(asset.chainId),
          to: ethers.getAddress(asset.contractAddress),
          data: erc721Interface.encodeFunctionData('approve', [escrow, asset.tokenId])
        });
      }

      if (!Number.isFinite(Number(priceMyz)) || Number(priceMyz) <= 0) {
        return res.status(400).json({ success: false, message: 'priceMyz must be greater than zero' });
      }
      const price = ethers.parseUnits(String(priceMyz), 18);
      return res.json({
        success: true,
        chainId: Number(asset.chainId),
        to: ethers.getAddress(escrow),
        data: escrowInterface.encodeFunctionData('list', [asset.contractAddress, asset.tokenId, price])
      });
    }

    if (action === 'approve_myz' || action === 'buy_nft') {
      if (!listingId) return res.status(400).json({ success: false, message: 'listingId is required' });
      const listing = await MarketplaceListing.findOne({
        listingId,
        settlementMode: 'atomic_escrow',
        status: 'active'
      });
      if (!listing) return res.status(404).json({ success: false, message: 'Active atomic listing not found' });
      if (listing.sellerUserId.toString() === req.userId.toString()) {
        return res.status(409).json({ success: false, message: 'Seller cannot buy own listing' });
      }
      await assertVerifiedUserWallet(req, listing.chainId, walletAddress);
      const escrow = escrowAddressForChain(listing.chainId);
      const token = myzTokenAddressForChain(listing.chainId);
      if (!escrow || !token) throw new Error('Marketplace escrow or MYZ token not configured');
      const price = ethers.parseUnits(String(listing.priceMyz), 18);

      if (action === 'approve_myz') {
        return res.json({
          success: true,
          chainId: Number(listing.chainId),
          to: token,
          data: erc20Interface.encodeFunctionData('approve', [escrow, price])
        });
      }

      return res.json({
        success: true,
        chainId: Number(listing.chainId),
        to: ethers.getAddress(escrow),
        data: escrowInterface.encodeFunctionData('buy', [listing.escrowListingId])
      });
    }

    return res.status(400).json({ success: false, message: 'Unsupported marketplace action' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
