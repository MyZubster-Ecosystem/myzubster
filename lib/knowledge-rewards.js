'use strict';

const crypto = require('crypto');

const STATUS = Object.freeze({
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REWARD_ELIGIBLE: 'REWARD_ELIGIBLE',
  REWARDED: 'REWARDED',
});

const DEFAULT_POLICY = Object.freeze({
  reputationPoints: 10,
  myzAmount: 1,
  maxMyzPerContribution: 5,
  maxMyzPerUserPerPeriod: 25,
});

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function createContribution({ authorId, type, title, description = '', reference = null, pilotId = null, category = null }) {
  if (!authorId || !type || !title) throw new Error('authorId, type and title are required');
  return {
    id: id('knowledge'), authorId, type, title, description, reference, pilotId, category,
    status: STATUS.PENDING_REVIEW,
    createdAt: new Date().toISOString(),
  };
}

function reviewContribution(contribution, { reviewerId, decision, notes = '', evidence = null }) {
  if (!contribution || contribution.status !== STATUS.PENDING_REVIEW) throw new Error('Contribution is not pending review');
  if (!reviewerId) throw new Error('reviewerId is required');
  if (reviewerId === contribution.authorId) throw new Error('Self-approval is not allowed');
  if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error('decision must be APPROVE or REJECT');

  const review = {
    id: id('review'), contributionId: contribution.id, reviewerId, decision, notes, evidence,
    reviewedAt: new Date().toISOString(),
  };
  return {
    contribution: { ...contribution, status: decision === 'APPROVE' ? STATUS.APPROVED : STATUS.REJECTED },
    review,
  };
}

function markRewardEligible(contribution) {
  if (!contribution || contribution.status !== STATUS.APPROVED) throw new Error('Only approved contributions can become reward eligible');
  return { ...contribution, status: STATUS.REWARD_ELIGIBLE };
}

function createReward(contribution, { approvedBy, existingReward = null, periodMyzTotal = 0, policy = {} }) {
  const p = { ...DEFAULT_POLICY, ...policy };
  if (!contribution || contribution.status !== STATUS.REWARD_ELIGIBLE) throw new Error('Contribution is not reward eligible');
  if (!approvedBy) throw new Error('approvedBy is required');
  if (approvedBy === contribution.authorId) throw new Error('Self-reward approval is not allowed');
  if (existingReward) throw new Error('Contribution already has a reward');
  if (!Number.isFinite(p.myzAmount) || p.myzAmount <= 0 || p.myzAmount > p.maxMyzPerContribution) throw new Error('MYZ reward exceeds contribution policy');
  if (periodMyzTotal + p.myzAmount > p.maxMyzPerUserPerPeriod) throw new Error('MYZ reward exceeds period budget');

  return {
    id: id('reward'),
    contributionId: contribution.id,
    recipientId: contribution.authorId,
    reputationPoints: p.reputationPoints,
    myzAmount: p.myzAmount,
    status: 'CLAIMABLE',
    reason: 'verified_knowledge_contribution',
    approvedBy,
    createdAt: new Date().toISOString(),
  };
}

function markRewarded(contribution, reward, ledgerReference) {
  if (!reward || reward.contributionId !== contribution.id) throw new Error('Reward does not belong to contribution');
  if (!ledgerReference) throw new Error('ledgerReference is required');
  return {
    contribution: { ...contribution, status: STATUS.REWARDED },
    reward: { ...reward, status: 'REWARDED', ledgerReference, rewardedAt: new Date().toISOString() },
  };
}

module.exports = { STATUS, DEFAULT_POLICY, createContribution, reviewContribution, markRewardEligible, createReward, markRewarded };
