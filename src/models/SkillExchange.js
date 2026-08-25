const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicantId: { type: String, required: true },
  message: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  reviewerId: { type: String, required: true },
  revieweeId: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true });

const skillExchangeSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  participantId: { type: String, default: null, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  offeredSkill: { type: String, required: true, trim: true, maxlength: 120, index: true },
  requestedSkill: { type: String, required: true, trim: true, maxlength: 120, index: true },
  mode: { type: String, enum: ['remote', 'local', 'hybrid'], default: 'remote' },
  location: { type: String, trim: true, maxlength: 160, default: '' },
  status: { type: String, enum: ['open', 'matched', 'active', 'completed', 'cancelled'], default: 'open', index: true },
  applications: [applicationSchema],
  startConfirmedBy: [{ type: String }],
  completionConfirmedBy: [{ type: String }],
  reviews: [reviewSchema],
}, { timestamps: true });

module.exports = mongoose.models.SkillExchange || mongoose.model('SkillExchange', skillExchangeSchema);
