const mongoose = require('mongoose');

const nftAssetSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true, index: true },
  type: {
    type: String,
    required: true,
    enum: ['character', 'comic', 'item', 'badge']
  },
  creatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ownerWallet: { type: String, default: null, index: true },
  chainId: { type: Number, default: null },
  contractAddress: { type: String, default: null },
  tokenId: { type: String, default: null },
  metadataUri: { type: String, default: null },
  contentHash: { type: String, default: null },
  github: {
    repo: { type: String, default: null },
    commit: { type: String, default: null },
    path: { type: String, default: null }
  },
  edition: {
    number: { type: Number, default: null },
    supply: { type: Number, default: 1, min: 1 }
  },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: {
    type: String,
    enum: ['draft', 'mint_pending', 'minted', 'listed', 'sold', 'burned'],
    default: 'draft',
    index: true
  },
  mintTxHash: { type: String, default: null },
  mintedAt: { type: Date, default: null }
}, { timestamps: true });

nftAssetSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.NFTAsset || mongoose.model('NFTAsset', nftAssetSchema);
