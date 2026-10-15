'use strict';

const mongoose = require('mongoose');

const federationReplayNonceSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
    immutable: true
  },
  nonce: {
    type: String,
    required: true,
    immutable: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  versionKey: false
});

federationReplayNonceSchema.index(
  { nodeId: 1, nonce: 1 },
  { unique: true }
);

federationReplayNonceSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.models.FederationReplayNonce
  || mongoose.model(
    'FederationReplayNonce',
    federationReplayNonceSchema
  );
