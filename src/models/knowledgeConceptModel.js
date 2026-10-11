const mongoose = require('mongoose');

const knowledgeConceptSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  label: {
    type: String,
    required: true
  },

  category: {
    type: String,
    default: null
  },

  description: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  'KnowledgeConcept',
  knowledgeConceptSchema
);
