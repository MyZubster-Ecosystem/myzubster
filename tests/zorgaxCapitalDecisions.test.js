'use strict';

const {
  ALLOCATION_STATUSES
} = require('../src/models/ZorgaxCapitalAllocation');
const service = require('../src/services/zorgaxCapitalDecisionService');

function createFakeModel() {
  const rows = [];
  let sequence = 0;

  function wrap(data) {
    return {
      ...data,
      async save() { return this; },
      toObject() {
        const { save, toObject, ...plain } = this;
        return plain;
      }
    };
  }

  return {
    rows,
    async findOne(query) {
      return rows.find((row) => Object.entries(query).every(([key, value]) => row[key] === value)) || null;
    },
    async create(data) {
      const row = wrap({
        allocationId: `zca-test-${++sequence}`,
        status: ALLOCATION_STATUSES.PROPOSED,
        ...data
      });
      rows.push(row);
      return row;
    },
    find(query) {
      const filtered = rows.filter((row) => Object.entries(query).every(([key, value]) => row[key] === value));
      return {
        sort() {
          return {
            limit(limit) {
              return {
                async lean() {
                  return filtered.slice(0, limit).map((row) => row.toObject());
                }
              };
            }
          };
        }
      };
    }
  };
}

const scores = {
  financialReturn: 70,
  ecosystemGrowth: 80,
  userGrowth: 60,
  developerGrowth: 75,
  infrastructureValue: 90,
  strategicValue: 90,
  environmentalImpact: 30,
  risk: 20,
  liquidityCost: 15
};

async function seedProposal(model) {
  const saved = await service.recordRecommendations({
    AllocationModel: model,
    ownerId: 'myzubster-ecosystem',
    cycleReference: '2026-08',
    asset: 'BTC',
    network: 'mainnet',
    recommendations: [{
      id: 'zorgax-infrastructure',
      category: 'INFRASTRUCTURE',
      title: 'Zorgax infrastructure',
      rationale: 'Improve capacity.',
      amountMinor: 50000,
      availableCapitalMinor: 100000,
      opportunityScore: 80,
      scores
    }]
  });
  return saved[0];
}

describe('Zorgax capital decision memory', () => {
  test('records a recommendation once per cycle and opportunity', async () => {
    const model = createFakeModel();
    await seedProposal(model);
    await seedProposal(model);
    expect(model.rows).toHaveLength(1);
    expect(model.rows[0].advisoryOnly).toBe(true);
  });

  test('requires explicit approval before spend can be recorded', async () => {
    const model = createFakeModel();
    const proposal = await seedProposal(model);
    await expect(service.recordSpend({
      AllocationModel: model,
      ownerId: 'myzubster-ecosystem',
      allocationId: proposal.allocationId,
      spentMinor: 30000,
      spendReference: 'invoice-1'
    })).rejects.toThrow(/cannot record spend from PROPOSED/);
  });

  test('moves proposal through approved and funded without executing payment', async () => {
    const model = createFakeModel();
    const proposal = await seedProposal(model);
    const approved = await service.approveAllocation({
      AllocationModel: model,
      ownerId: 'myzubster-ecosystem',
      allocationId: proposal.allocationId,
      approvedBy: 'admin-1'
    });
    expect(approved.status).toBe(ALLOCATION_STATUSES.APPROVED);
    expect(approved.approvedBy).toBe('admin-1');

    const funded = await service.recordSpend({
      AllocationModel: model,
      ownerId: 'myzubster-ecosystem',
      allocationId: proposal.allocationId,
      spentMinor: 30000,
      spendReference: 'invoice-1'
    });
    expect(funded.status).toBe(ALLOCATION_STATUSES.FUNDED);
    expect(funded.spentMinor).toBe(30000);
  });

  test('refuses to record spend above the approved recommendation', async () => {
    const model = createFakeModel();
    const proposal = await seedProposal(model);
    await service.approveAllocation({
      AllocationModel: model,
      ownerId: 'myzubster-ecosystem',
      allocationId: proposal.allocationId,
      approvedBy: 'admin-1'
    });
    await expect(service.recordSpend({
      AllocationModel: model,
      ownerId: 'myzubster-ecosystem',
      allocationId: proposal.allocationId,
      spentMinor: 50001,
      spendReference: 'invoice-2'
    })).rejects.toThrow(/cannot exceed/);
  });

  test('records measured outcome and realized return', async () => {
    const model = createFakeModel();
    const proposal = await seedProposal(model);
    await service.approveAllocation({
      AllocationModel: model,
      ownerId: 'myzubster-ecosystem',
      allocationId: proposal.allocationId,
      approvedBy: 'admin-1'
    });
    await service.recordSpend({
      AllocationModel: model,
      ownerId: 'myzubster-ecosystem',
      allocationId: proposal.allocationId,
      spentMinor: 30000,
      spendReference: 'invoice-3'
    });
    const completed = await service.recordOutcome({
      AllocationModel: model,
      ownerId: 'myzubster-ecosystem',
      allocationId: proposal.allocationId,
      measuredReturnMinor: 36000,
      outcome: 'Reduced inference cost and increased capacity.',
      outcomeMetrics: { unitCostReductionBps: 1200 }
    });
    expect(completed.status).toBe(ALLOCATION_STATUSES.COMPLETED);
    expect(completed.realizedReturnBps).toBe(2000);
    expect(completed.outcomeMetrics.unitCostReductionBps).toBe(1200);
  });

  test('keeps ecosystem decisions isolated from another owner', async () => {
    const model = createFakeModel();
    const proposal = await seedProposal(model);
    await expect(service.approveAllocation({
      AllocationModel: model,
      ownerId: 'another-owner',
      allocationId: proposal.allocationId,
      approvedBy: 'admin-2'
    })).rejects.toThrow(/not found/);
  });
});
