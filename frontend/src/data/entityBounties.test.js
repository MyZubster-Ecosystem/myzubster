import canonicalEntities from './canonicalEntities.json';
import {
  getEntityBounties,
  getEntityBountyBundle,
  getProgramSummary
} from './entityBounties';

describe('entity bounty program', () => {
  test('creates two bounties for every canonical entity', () => {
    const all = canonicalEntities.flatMap(getEntityBounties);
    const summary = getProgramSummary(canonicalEntities);

    expect(all).toHaveLength(24);
    expect(new Set(all.map(bounty => bounty.id)).size).toBe(24);
    expect(summary).toEqual({
      entityCount: 12,
      bountyCount: 24,
      proposedMYZ: 4800,
      averageCompletion: 42
    });
  });

  test('keeps proposed MYZ separate from external settlement', () => {
    const bundle = getEntityBountyBundle(canonicalEntities[0]);

    expect(bundle.summary).toEqual({ bountyCount: 2, proposedMYZ: 400 });
    expect(bundle.policy.rewardKind).toBe('internal_accounting');
    expect(bundle.policy.automaticSettlement).toBe(false);
    expect(bundle.policy.externalPaymentPromise).toBe(false);
    expect(bundle.bounties[0].proposalUrl).toContain('/issues/new?');
  });
});
