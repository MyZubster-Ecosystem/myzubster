const {
  STATUS,
  createContribution,
  reviewContribution,
  markRewardEligible,
  createReward,
  markRewarded,
} = require('../lib/knowledge-rewards');

describe('Knowledge-to-MYZ MVP', () => {
  const draft = () => createContribution({
    authorId: 'nicola',
    type: 'procedure',
    title: 'Kefir procedure observation',
    pilotId: 'KF-006',
  });

  test('new knowledge never pays automatically', () => {
    const c = draft();
    expect(c.status).toBe(STATUS.PENDING_REVIEW);
    expect(c.myzAmount).toBeUndefined();
  });

  test('author cannot approve own contribution', () => {
    expect(() => reviewContribution(draft(), { reviewerId: 'nicola', decision: 'APPROVE' })).toThrow(/Self-approval/);
  });

  test('rejected knowledge cannot become reward eligible', () => {
    const { contribution } = reviewContribution(draft(), { reviewerId: 'reviewer-1', decision: 'REJECT' });
    expect(() => markRewardEligible(contribution)).toThrow(/Only approved/);
  });

  test('approved contribution can produce one claimable bounded reward', () => {
    const { contribution } = reviewContribution(draft(), { reviewerId: 'reviewer-1', decision: 'APPROVE' });
    const eligible = markRewardEligible(contribution);
    const reward = createReward(eligible, { approvedBy: 'reviewer-2' });
    expect(reward.recipientId).toBe('nicola');
    expect(reward.myzAmount).toBe(1);
    expect(reward.status).toBe('CLAIMABLE');
    expect(() => createReward(eligible, { approvedBy: 'reviewer-2', existingReward: reward })).toThrow(/already has a reward/);
  });

  test('period budget prevents oversized cumulative rewards', () => {
    const { contribution } = reviewContribution(draft(), { reviewerId: 'reviewer-1', decision: 'APPROVE' });
    const eligible = markRewardEligible(contribution);
    expect(() => createReward(eligible, { approvedBy: 'reviewer-2', periodMyzTotal: 25 })).toThrow(/period budget/);
  });

  test('ledger reference is required before final rewarded state', () => {
    const { contribution } = reviewContribution(draft(), { reviewerId: 'reviewer-1', decision: 'APPROVE' });
    const eligible = markRewardEligible(contribution);
    const reward = createReward(eligible, { approvedBy: 'reviewer-2' });
    expect(() => markRewarded(eligible, reward)).toThrow(/ledgerReference/);
    const result = markRewarded(eligible, reward, 'myz-ledger:test:1');
    expect(result.contribution.status).toBe(STATUS.REWARDED);
    expect(result.reward.status).toBe('REWARDED');
  });
});
