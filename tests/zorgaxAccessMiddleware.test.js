'use strict';

const {
  createZorgaxAccessMiddleware
} = require('../src/middleware/zorgaxAccess');

function responseDouble() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

describe('Zorgax access middleware', () => {
  test('returns 402 when Free access requests a Pro workspace', async () => {
    const getAccessFn = jest.fn().mockResolvedValue({
      plan: 'free',
      tier: 'FREE',
      status: 'ACTIVE',
      active: true
    });
    const { requireZorgaxPlan } = createZorgaxAccessMiddleware({ getAccessFn });
    const response = responseDouble();
    const next = jest.fn();

    await requireZorgaxPlan('pro')({ userId: 'user-1' }, response, next);

    expect(response.statusCode).toBe(402);
    expect(response.body.requiredPlan).toBe('pro');
    expect(next).not.toHaveBeenCalled();
  });

  test('allows Developer access through Pro and Developer gates', async () => {
    const getAccessFn = jest.fn().mockResolvedValue({
      plan: 'developer',
      tier: 'DEVELOPER',
      status: 'ACTIVE',
      active: true
    });
    const { requireZorgaxPlan } = createZorgaxAccessMiddleware({ getAccessFn });

    for (const requiredPlan of ['pro', 'developer']) {
      const response = responseDouble();
      const next = jest.fn();
      await requireZorgaxPlan(requiredPlan)({ userId: 'user-1' }, response, next);
      expect(response.statusCode).toBe(200);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });

  test('loads guest policy without querying private access stores', async () => {
    const getAccessFn = jest.fn();
    const { loadZorgaxAccess } = createZorgaxAccessMiddleware({ getAccessFn });
    const request = {};
    const response = responseDouble();
    const next = jest.fn();

    await loadZorgaxAccess(request, response, next);

    expect(getAccessFn).not.toHaveBeenCalled();
    expect(request.zorgaxPolicy.webResearch).toBe(false);
    expect(request.zorgaxPolicy.maxWebResults).toBe(0);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

