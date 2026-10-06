'use strict';

const service = require('../src/services/zorgaxDigitalPilotOnboardingService');

function doc(data) { return { ...data, async save(){ return this; }, toObject(){ return { ...this, save: undefined, toObject: undefined }; } }; }

describe('Zorgax LIFE pilot onboarding', () => {
  test('requires explicit acceptance before onboarding', async () => {
    const enrollment = doc({ ownerId:'owner-1', status:'INVITED', consent:{accepted:false}, objective:'', weeklyCommitment:'', preferredProductType:'' });
    const EnrollmentModel = { findOne: jest.fn().mockResolvedValue(enrollment) };
    await expect(service.updateOnboarding({ EnrollmentModel, ownerId:'owner-1', objective:'Publish a first digital product' })).rejects.toThrow('pilot acceptance is required');
  });

  test('records explicit acceptance without personal contact data', async () => {
    const enrollment = doc({ enrollmentId:'zpe_1', ownerId:'owner-1', status:'INVITED', consent:{accepted:false,acceptedAt:null,version:null}, objective:'', weeklyCommitment:'', preferredProductType:'' });
    const EnrollmentModel = { findOne: jest.fn().mockResolvedValue(enrollment) };
    const result = await service.acceptInvitation({ EnrollmentModel, ownerId:'owner-1', accepted:true, now:new Date('2026-08-29T12:00:00Z') });
    expect(result.status).toBe('ACCEPTED');
    expect(result.consent.accepted).toBe(true);
    expect(result.consent.version).toBe(service.CONSENT_VERSION);
    expect(result.email).toBeUndefined();
    expect(result.address).toBeUndefined();
  });

  test('first session becomes ready after objective and commitment', () => {
    const session = service.buildFirstSession({ enrollmentId:'zpe_1', status:'ACTIVE', consent:{accepted:true}, objective:'Launch one real product', weeklyCommitment:'3 hours', preferredProductType:'' });
    expect(session.readyForFirstProduct).toBe(true);
    expect(session.advisoryOnly).toBe(true);
    expect(session.externalExecutionPerformed).toBe(false);
    expect(session.predictsProfit).toBe(false);
  });
});
