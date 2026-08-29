'use strict';

const onboarding = require('../src/services/zorgaxDigitalPilotOnboardingService');

function doc(data) {
  return {
    ...data,
    async save() { return this; },
    toObject() { const { save, toObject, ...rest } = this; return rest; }
  };
}

describe('Zorgax LIFE pilot first project', () => {
  test('requires completed onboarding before project creation', async () => {
    const enrollment = doc({ enrollmentId:'zpe_1', ownerId:'owner-1', status:'ACCEPTED', consent:{accepted:true}, objective:'', weeklyCommitment:'', preferredProductType:'GUIDE', firstProjectId:null });
    const EnrollmentModel = { findOne: jest.fn().mockResolvedValue(enrollment) };
    const businessService = { createProject: jest.fn() };
    await expect(onboarding.startFirstProject({ EnrollmentModel, ProjectModel:{}, businessService, ownerId:'owner-1', title:'First product', description:'Pilot product', productType:'GUIDE' })).rejects.toThrow('onboarding must be completed');
    expect(businessService.createProject).not.toHaveBeenCalled();
  });

  test('creates one owner-scoped project and links it to enrollment', async () => {
    const enrollment = doc({ enrollmentId:'zpe_1', ownerId:'owner-1', status:'ACTIVE', consent:{accepted:true}, objective:'Publish one real product', weeklyCommitment:'3 hours', preferredProductType:'GUIDE', firstProjectId:null });
    const EnrollmentModel = { findOne: jest.fn().mockResolvedValue(enrollment) };
    const businessService = {
      createProject: jest.fn().mockResolvedValue({ projectId:'zdp_1', ownerId:'owner-1', title:'First product' }),
      getProject: jest.fn(),
      publicProject: jest.fn((item) => item)
    };
    const result = await onboarding.startFirstProject({ EnrollmentModel, ProjectModel:{}, businessService, ownerId:'owner-1', title:'First product', description:'Pilot product', productType:'GUIDE' });
    expect(result.replay).toBe(false);
    expect(result.enrollment.firstProjectId).toBe('zdp_1');
    expect(businessService.createProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId:'owner-1', title:'First product', metadata:expect.objectContaining({ pilotProgram:'LIFE', pilotEnrollmentId:'zpe_1', createdFromPilotOnboarding:true }) }));
  });

  test('replays linked first project instead of creating a duplicate', async () => {
    const enrollment = doc({ enrollmentId:'zpe_1', ownerId:'owner-1', status:'ACTIVE', consent:{accepted:true}, objective:'Publish one real product', weeklyCommitment:'3 hours', preferredProductType:'GUIDE', firstProjectId:'zdp_1' });
    const EnrollmentModel = { findOne: jest.fn().mockResolvedValue(enrollment) };
    const existing = { projectId:'zdp_1', ownerId:'owner-1' };
    const businessService = { createProject: jest.fn(), getProject: jest.fn().mockResolvedValue(existing), publicProject: jest.fn((item)=>item) };
    const result = await onboarding.startFirstProject({ EnrollmentModel, ProjectModel:{}, businessService, ownerId:'owner-1', title:'Ignored', description:'Ignored', productType:'GUIDE' });
    expect(result.replay).toBe(true);
    expect(result.project.projectId).toBe('zdp_1');
    expect(businessService.createProject).not.toHaveBeenCalled();
    expect(businessService.getProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId:'owner-1', projectId:'zdp_1' }));
  });
});
