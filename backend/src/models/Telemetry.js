const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema(
  {
    robotId: { type: String, required: true, trim: true, index: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    battery: { type: Number, required: true },
    cpuTemperature: { type: Number, default: null },
    signalStrength: { type: Number, default: null },
    status: { type: String, default: 'idle', trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
    source: { type: String, default: 'api', trim: true },
  },
  { timestamps: true }
);

telemetrySchema.index({ robotId: 1, timestamp: -1 });

module.exports = mongoose.models.Telemetry || mongoose.model('Telemetry', telemetrySchema);
