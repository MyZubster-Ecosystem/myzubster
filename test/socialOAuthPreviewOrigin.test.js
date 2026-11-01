const jwt = require('jsonwebtoken');
const auth = require('../src/controllers/socialAuthController')._test;

const OLD = { ...process.env };
const DEPLOY = 'my-zubster-msya4e6ae-myzubster.vercel.app';
beforeEach(() => {
  process.env.VERCEL_ENV = 'preview';
  process.env.VERCEL_URL = DEPLOY;
  delete process.env.VERCEL_BRANCH_URL;
  process.env.FRONTEND_URL = 'https://www.myzubster.com';
  process.env.JWT_SECRET = 'test-only-not-a-real-secret';
  delete process.env.OAUTH_STATE_SECRET;
});
afterAll(() => { process.env = OLD; });

test('preview origin is accepted only when matching deployment allowlist', () => {
  expect(auth.previewOrigin({headers:{host:DEPLOY}})).toBe('https://' + DEPLOY);
  expect(auth.previewOrigin({headers:{host:'attacker.vercel.app'}})).toBe('');
  expect(auth.previewOrigin({headers:{host:DEPLOY,'x-forwarded-host':'attacker.vercel.app'}})).toBe('https://' + DEPLOY);
  expect(auth.previewOrigin({headers:{host:'www.myzubster.com'}})).toBe('');
});

test('signed OAuth state preserves original preview across callback host changes', () => {
  const origin = auth.previewOrigin({headers:{host:DEPLOY}});
  const token = auth.state('google',{previewOrigin:origin});
  const verified = auth.verifyState(token,'google');
  expect(auth.frontend({headers:{host:'www.myzubster.com'}},verified)).toBe(origin);
  expect(() => auth.verifyState(token,'github')).toThrow();
  expect(() => auth.verifyState(token+'tampered','google')).toThrow();
});

test('rejects unapproved or forged redirect origins', () => {
  expect(auth.frontend({}, {previewOrigin:'https://attacker.vercel.app'})).toBe('https://www.myzubster.com');
  expect(auth.frontend({}, {previewOrigin:'https://www.myzubster.com.evil.com'})).toBe('https://www.myzubster.com');
});

test('production behavior remains unchanged', () => {
  process.env.VERCEL_ENV='production';
  expect(auth.previewOrigin({headers:{host:DEPLOY}})).toBe('');
  expect(auth.frontend({}, {previewOrigin:'https://'+DEPLOY})).toBe('https://www.myzubster.com');
});

test('Google error redirects back to signed preview origin', () => {
  const state = auth.verifyState(auth.state('google',{previewOrigin:'https://'+DEPLOY}),'google');
  const res = {redirect:jest.fn()};
  auth.redirectError({headers:{host:'www.myzubster.com'}},res,'Login Google non riuscito','google',state);
  const url = new URL(res.redirect.mock.calls[0][0]);
  expect(url.origin).toBe('https://'+DEPLOY);
  expect(url.searchParams.get('social_login')).toBe('error');
  expect(url.searchParams.get('provider')).toBe('google');
});
