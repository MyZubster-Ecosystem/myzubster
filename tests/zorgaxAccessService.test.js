'use strict';

const {
  getAccess,
  getAccessPolicy,
  guestAccess,
  meetsPlan
} = require('../src/services/zorgaxAccessService');

const noSponsor = jest.fn().mockResolvedValue(null);

describe('Zorgax unified access service', () => {
  test('selects a Developer entitlement as the paid access source', async () => {
    const access = await getAccess('user-1', {
      entitlementAccessFn: jest.fn().mockResolvedValue({ tier: 'DEVELOPER', active: true }),
      sponsoredAccessFn: noSponsor
    });

    expect(access.plan).toBe('developer');
    expect(access.source).toBe('ENTITLEMENT');
    expect(meetsPlan(access, 'developer')).toBe(true);
  });

  test('selects sponsored Developer pilot access without a payment source', async () => {
    const access = await getAccess('user-1', {
      entitlementAccessFn: jest.fn().mockResolvedValue({ tier: 'FREE', active: true }),
      sponsoredAccessFn: jest.fn().mockResolvedValue({
        tier: 'DEVELOPER',
        active: true,
        status: 'ACTIVE',
        expiresAt: null
      })
    });

    expect(access).toMatchObject({
      ownerId: 'user-1',
      plan: 'developer',
      tier: 'DEVELOPER',
      source: 'SPONSORED_PILOT',
      expiresAt: null
    });
    expect(meetsPlan(access, 'developer')).toBe(true);
  });

  test('fails closed when no access source can be checked', async () => {
    await expect(getAccess('user-1', {
      entitlementAccessFn: jest.fn().mockRejectedValue(new Error('entitlement store unavailable')),
      sponsoredAccessFn: jest.fn().mockRejectedValue(new Error('sponsor store unavailable'))
    })).rejects.toThrow('entitlement store unavailable');
  });

  test('applies guest, Free, Pro and Developer feature limits', () => {
    expect(getAccessPolicy(guestAccess(), { authenticated: false })).toMatchObject({
      webResearch: false,
      maxWebResults: 0,
      workspace: false,
      directApi: false
    });

    expect(getAccessPolicy({ plan: 'free' })).toMatchObject({
      researchMode: 'LIMITED',
      maxWebResults: 2,
      workspace: false,
      directApi: false
    });

    expect(getAccessPolicy({ plan: 'pro' })).toMatchObject({
      maxWebResults: 5,
      workspace: true,
      directApi: false
    });

    expect(getAccessPolicy({ plan: 'developer' })).toMatchObject({
      maxWebResults: 8,
      workspace: true,
      directApi: true
    });
  });
});
