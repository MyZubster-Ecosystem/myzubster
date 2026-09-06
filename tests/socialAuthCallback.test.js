const jwt = require('jsonwebtoken');

jest.mock('../src/services/socialIdentityService', () => ({
  upsertVerifiedAccount: jest.fn()
}));

const socialAuthController = require('../src/controllers/socialAuthController');

function response() {
  return { redirect: jest.fn() };
}

function redirectedParams(res) {
  expect(res.redirect).toHaveBeenCalledTimes(1);
  return new URL(res.redirect.mock.calls[0][0]).searchParams;
}

describe('social OAuth callback safety', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.OAUTH_STATE_SECRET = 'test-oauth-state-secret';
    process.env.FRONTEND_URL = 'https://www.myzubster.com';
    jest.clearAllMocks();
  });

  test('returns a friendly restart message when callback state is missing', async () => {
    const req = { params: { provider: 'facebook' }, query: { code: 'provider-code' } };
    const res = response();

    await socialAuthController.callback(req, res);

    const params = redirectedParams(res);
    expect(params.get('social_login')).toBe('error');
    expect(params.get('provider')).toBe('facebook');
    expect(params.get('social_login_message')).toMatch(/Sessione OAuth mancante/);
    expect(params.get('social_login_message')).not.toMatch(/jwt must be provided/i);
  });

  test('handles provider access denial before attempting JWT verification', async () => {
    const req = { params: { provider: 'facebook' }, query: { error: 'access_denied' } };
    const res = response();

    await socialAuthController.callback(req, res);

    expect(redirectedParams(res).get('social_login_message')).toMatch(/Accesso annullato/);
  });

  test('distinguishes a missing authorization code from invalid state', async () => {
    const state = jwt.sign(
      { purpose: 'social-login', provider: 'facebook', nonce: 'test' },
      process.env.OAUTH_STATE_SECRET,
      { expiresIn: '10m' }
    );
    const req = { params: { provider: 'facebook' }, query: { state } };
    const res = response();

    await socialAuthController.callback(req, res);

    expect(redirectedParams(res).get('social_login_message')).toMatch(/OAuth callback incompleto/);
  });

  test('does not surface raw JWT library errors for invalid state', async () => {
    const req = { params: { provider: 'facebook' }, query: { state: 'not-a-jwt', code: 'provider-code' } };
    const res = response();

    await socialAuthController.callback(req, res);

    const message = redirectedParams(res).get('social_login_message');
    expect(message).toMatch(/Sessione OAuth non valida/);
    expect(message).not.toMatch(/jwt|token/i);
  });
});
