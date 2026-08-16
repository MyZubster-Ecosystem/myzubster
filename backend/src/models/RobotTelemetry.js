const mongoose = require('mongoose');

/**
 * RobotTelemetry — persisted telemetry sample from a robot (Poppy or Eva Ioni).
 * Stored whenever the Space Station reads telemetry; consumers can query the
 * history to distinguish simulated vs real sources and build dashboards.
 */
const RobotTelemetrySchema = new mongoose.Schema(
  {
    robot: { type: String, required: true, index: true },
    source: { type: String, enum: ['poppy', 'eva-ioni-simulated'], required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    motors: { type: mongoose.Schema.Types.Mixed, default: {} },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RobotTelemetry || mongoose.model('RobotTelemetry', RobotTelemetrySchema);
