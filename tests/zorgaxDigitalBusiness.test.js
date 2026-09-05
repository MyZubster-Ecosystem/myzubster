'use strict';

const service = require('../src/services/zorgaxDigitalBusinessService');
const { PROJECT_STATUSES } = require('../src/models/ZorgaxDigitalProductProject');

function doc(values) {
  return {
    ...values,
    async save() { return this; },
    toObject() { return { ...this, save: undefined, toObject: undefined }; }
  };
}

describe('Zorgax digital business pilot service', () => {
  test('creates an advisory-only project owned by the authenticated user', async () => {
    const ProjectModel = {
      create: jest.fn(async (values) => doc({ projectId: 'zdp-1', status: PROJECT_STATUSES.IDEA, ...values }))
    };

    const result = await service.createProject({
      ProjectModel,
      ownerId: 'user-1',
      title: 'First digital product',
      description: 'A small paid guide.',
      productType: 'GUIDE'
    });

    expect(ProjectModel.create).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'user-1',
      advisoryOnly: true,
      humanApprovalRequired: true
    }));
    expect(result.status).toBe('IDEA');
  });

  test('advisory plan never guarantees commercialization or automatic execution', () => {
    const plan = service.buildAdvisoryPlan({
      projectId: 'zdp-1',
      status: 'IDEA',
      targetCustomer: '',
      customerProblem: '',
      valueProposition: ''
    });

    expect(plan.advisoryOnly).toBe(true);
    expect(plan.requiresHumanApproval).toBe(true);
    expect(plan.commercializationGuarantee).toBe(false);
    expect(plan.launchChecklist).toContain('Publication explicitly approved by owner');
  });

  test('only allows one-step forward workflow transitions', async () => {
    const item = doc({
      projectId: 'zdp-1',
      ownerId: 'user-1',
      status: PROJECT_STATUSES.IDEA
    });
    const ProjectModel = { findOne: jest.fn().mockResolvedValue(item) };

    const advanced = await service.advanceProject({
      ProjectModel,
      ownerId: 'user-1',
      projectId: 'zdp-1',
      nextStatus: 'VALIDATING'
    });
    expect(advanced.status).toBe('VALIDATING');

    await expect(service.advanceProject({
      ProjectModel,
      ownerId: 'user-1',
      projectId: 'zdp-1',
      nextStatus: 'BUILDING'
    })).rejects.toThrow('cannot advance');
  });

  test('owner scoping is always applied when loading a project', async () => {
    const ProjectModel = { findOne: jest.fn().mockResolvedValue(null) };
    await expect(service.getProject({ ProjectModel, ownerId: 'user-2', projectId: 'zdp-1' }))
      .rejects.toThrow('not found');
    expect(ProjectModel.findOne).toHaveBeenCalledWith({ ownerId: 'user-2', projectId: 'zdp-1' });
  });

  test('validates pricing as safe non-negative minor units', async () => {
    const item = doc({
      projectId: 'zdp-1',
      ownerId: 'user-1',
      validation: { assumptions: [], evidence: [], risks: [] },
      pricing: { currency: 'EUR', amountMinor: null }
    });
    const ProjectModel = { findOne: jest.fn().mockResolvedValue(item) };

    await expect(service.updateStrategy({
      ProjectModel,
      ownerId: 'user-1',
      projectId: 'zdp-1',
      pricing: { amountMinor: 12.5 }
    })).rejects.toThrow('safe non-negative integer');
  });
});
