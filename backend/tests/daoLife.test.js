const request = require('supertest');
const app = require('../src/index');
const {
  isLifeAdvisoryIdentity,
  LIFE_DAO_POLICY,
} = require('../src/services/lifeDaoPolicy');

describe('LIFE DAO advisory governance lane', () => {
  test('publishes a non-binding LIFE governance status', async () => {
    const response = await request(app).get('/api/dao/life/status');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.governanceMode).toBe('advisory_non_binding');
    expect(response.body.data.bindingVotingPower).toBe(0);
    expect(response.body.data.enrollment).toBe('explicit-consent-only');
  });

  test('publishes consent and prohibited-scope policy', async () => {
    const response = await request(app).get('/api/dao/life/policy');

    expect(response.status).toBe(200);
    expect(response.body.data.activation.requiresExplicitConsent).toBe(true);
    expect(response.body.data.prohibitedScopes).toEqual(expect.arrayContaining([
      'treasury',
      'life_budget',
      'grant_agreement',
      'consortium_agreement',
      'legal_commitment',
    ]));
  });

  test('starts with no named public participants and exposes role slots', async () => {
    const response = await request(app).get('/api/dao/life/participants');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.roleSlots.length).toBeGreaterThanOrEqual(5);
    expect(response.body.roleSlots.every((role) => role.bindingVotingPower === 0)).toBe(true);
  });

  test('recognizes a registered LIFE advisory identity as non-binding', () => {
    const syntheticRegistry = {
      participants: [
        {
          memberId: 'life-demo-advisor',
          daoRole: 'life_advisor',
          status: 'active',
        },
      ],
    };

    expect(isLifeAdvisoryIdentity('life-demo-advisor', syntheticRegistry)).toBe(true);
    expect(isLifeAdvisoryIdentity('ordinary-member', syntheticRegistry)).toBe(false);
    expect(LIFE_DAO_POLICY.bindingVotingPower).toBe(0);
  });
});
