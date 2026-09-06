const jwt = require('jsonwebtoken');

jest.mock('../src/services/socialIdentityService', () => ({
  upsertVerifiedAccount: jest.fn()
}));

const { upsertVerifiedAccount } = require('../src/services/socialIdentityService');
const socialAuthController = require('../src/controllers/socialAuthController');

const originalFetch = global.fetch;

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
    process.env.FACEBOOK_LOGIN_APP_ID = 'facebook-app-id';
    process.env.FACEBOOK_LOGIN_APP_SECRET = 'facebook-app-secret';
    process.env.FACEBOOK_LOGIN_CALLBACK_URL = 'https://www.myzubster.com/api/auth/social/facebook/callback';
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('starts Facebook OAuth with public_profile only', () => {
    const req = { params: { provider: 'facebook' } };
    const res = response();

    socialAuthController.start(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const url = new URL(res.redirect.mock.calls[0][0]);
    expect(url.origin).toBe('https://www.facebook.com');
    expect(url.searchParams.get('scope')).toBe('public_profile');
    expect(url.searchParams.get('scope')).not.toMatch(/email/);
  });

  test('completes Facebook callback when profile has no email', async () => {
    const state = jwt.sign(
      { purpose: 'social-login', provider: 'facebook', nonce: 'test' },
      process.env.OAUTH_STATE_SECRET,
      { expiresIn: '10m' }
    );
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'facebook-token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'fb-user-1', name: 'Dani El', picture: { data: { url: 'https://example.test/avatar.jpg' } } }) });
    upsertVerifiedAccount.mockResolvedValue({
      token: 'myzubster-token',
      user: { _id: 'user-1' },
      character: { characterId: 'character-1' }
    });
    const req = { params: { provider: 'facebook' }, query: { state, code: 'provider-code' } };
    const res = response();

    await socialAuthController.callback(req, res);

    expect(upsertVerifiedAccount).toHaveBeenCalledWith('facebook', {
      id: 'fb-user-1',
      name: 'Dani El',
      avatarUrl: 'https://example.test/avatar.jpg'
    });
    const profileUrl = new URL(global.fetch.mock.calls[1][0]);
    expect(profileUrl.searchParams.get('fields')).toBe('id,name,picture');
    expect(redirectedParams(res).get('social_login')).toBe('verified');
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
