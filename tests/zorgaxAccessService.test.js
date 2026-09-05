'use strict';

const {
  getAccess,
  getAccessPolicy,
  guestAccess,
  meetsPlan
} = require('../src/services/zorgaxAccessService');

const noSponsor = jest.fn().mockResolvedValue(null);

describe('Zorgax unified access service', () => {
  test('selects a legacy subscription when it outranks the entitlement', async () => {
    const access = await getAccess('user-1', {
      subscriptionAccessFn: jest.fn().mockResolvedValue({
        plan: 'pro',
        status: 'ACTIVE',
        expiresAt: new Date('2026-10-01T00:00:00Z')
      }),
      entitlementAccessFn: jest.fn().mockResolvedValue({
        tier: 'FREE',
        active: true,
        source: 'DEFAULT_FREE'
      }),
      sponsoredAccessFn: noSponsor
    });

    expect(access).toMatchObject({
      ownerId: 'user-1',
      plan: 'pro',
      tier: 'PRO',
      source: 'SUBSCRIPTION'
    });
  });

  test('selects a Developer entitlement over a Pro subscription', async () => {
    const access = await getAccess('user-1', {
      subscriptionAccessFn: jest.fn().mockResolvedValue({ plan: 'pro', status: 'ACTIVE' }),
      entitlementAccessFn: jest.fn().mockResolvedValue({ tier: 'DEVELOPER', active: true }),
      sponsoredAccessFn: noSponsor
    });

    expect(access.plan).toBe('developer');
    expect(access.source).toBe('ENTITLEMENT');
    expect(meetsPlan(access, 'developer')).toBe(true);
  });

  test('selects sponsored Developer pilot access without a payment source', async () => {
    const access = await getAccess('user-1', {
      subscriptionAccessFn: jest.fn().mockResolvedValue({ plan: 'free', status: 'ACTIVE' }),
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

  test('keeps a verified paid source when the other access store is unavailable', async () => {
    const access = await getAccess('user-1', {
      subscriptionAccessFn: jest.fn().mockResolvedValue({ plan: 'pro', status: 'ACTIVE' }),
      entitlementAccessFn: jest.fn().mockRejectedValue(new Error('entitlement store unavailable')),
      sponsoredAccessFn: noSponsor
    });

    expect(access.plan).toBe('pro');
    expect(access.sourcesChecked).toEqual(['SUBSCRIPTION']);
  });

  test('fails closed when no access source can be checked', async () => {
    await expect(getAccess('user-1', {
      subscriptionAccessFn: jest.fn().mockRejectedValue(new Error('subscription store unavailable')),
      entitlementAccessFn: jest.fn().mockRejectedValue(new Error('entitlement store unavailable')),
      sponsoredAccessFn: jest.fn().mockRejectedValue(new Error('sponsor store unavailable'))
    })).rejects.toThrow('subscription store unavailable');
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
