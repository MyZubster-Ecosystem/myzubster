const mongoose = require('mongoose');

// Garden Activity Feed model (#92)
// Activity types are fixed to the four required by the issue:
//   plant_added | plant_updated | harvest | comment
const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['plant_added', 'plant_updated', 'harvest', 'comment'],
    required: true
  },
  actor: {
    name: { type: String, required: true },
    avatarColor: { type: String, default: '#10b981' }
  },
  garden: { type: String, required: true },
  plantType: {
    type: String,
    enum: ['tree', 'shrub', 'herb', 'vine', 'succulent', 'aquatic', 'other'],
    default: 'other'
  },
  plantName: { type: String },
  message: { type: String },
  timestamp: { type: Date, default: Date.now }
});

ActivitySchema.index({ timestamp: -1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ garden: 1 });
ActivitySchema.index({ plantType: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);
