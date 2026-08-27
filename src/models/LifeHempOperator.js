const mongoose = require('mongoose');

const LifeHempOperatorSchema = new mongoose.Schema({
  jurisdiction: { type: String, required: true, trim: true, maxlength: 160 },
  operatorName: { type: String, required: true, trim: true, maxlength: 200 },
  operatorType: { type: String, trim: true, maxlength: 120 },
  licenseAuthority: { type: String, trim: true, maxlength: 200 },
  licenseReference: { type: String, trim: true, maxlength: 200 },
  licenseValidFrom: { type: Date },
  licenseValidUntil: { type: Date },
  productCategory: { type: String, trim: true, maxlength: 160 },
  ageRestriction: { type: Number, min: 0, max: 99 },
  labAnalysisRequired: { type: Boolean, default: false },
  traceabilityReference: { type: String, trim: true, maxlength: 500 },
  status: {
    type: String,
    enum: ['UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'SUSPENDED', 'REJECTED'],
    default: 'UNVERIFIED',
    index: true
  },
  commerceEnabled: { type: Boolean, default: false },
  lastReviewedAt: { type: Date },
  reviewedBy: { type: String, trim: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LifeHempOperatorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status !== 'VERIFIED') this.commerceEnabled = false;
  next();
});

LifeHempOperatorSchema.index({ jurisdiction: 1, operatorName: 1 }, { unique: true });

module.exports = mongoose.model('LifeHempOperator', LifeHempOperatorSchema);
