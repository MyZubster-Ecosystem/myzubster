describe('admin notification email configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.MYZUBSTER_ADMIN_NOTIFICATION_EMAIL;
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    delete process.env.ZORGAX_SMTP_HOST;
    delete process.env.ZORGAX_SMTP_USER;
    delete process.env.ZORGAX_SMTP_PASS;
    delete process.env.ZORGAX_EMAIL_FROM;
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

  test('dedicated service requires complete SMTP and admin destination configuration', () => {
    process.env.MYZUBSTER_ADMIN_NOTIFICATION_EMAIL = 'admin@example.test';
    const service = require('../src/services/adminNotificationEmailService');
    expect(service._test.emailConfig()).toBeNull();
  });

  test('dedicated service builds SMTP config only when all required values exist', () => {
    process.env.MYZUBSTER_ADMIN_NOTIFICATION_EMAIL = 'admin@example.test';
    process.env.ZORGAX_SMTP_HOST = 'smtp.example.test';
    process.env.ZORGAX_SMTP_PORT = '587';
    process.env.ZORGAX_SMTP_USER = 'mailer@example.test';
    process.env.ZORGAX_SMTP_PASS = 'secret-for-test';
    process.env.ZORGAX_EMAIL_FROM = 'MyZubster <mailer@example.test>';
    const service = require('../src/services/adminNotificationEmailService');
    const config = service._test.emailConfig();
    expect(config.host).toBe('smtp.example.test');
    expect(config.port).toBe(587);
    expect(config.secure).toBe(false);
    expect(config.to).toBe('admin@example.test');
  });

  test('Google registration notification is best-effort when email is not configured', async () => {
    const service = require('../src/services/adminNotificationEmailService');
    await expect(service.notifyGoogleRegistration({ userId:'u-google', email:'new@example.test', name:'New User' }))
      .resolves.toEqual({ sent:false, reason:'not-configured' });
  });

  test('Seller activation notification is best-effort when email is not configured', async () => {
    const service = require('../src/services/adminNotificationEmailService');
    await expect(service.notifySellerActivation({ userId:'u-seller', email:'seller@example.test', plan:'SELLER_FREE' }))
      .resolves.toEqual({ sent:false, reason:'not-configured' });
  });
});
