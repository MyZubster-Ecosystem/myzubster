const mongoose = require('mongoose');

const ahpTraceEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  pilotId: { type: String, required: true, index: true },
  productLotId: { type: String, default: null, index: true },
  eventType: { type: String, required: true, index: true },
  eventHash: { type: String, required: true, unique: true },
  sequence: { type: Number, required: true },
  event: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
}, { timestamps: true, versionKey: false });

ahpTraceEventSchema.index({ pilotId: 1, sequence: 1 }, { unique: true });

module.exports = mongoose.models.AhpTraceEvent || mongoose.model('AhpTraceEvent', ahpTraceEventSchema);
