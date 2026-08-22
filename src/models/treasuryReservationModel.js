'use strict';

const mongoose = require('mongoose');

const treasuryReservationSchema = new mongoose.Schema({
  reservationId: { type: String, required: true, unique: true, index: true, trim: true },
  accountKey: { type: String, required: true, index: true, trim: true },
  amountAtomic: { type: mongoose.Schema.Types.Decimal128, required: true },
  state: { type: String, enum: ['RESERVED', 'SETTLED', 'RELEASED'], required: true, default: 'RESERVED', index: true },
  reference: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

treasuryReservationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.TreasuryReservation || mongoose.model('TreasuryReservation', treasuryReservationSchema);
