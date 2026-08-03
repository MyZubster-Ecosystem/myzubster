const mongoose = require('mongoose');

const PollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  votes: { type: Number, default: 0 }
}, { _id: true });

const VotingPollSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  topic: {
    type: String,
    enum: ['roadmap', 'funding', 'governance', 'features', 'general'],
    default: 'general'
  },
  votingType: {
    type: String,
    enum: ['simple', 'weighted', 'quadratic'],
    default: 'simple'
  },
  options: [PollOptionSchema],
  endDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  totalVoters: { type: Number, default: 0 },
  results: { type: Map, of: Number, default: {} }
}, { timestamps: true });

VotingPollSchema.index({ status: 1, endDate: 1 });
VotingPollSchema.index({ topic: 1 });
VotingPollSchema.index({ createdBy: 1 });

module.exports = mongoose.model('VotingPoll', VotingPollSchema);
