const crypto = require('crypto');
const NFTAsset = require('../models/NFTAsset');
const MarketplaceListing = require('../models/MarketplaceListing');
const Wallet = require('../models/Wallet');
const {
  verifyEscrowListingReceipt,
  verifyAtomicPurchaseReceipt
} = require('../services/escrowMarketplaceVerificationService');

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

exports.registerEscrowListing = async (req, res) => {
  try {
    const { assetId, priceMyz, listTxHash } = req.body;
    if (!assetId || priceMyz === undefined || !listTxHash) {
      return res.status(400).json({ success: false, message: 'assetId, priceMyz and listTxHash are required' });
    }
    if (!Number.isFinite(Number(priceMyz)) || Number(priceMyz) <= 0) {
      return res.status(400).json({ success: false, message: 'priceMyz must be greater than zero' });
    }

    const asset = await NFTAsset.findOne({ assetId });
    if (!asset) return res.status(404).json({ success: false, message: 'NFT asset not found' });
    if (!['minted', 'listed'].includes(asset.status)) {
      return res.status(409).json({ success: false, message: 'NFT is not available for escrow listing' });
    }
    if (!asset.ownerUserId || asset.ownerUserId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Puoi mettere in escrow solo NFT di tua proprietà' });
    }
    if (!asset.ownerWallet || !asset.chainId || !asset.contractAddress || !asset.tokenId) {
      return res.status(409).json({ success: false, message: 'NFT on-chain data incomplete' });
    }

    const verifiedSellerWallet = await Wallet.findOne({
      userId: req.userId,
      address: asset.ownerWallet.toLowerCase(),
      chainId: Number(asset.chainId),
      verified: true
    });
    if (!verifiedSellerWallet) {
      return res.status(403).json({ success: false, message: 'Wallet owner NFT non verificato per questo utente' });
    }

    const existing = await MarketplaceListing.findOne({ assetId, status: { $in: ['active', 'sale_pending'] } });
    if (existing) return res.status(409).json({ success: false, message: 'NFT already has an active listing' });

    const replay = await MarketplaceListing.findOne({ escrowListTxHash: listTxHash.toLowerCase() });
    if (replay) return res.status(409).json({ success: false, message: 'Escrow listing transaction already registered' });

    const verification = await verifyEscrowListingReceipt({
      chainId: Number(asset.chainId),
      listTxHash,
      sellerWallet: asset.ownerWallet,
      nftContract: asset.contractAddress,
      tokenId: asset.tokenId,
      priceMyz: Number(priceMyz)
    });

    const listing = await MarketplaceListing.create({
      listingId: newId('listing'),
      assetId,
      sellerUserId: req.userId,
      sellerWallet: asset.ownerWallet.toLowerCase(),
      chainId: Number(asset.chainId),
      priceMyz: Number(priceMyz),
      settlementMode: 'atomic_escrow',
      escrowContract: verification.escrowAddress,
      escrowListingId: verification.escrowListingId,
      escrowListTxHash: verification.transactionHash,
      escrowListingVerification: {
        ...verification,
        verifiedAt: new Date().toISOString()
      },
      status: 'active'
    });

    asset.status = 'listed';
    await asset.save();

    return res.status(201).json({ success: true, verifiedOnChain: true, listing });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.confirmAtomicSale = async (req, res) => {
  let listing;
  try {
    const { buyerWallet, saleTxHash } = req.body;
    if (!buyerWallet || !saleTxHash) {
      return res.status(400).json({ success: false, message: 'buyerWallet and saleTxHash are required' });
    }

    listing = await MarketplaceListing.findOne({
      listingId: req.params.listingId,
      settlementMode: 'atomic_escrow',
      status: 'active'
    });
    if (!listing) return res.status(404).json({ success: false, message: 'Active atomic escrow listing not found' });
    if (listing.sellerUserId.toString() === req.userId.toString()) {
      return res.status(409).json({ success: false, message: 'Seller e buyer devono essere utenti diversi' });
    }

    const asset = await NFTAsset.findOne({ assetId: listing.assetId });
    if (!asset || asset.status !== 'listed') {
      return res.status(409).json({ success: false, message: 'Listed NFT asset not available' });
    }

    const normalizedBuyer = buyerWallet.toLowerCase();
    const verifiedBuyerWallet = await Wallet.findOne({
      userId: req.userId,
      address: normalizedBuyer,
      chainId: Number(listing.chainId),
      verified: true
    });
    if (!verifiedBuyerWallet) {
      return res.status(403).json({ success: false, message: 'Buyer wallet non verificato per questo utente e chainId' });
    }
    if (normalizedBuyer === listing.sellerWallet.toLowerCase()) {
      return res.status(409).json({ success: false, message: 'Seller e buyer wallet devono essere diversi' });
    }

    const replay = await MarketplaceListing.findOne({
      _id: { $ne: listing._id },
      saleTxHash: saleTxHash.toLowerCase()
    });
    if (replay) return res.status(409).json({ success: false, message: 'Sale transaction hash già usato' });

    listing.status = 'sale_pending';
    listing.buyerUserId = req.userId;
    listing.buyerWallet = normalizedBuyer;
    listing.saleTxHash = saleTxHash.toLowerCase();
    await listing.save();

    const verification = await verifyAtomicPurchaseReceipt({
      chainId: Number(listing.chainId),
      saleTxHash,
      escrowListingId: listing.escrowListingId,
      buyerWallet: normalizedBuyer,
      sellerWallet: listing.sellerWallet,
      nftContract: asset.contractAddress,
      tokenId: asset.tokenId,
      priceMyz: listing.priceMyz
    });

    listing.status = 'sold';
    listing.paymentTxHash = verification.transactionHash;
    listing.nftTransferTxHash = verification.transactionHash;
    listing.paymentVerification = {
      blockNumber: verification.blockNumber,
      transactionHash: verification.transactionHash,
      tokenAddress: verification.tokenAddress,
      amount: verification.amount,
      decimals: verification.decimals,
      atomicEscrow: true,
      verifiedAt: new Date().toISOString()
    };
    listing.nftTransferVerification = {
      blockNumber: verification.blockNumber,
      transactionHash: verification.transactionHash,
      ownerWallet: verification.ownerWallet,
      escrowAddress: verification.escrowAddress,
      atomicEscrow: true,
      verifiedAt: new Date().toISOString()
    };
    listing.soldAt = new Date();
    await listing.save();

    asset.status = 'sold';
    asset.ownerUserId = req.userId;
    asset.ownerWallet = normalizedBuyer;
    await asset.save();

    return res.json({ success: true, verifiedOnChain: true, atomicSettlement: true, listing, asset });
  } catch (error) {
    if (listing?._id) {
      await MarketplaceListing.updateOne(
        { _id: listing._id, status: 'sale_pending' },
        {
          $set: { status: 'active', buyerUserId: null, buyerWallet: null },
          $unset: { saleTxHash: '' }
        }
      ).catch(() => {});
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.listAtomicMarketplace = async (_req, res) => {
  const listings = await MarketplaceListing.find({ settlementMode: 'atomic_escrow', status: 'active' })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return res.json({ success: true, listings });
};
