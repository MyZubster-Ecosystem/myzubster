const mongoose = require('mongoose');

const culturalContributorAttestationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dialogueId: { type: String, required: true, trim: true, index: true },
  statementVersion: { type: String, required: true, default: '1' },
  statement: { type: String, required: true },
  acknowledgedBoundaries: {
    individualCapacityOnly: { type: Boolean, required: true },
    noCollectiveRepresentation: { type: Boolean, required: true },
    noCollectiveEndorsement: { type: Boolean, required: true }
  },
  attestedAt: { type: Date, default: Date.now, immutable: true }
}, { timestamps: true });

culturalContributorAttestationSchema.index({ userId: 1, dialogueId: 1 }, { unique: true });

module.exports = mongoose.model('CulturalContributorAttestation', culturalContributorAttestationSchema);
