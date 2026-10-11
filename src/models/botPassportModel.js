const mongoose = require('mongoose');

const botPassportSchema = new mongoose.Schema(
  {
    botId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    softwareVersion: { type: String, required: true, trim: true, maxlength: 80 },
    repositoryUrl: { type: String, default: null, maxlength: 500 },
    releaseHash: { type: String, required: true, lowercase: true, match: /^[a-f0-9]{64}$/ },
    capabilities: {
      type: [{ type: String, trim: true, maxlength: 64 }],
      default: []
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'REVOKED'],
      default: 'ACTIVE',
      index: true
    },
    revokedAt: { type: Date, default: null },
    revocationReason: { type: String, default: null, maxlength: 240 }
  },
  { timestamps: true, versionKey: false }
);

botPassportSchema.index({ ownerId: 1, createdAt: -1 });

module.exports =
  mongoose.models.BotPassport ||
  mongoose.model('BotPassport', botPassportSchema);
