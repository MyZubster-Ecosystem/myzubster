const router = require('../src/routes/publicPassportRoutes');

describe('public passport privacy hold (#1598)', () => {
  test('GET rejects anonymous requests without querying contributor data', async () => {
    const layer = router.stack.find(item => item.route && item.route.path === '/:contributorId');
    expect(layer).toBeDefined();
    const handler = layer.route.stack.find(item => item.method === 'get').handle;
    const headers = {};
    const res = {
      set: jest.fn((key, value) => { headers[key] = value; return res; }),
      status: jest.fn(() => res),
      json: jest.fn(() => res)
    };
    handler({ params: { contributorId: 'synthetic-test-user' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Not found' });
    expect(headers['Cache-Control']).toMatch(/no-store/);
  });
});
