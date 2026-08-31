'use strict';

const {
  DECISION_CONTEXT_VERSION,
  canonicalize,
  getAllocationProvenance,
  hashDecisionContext,
  recordRecommendations
} = require('../src/services/zorgaxCapitalDecisionService');

function recommendation() {
  return {
    id: 'security-hardening',
    category: 'SECURITY',
    title: 'Security hardening',
    rationale: 'Reduce ecosystem risk.',
    amountMinor: 25000,
    availableCapitalMinor: 50000,
    opportunityScore: 72.5,
    scores: {
      financialReturn: 50,
      ecosystemGrowth: 70,
      userGrowth: 50,
      developerGrowth: 60,
      infrastructureValue: 80,
      strategicValue: 90,
      environmentalImpact: 20,
      risk: 20,
      liquidityCost: 10
    }
  };
}

function context(overrides = {}) {
  return {
    generatedAt: '2026-08-29T16:00:00.000Z',
    accountingSnapshot: {
      asset: 'BTC',
      network: 'mainnet',
      recognizedRevenueMinor: 100000,
      recognizedExpensesMinor: 20000,
      recognizedProfitMinor: 80000,
      outstandingLiabilitiesMinor: 10000,
      treasuryBalanceMinor: 80000,
      reserveMinor: 20000,
      investableCapitalMinor: 50000,
      accountingBasis: 'zorgax_economic_ledger_v1'
    },
    capital: {
      availableCapitalMinor: 50000,
      deployableCapitalMinor: 25000
    },
    policy: {
      reserveMinor: 20000,
      maxAllocationBps: 5000
    },
    learning: {
      completedAllocationCount: 2
    },
    controls: {
      advisoryOnly: true,
      requiresHumanApproval: true,
      executionEnabled: false
    },
    ...overrides
  };
}

function allocationModel() {
  const rows = [];
  return {
    rows,
    findOne: jest.fn(async (filter) => rows.find((row) =>
      (!filter.ownerId || row.ownerId === filter.ownerId) &&
      (!filter.cycleReference || row.cycleReference === filter.cycleReference) &&
      (!filter.opportunityId || row.opportunityId === filter.opportunityId) &&
      (!filter.allocationId || row.allocationId === filter.allocationId)
    ) || null),
    create: jest.fn(async (doc) => {
      const row = { allocationId: `zca-${rows.length + 1}`, status: 'PROPOSED', ...doc };
      rows.push(row);
      return row;
    })
  };
}

describe('Zorgax Capital Decision Provenance', () => {
  test('hash is deterministic regardless of object key order', () => {
    const first = { b: 2, a: { d: 4, c: 3 } };
    const second = { a: { c: 3, d: 4 }, b: 2 };

    expect(canonicalize(first)).toEqual(canonicalize(second));
    expect(hashDecisionContext(first)).toBe(hashDecisionContext(second));
    expect(hashDecisionContext(first)).toMatch(/^[a-f0-9]{64}$/);
  });

  test('stores immutable decision context metadata with each recommendation', async () => {
    const AllocationModel = allocationModel();
    const decisionContext = context();

    const saved = await recordRecommendations({
      AllocationModel,
      ownerId: 'myzubster-ecosystem',
      cycleReference: '2026-08',
      asset: 'BTC',
      network: 'mainnet',
      recommendations: [recommendation()],
      decisionContext
    });

    expect(saved).toHaveLength(1);
    expect(saved[0].decisionContextVersion).toBe(DECISION_CONTEXT_VERSION);
    expect(saved[0].decisionContext.accountingSnapshot.investableCapitalMinor).toBe(50000);
    expect(saved[0].decisionContextHash).toBe(hashDecisionContext(decisionContext));
  });

  test('replay with the same decision context remains idempotent', async () => {
    const AllocationModel = allocationModel();
    const decisionContext = context();
    const args = {
      AllocationModel,
      ownerId: 'myzubster-ecosystem',
      cycleReference: '2026-08',
      asset: 'BTC',
      network: 'mainnet',
      recommendations: [recommendation()],
      decisionContext
    };

    const first = await recordRecommendations(args);
    const second = await recordRecommendations(args);

    expect(first[0].allocationId).toBe(second[0].allocationId);
    expect(AllocationModel.create).toHaveBeenCalledTimes(1);
  });

  test('rejects reuse of the same cycle and opportunity with different provenance', async () => {
    const AllocationModel = allocationModel();
    const baseArgs = {
      AllocationModel,
      ownerId: 'myzubster-ecosystem',
      cycleReference: '2026-08',
      asset: 'BTC',
      network: 'mainnet',
      recommendations: [recommendation()]
    };

    await recordRecommendations({ ...baseArgs, decisionContext: context() });

    await expect(recordRecommendations({
      ...baseArgs,
      decisionContext: context({
        accountingSnapshot: {
          ...context().accountingSnapshot,
          investableCapitalMinor: 40000
        }
      })
    })).rejects.toThrow(/different decision provenance/);
  });

  test('exposes the original snapshot and hash for audit', async () => {
    const AllocationModel = allocationModel();
    const decisionContext = context();

    const saved = await recordRecommendations({
      AllocationModel,
      ownerId: 'myzubster-ecosystem',
      cycleReference: '2026-08',
      asset: 'BTC',
      network: 'mainnet',
      recommendations: [recommendation()],
      decisionContext
    });

    const provenance = await getAllocationProvenance({
      AllocationModel,
      ownerId: 'myzubster-ecosystem',
      allocationId: saved[0].allocationId
    });

    expect(provenance.provenanceAvailable).toBe(true);
    expect(provenance.decisionContextVersion).toBe(DECISION_CONTEXT_VERSION);
    expect(provenance.decisionContextHash).toBe(hashDecisionContext(decisionContext));
    expect(provenance.decisionContext.accountingSnapshot.recognizedProfitMinor).toBe(80000);
  });
});
