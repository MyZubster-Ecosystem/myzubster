const mongoose = require('mongoose');

const moderationReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true, index: true },
  reporterUserId: { type: String, required: true, index: true },
  targetUserId: { type: String, default: null, index: true },
  contextType: { type: String, enum: ['message', 'user', 'session'], required: true },
  contextId: { type: String, required: true, index: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ['open', 'reviewed', 'escalated', 'dismissed'], default: 'open', index: true }
}, { timestamps: true });

module.exports = mongoose.models.ModerationReport || mongoose.model('ModerationReport', moderationReportSchema);
