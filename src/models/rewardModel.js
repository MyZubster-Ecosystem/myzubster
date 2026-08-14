const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  rewardId: {type: String, required: true, unique: true, index: true},
  userId: {type: String, required: true},
  rewardType: {type: String, enum: ['qa_bug','robot_bonus','referral','education','governance_vote','governance_delegation'], required: true},
  amount: {type: Number, required: true},
  currency: {type: String, default: 'MYZ'},
  status: {type: String, enum: ['pending','approved','rejected','paid'], default: 'pending'},
  metadata: {
    bugSeverity: {type: String, enum: ['normal','critical','security',null], default: null},
    jobId: {type: String, default: null},
    referralCode: {type: String, default: null},
    referredUserId: {type: String, default: null},
    contentUrl: {type: String, default: null},
    contentQuality: {type: String, enum: ['basic','intermediate','advanced',null], default: null},
    proposalId: {type: String, default: null},
    voteDirection: {type: String, default: null},
    delegationAmount: {type: Number, default: null},
    daysStaked: {type: Number, default: null}
  },
  reviewedBy: {type: String, default: null},
  paidAt: {type: Date, default: null},
  createdAt: {type: Date, default: Date.now}
});

rewardSchema.statics.calculateQA = function(severity) {
  if (severity === 'critical') return 20;
  if (severity === 'security') return 50;
  return 5;
};

rewardSchema.statics.calculateRobotBonus = function(orderAmount, completedWithinTime) {
  if (completedWithinTime) return Math.ceil(orderAmount * 0.10);
  return 0;
};

rewardSchema.statics.calculateReferral = function() { return 5; };

rewardSchema.statics.calculateEducation = function(quality) {
  if (quality === 'advanced') return 50;
  if (quality === 'intermediate') return 25;
  return 10;
};

rewardSchema.statics.calculateGovernanceVote = function() { return 2; };

rewardSchema.statics.calculateGovernanceDelegation = function(amountStaked, days) {
  return amountStaked * 0.1 * days;
};

module.exports = mongoose.model('Reward', rewardSchema);
