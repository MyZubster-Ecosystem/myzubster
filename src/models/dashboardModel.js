const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  userId: {type: String, required: true, unique: true, index: true},
  balanceMYZ: {type: Number, default: 0},
  balanceXMR: {type: Number, default: 0},
  robotId: {type: String, default: null, index: true},
  totalEarnings: {type: Number, default: 0},
  jobsCompleted: {type: Number, default: 0},
  transactions: [{
    txId: {type: String, required: true},
    type: {type: String, enum: ['earn','spend','transfer_in','transfer_out','purchase','webhook','refund'], required: true},
    amount: {type: Number, required: true},
    currency: {type: String, default: 'MYZ'},
    counterparty: {type: String, default: null},
    description: {type: String, default: ''},
    status: {type: String, enum: ['pending','confirmed','failed'], default: 'pending'},
    timestamp: {type: Date, default: Date.now}
  }],
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});

dashboardSchema.methods.addTransaction = function(type, amount, currency, counterparty, description) {
  this.transactions.push({txId: Date.now().toString(36) + Math.random().toString(36).slice(2,8), type, amount, currency, counterparty, description, status: 'confirmed'});
  if (type === 'earn' || type === 'transfer_in' || type === 'webhook') {
    if (currency === 'MYZ') this.balanceMYZ += amount;
    else if (currency === 'XMR') this.balanceXMR += amount;
  } else if (type === 'spend' || type === 'transfer_out' || type === 'purchase') {
    if (currency === 'MYZ') this.balanceMYZ -= amount;
    else if (currency === 'XMR') this.balanceXMR -= amount;
  }
  this.updatedAt = Date.now();
  return this;
};

dashboardSchema.statics.getOrCreate = async function(userId) {
  let d = await this.findOne({userId});
  if (!d) { d = new this({userId}); await d.save(); }
  return d;
};

module.exports = mongoose.model('Dashboard', dashboardSchema);
