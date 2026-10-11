const mongoose = require('mongoose');

const knowledgeClaimSchema = new mongoose.Schema({
  contributorId: {
    type: String,
    required: true,
    index: true
  },

  contributionId: {
    type: String,
    required: true,
    index: true
  },

  conceptKey: {
    type: String,
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: ['DEMONSTRATED', 'VERIFIED'],
    default: 'DEMONSTRATED'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

knowledgeClaimSchema.index(
  {
    contributionId: 1,
    conceptKey: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  'KnowledgeClaim',
  knowledgeClaimSchema
);
