describe('admin notification email configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.MYZUBSTER_ADMIN_NOTIFICATION_EMAIL;
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
  });

  afterAll(() => { process.env = originalEnv; });

  test('does not hard-code an administrative destination', () => {
    const service = require('../src/services/adminActivityNotificationService');
    expect(service.ADMIN_NOTIFICATION_EMAIL).toBe('');
  });

  test('prefers MYZUBSTER_ADMIN_NOTIFICATION_EMAIL', () => {
    process.env.MYZUBSTER_ADMIN_NOTIFICATION_EMAIL = 'admin@example.test';
    process.env.ADMIN_NOTIFICATION_EMAIL = 'legacy@example.test';
    const service = require('../src/services/adminActivityNotificationService');
    expect(service.ADMIN_NOTIFICATION_EMAIL).toBe('admin@example.test');
  });

  test('returns not-configured without attempting delivery', async () => {
    const service = require('../src/services/adminActivityNotificationService');
    await expect(service.notifyAdminActivity('seller_activated', { userId:'u1' })).resolves.toEqual({ sent:false, reason:'not-configured' });
  });
});
