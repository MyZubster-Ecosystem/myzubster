const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: 'VotingPoll', required: true },
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  optionIndex: { type: Number, required: true },
  weight: { type: Number, default: 1 },
  votedAt: { type: Date, default: Date.now }
});

VoteSchema.index({ pollId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
