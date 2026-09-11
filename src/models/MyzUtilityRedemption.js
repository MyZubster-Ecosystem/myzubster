'use strict';

const mongoose = require('mongoose');

const MyzUtilityRedemptionSchema = new mongoose.Schema({
  idempotencyKey: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 180 },
  accountId: { type: String, required: true, index: true, trim: true, maxlength: 180 },
  offerId: { type: String, required: true, index: true, trim: true, maxlength: 120 },
  offerName: { type: String, required: true, trim: true, maxlength: 180 },
  amountMyz: { type: Number, required: true, min: 0.000001 },
  entryType: { type: String, enum: ['ADJUSTMENT_DEBIT'], default: 'ADJUSTMENT_DEBIT' },
  state: { type: String, enum: ['RECORDED'], default: 'RECORDED', index: true },
  fulfillmentState: { type: String, enum: ['PENDING','FULFILLED','CANCELLED'], default: 'PENDING', index: true },
  fulfillmentReference: { type: String, trim: true, maxlength: 320 },
  fulfilledAt: { type: Date, index: true },
  sourceReference: { type: String, required: true, trim: true, maxlength: 320 },
  recordedAt: { type: Date, required: true, default: Date.now, index: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.MyzUtilityRedemption || mongoose.model('MyzUtilityRedemption', MyzUtilityRedemptionSchema);
