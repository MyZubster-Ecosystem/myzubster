'use strict';

const mongoose = require('mongoose');

const moneroPreparedSubmissionSchema = new mongoose.Schema({
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  attemptId: { type: String, required: true, index: true },
  network: { type: String, required: true, enum: ['stagenet'] },
  recipient: { type: String, required: true },
  amountAtomic: { type: String, required: true },
  txId: { type: String, required: true, index: true },
  txMetadata: { type: String, default: null },
  proofMessage: { type: String, default: null },
  proofSignature: { type: String, default: null },
  state: { type: String, required: true, enum: ['PREPARED', 'RELAYED'], default: 'PREPARED', index: true },
  relayedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.models.MoneroPreparedSubmission
  || mongoose.model('MoneroPreparedSubmission', moneroPreparedSubmissionSchema);
