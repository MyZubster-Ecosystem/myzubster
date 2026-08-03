const mongoose = require('mongoose');

const NFTSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  contractAddress: {
    type: String,
    required: true,
    trim: true
  },
  ownerAddress: {
    type: String,
    required: true,
    trim: true
  },
  ownerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  nftType: {
    type: String,
    enum: ['garden', 'plant', 'harvest'],
    required: true
  },
  gardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden'
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    trim: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attributes: [{
    traitType: String,
    value: String
  }],
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'XMR'
  },
  isListed: {
    type: Boolean,
    default: false
  },
  transactionHash: {
    type: String,
    trim: true
  },
  mintedAt: {
    type: Date,
    default: Date.now
  },
  listedAt: {
    type: Date
  },
  soldAt: {
    type: Date
  },
  lastTransferHash: {
    type: String,
    trim: true
  }
}, { timestamps: true });

NFTSchema.index({ ownerUser: 1 });
NFTSchema.index({ nftType: 1 });
NFTSchema.index({ isListed: 1, price: 1 });
NFTSchema.index({ tokenId: 1, contractAddress: 1 });

module.exports = mongoose.model('NFT', NFTSchema);
