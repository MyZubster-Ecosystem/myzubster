const NFT = require('../models/NFT');

// Mint a new NFT
exports.mint = async (req, res) => {
  try {
    const { nftType, gardenId, plantId, name, description, imageUrl, metadata, attributes, tokenId, contractAddress } = req.body;
    if (!nftType || !name || !tokenId || !contractAddress) {
      return res.status(400).json({ success: false, message: 'nftType, name, tokenId, and contractAddress are required' });
    }
    const validTypes = ['garden', 'plant', 'harvest'];
    if (!validTypes.includes(nftType)) {
      return res.status(400).json({ success: false, message: 'nftType must be garden, plant, or harvest' });
    }

    const existing = await NFT.findOne({ tokenId, contractAddress });
    if (existing) {
      return res.status(409).json({ success: false, message: 'NFT with this tokenId already exists' });
    }

    const nft = new NFT({
      tokenId,
      contractAddress,
      ownerAddress: req.body.ownerAddress || '0x0',
      ownerUser: req.userId,
      nftType,
      gardenId: gardenId || undefined,
      plantId: plantId || undefined,
      name,
      description: description || '',
      imageUrl: imageUrl || '',
      metadata: metadata || {},
      attributes: attributes || [],
      transactionHash: req.body.transactionHash || ''
    });

    await nft.save();
    res.status(201).json({ success: true, message: 'NFT minted successfully', data: nft });
  } catch (error) {
    console.error('Mint NFT error:', error);
    res.status(500).json({ success: false, message: 'Error minting NFT', error: error.message });
  }
};

// List all NFTs (marketplace)
exports.getAll = async (req, res) => {
  try {
    const { nftType, isListed, minPrice, maxPrice, limit = 20, page = 1 } = req.query;
    const query = {};
    if (nftType) query.nftType = nftType;
    if (isListed !== undefined) query.isListed = isListed === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const nfts = await NFT.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('ownerUser', 'username')
      .populate('gardenId', 'name')
      .populate('plantId', 'name');
    const total = await NFT.countDocuments(query);
    res.json({ success: true, count: nfts.length, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), data: nfts });
  } catch (error) {
    console.error('Get NFTs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching NFTs', error: error.message });
  }
};

// Get single NFT
exports.getOne = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id)
      .populate('ownerUser', 'username')
      .populate('gardenId', 'name location')
      .populate('plantId', 'name species');
    if (!nft) return res.status(404).json({ success: false, message: 'NFT not found' });
    res.json({ success: true, data: nft });
  } catch (error) {
    console.error('Get NFT error:', error);
    res.status(500).json({ success: false, message: 'Error fetching NFT', error: error.message });
  }
};

// Get user's NFT gallery
exports.getUserGallery = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const nfts = await NFT.find({ ownerUser: userId })
      .sort({ createdAt: -1 })
      .populate('gardenId', 'name')
      .populate('plantId', 'name');
    res.json({ success: true, count: nfts.length, data: nfts });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ success: false, message: 'Error fetching gallery', error: error.message });
  }
};

// List NFT for sale
exports.listForSale = async (req, res) => {
  try {
    const { price, currency } = req.body;
    const nft = await NFT.findById(req.params.id);
    if (!nft) return res.status(404).json({ success: false, message: 'NFT not found' });
    if (nft.ownerUser.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not the owner' });
    }
    nft.price = price;
    nft.currency = currency || 'XMR';
    nft.isListed = true;
    nft.listedAt = new Date();
    await nft.save();
    res.json({ success: true, message: 'NFT listed for sale', data: nft });
  } catch (error) {
    console.error('List NFT error:', error);
    res.status(500).json({ success: false, message: 'Error listing NFT', error: error.message });
  }
};

// Delist NFT
exports.delist = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) return res.status(404).json({ success: false, message: 'NFT not found' });
    if (nft.ownerUser.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not the owner' });
    }
    nft.isListed = false;
    nft.price = 0;
    nft.listedAt = undefined;
    await nft.save();
    res.json({ success: true, message: 'NFT delisted', data: nft });
  } catch (error) {
    console.error('Delist NFT error:', error);
    res.status(500).json({ success: false, message: 'Error delisting NFT', error: error.message });
  }
};

// Transfer NFT
exports.transfer = async (req, res) => {
  try {
    const { toAddress, toUserId, transactionHash } = req.body;
    const nft = await NFT.findById(req.params.id);
    if (!nft) return res.status(404).json({ success: false, message: 'NFT not found' });
    if (nft.ownerUser.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not the owner' });
    }
    nft.ownerAddress = toAddress;
    nft.ownerUser = toUserId || req.userId;
    nft.isListed = false;
    nft.price = 0;
    nft.lastTransferHash = transactionHash || '';
    nft.soldAt = new Date();
    await nft.save();
    res.json({ success: true, message: 'NFT transferred', data: nft });
  } catch (error) {
    console.error('Transfer NFT error:', error);
    res.status(500).json({ success: false, message: 'Error transferring NFT', error: error.message });
  }
};

// Marketplace stats
exports.getMarketplaceStats = async (req, res) => {
  try {
    const total = await NFT.countDocuments();
    const listed = await NFT.countDocuments({ isListed: true });
    const byType = await NFT.aggregate([{ $group: { _id: '$nftType', count: { $sum: 1 } } }]);
    const avgPrice = await NFT.aggregate([
      { $match: { isListed: true, price: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$price' }, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]);
    res.json({
      success: true,
      data: {
        total,
        listed,
        byType,
        pricing: avgPrice.length > 0 ? avgPrice[0] : { avg: 0, min: 0, max: 0 }
      }
    });
  } catch (error) {
    console.error('Marketplace stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
};
