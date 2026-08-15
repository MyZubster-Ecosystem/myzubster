const mongoose = require('mongoose');
const carbonCreditSchema = new mongoose.Schema({
  creditId: {type: String, required: true, unique: true, index: true},
  userId: {type: String, required: true},
  organization: {type: String, default: null},
  creditType: {type: String, enum: ['recycling','renewable_energy','carbon_offset','green_infrastructure','waste_reduction'], required: true},
  amount: {type: Number, required: true},
  unit: {type: String, default: 'kgCO2e'},
  verificationStatus: {type: String, enum: ['pending','verified','rejected'], default: 'pending'},
  verifiedBy: {type: String, default: null},
  evidence: {type: String, default: null},
  esgReport: {type: String, default: null},
  status: {type: String, enum: ['active','traded','retired'], default: 'active'},
  tradedTo: {type: String, default: null},
  retiredAt: {type: Date, default: null},
  createdAt: {type: Date, default: Date.now},
  verifiedAt: {type: Date, default: null}
});
carbonCreditSchema.statics.getTotalCredits = function(userId) { return this.aggregate([{$match: {userId, status: 'active', verificationStatus: 'verified'}}, {$group: {_id: null, total: {$sum: '$amount'}}}]); };
module.exports = mongoose.model('CarbonCredit', carbonCreditSchema);
