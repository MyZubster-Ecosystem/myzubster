const crypto = require('crypto');
const NFTAsset = require('../models/NFTAsset');
const MarketplaceListing = require('../models/MarketplaceListing');

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

exports.createDraft = async (req, res) => {
  try {
    const { type, creatorUserId, ownerUserId, ownerWallet, metadataUri, contentHash, github, edition, attributes } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'type is required' });

    const asset = await NFTAsset.create({
      assetId: newId('nft'),
      type,
      creatorUserId: creatorUserId || null,
      ownerUserId: ownerUserId || null,
      ownerWallet: ownerWallet || null,
      metadataUri: metadataUri || null,
      contentHash: contentHash || null,
      github: github || {},
      edition: edition || {},
      attributes: attributes || {},
      status: 'draft'
    });

    return res.status(201).json({ success: true, asset });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAsset = async (req, res) => {
  const asset = await NFTAsset.findOne({ assetId: req.params.assetId }).lean();
  if (!asset) return res.status(404).json({ success: false, message: 'NFT asset not found' });
  return res.json({ success: true, asset });
};

exports.listAssets = async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.ownerWallet) filter.ownerWallet = req.query.ownerWallet;
  const assets = await NFTAsset.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  return res.json({ success: true, assets });
};

// MyZubster does not custody private keys in this MVP. The client/wallet performs
// the mint and then submits the resulting chain identifiers for verification/persistence.
exports.confirmMint = async (req, res) => {
  const { chainId, contractAddress, tokenId, mintTxHash, ownerWallet, metadataUri } = req.body;
  if (!chainId || !contractAddress || !tokenId || !mintTxHash) {
    return res.status(400).json({ success: false, message: 'chainId, contractAddress, tokenId and mintTxHash are required' });
  }

  const asset = await NFTAsset.findOneAndUpdate(
    { assetId: req.params.assetId },
    {
      $set: {
        chainId,
        contractAddress,
        tokenId,
        mintTxHash,
        ownerWallet: ownerWallet || null,
        metadataUri: metadataUri || undefined,
        status: 'minted',
        mintedAt: new Date()
      }
    },
    { new: true, runValidators: true }
  );

  if (!asset) return res.status(404).json({ success: false, message: 'NFT asset not found' });
  return res.json({ success: true, asset });
};

exports.createListing = async (req, res) => {
  const { assetId, sellerUserId, sellerWallet, priceMyz } = req.body;
  if (!assetId || priceMyz === undefined) {
    return res.status(400).json({ success: false, message: 'assetId and priceMyz are required' });
  }

  const asset = await NFTAsset.findOne({ assetId });
  if (!asset) return res.status(404).json({ success: false, message: 'NFT asset not found' });
  if (asset.status !== 'minted') return res.status(409).json({ success: false, message: 'Only minted assets can be listed' });

  const listing = await MarketplaceListing.create({
    listingId: newId('listing'),
    assetId,
    sellerUserId: sellerUserId || null,
    sellerWallet: sellerWallet || asset.ownerWallet || null,
    priceMyz,
    status: 'active'
  });
  asset.status = 'listed';
  await asset.save();

  return res.status(201).json({ success: true, listing });
};

exports.listMarketplace = async (_req, res) => {
  const listings = await MarketplaceListing.find({ status: 'active' }).sort({ createdAt: -1 }).limit(100).lean();
  return res.json({ success: true, listings });
};

// Settlement is non-custodial: record a completed MYZ/NFT transfer after the wallet
// or marketplace contract returns a transaction hash.
exports.confirmSale = async (req, res) => {
  const { buyerUserId, buyerWallet, saleTxHash } = req.body;
  if (!saleTxHash) return res.status(400).json({ success: false, message: 'saleTxHash is required' });

  const listing = await MarketplaceListing.findOne({ listingId: req.params.listingId, status: 'active' });
  if (!listing) return res.status(404).json({ success: false, message: 'Active listing not found' });

  listing.status = 'sold';
  listing.buyerUserId = buyerUserId || null;
  listing.buyerWallet = buyerWallet || null;
  listing.saleTxHash = saleTxHash;
  listing.soldAt = new Date();
  await listing.save();

  const asset = await NFTAsset.findOne({ assetId: listing.assetId });
  if (asset) {
    asset.status = 'sold';
    asset.ownerUserId = buyerUserId || asset.ownerUserId;
    asset.ownerWallet = buyerWallet || asset.ownerWallet;
    await asset.save();
  }

  return res.json({ success: true, listing, asset });
};

exports.cancelListing = async (req, res) => {
  const listing = await MarketplaceListing.findOne({ listingId: req.params.listingId, status: 'active' });
  if (!listing) return res.status(404).json({ success: false, message: 'Active listing not found' });
  listing.status = 'cancelled';
  await listing.save();
  await NFTAsset.updateOne({ assetId: listing.assetId, status: 'listed' }, { $set: { status: 'minted' } });
  return res.json({ success: true, listing });
};
