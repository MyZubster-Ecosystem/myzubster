'use strict';
const { captureSellerEvent } = require('../src/services/sellerFunnelCapture');
const baseEnv = {
  POSTHOG_PROJECT_API_KEY: 'test-public-project-key',
  SELLER_FUNNEL_PSEUDONYM_SECRET: 'testing-secret-that-is-longer-than-32-characters',
  POSTHOG_CAPTURE_HOST: 'https://eu.i.posthog.com/',
  SELLER_FUNNEL_ENV: 'staging'
};
function fakeTransport(statusCode, recorded) {
  return { request(options, callback) {
    recorded.options = options;
    const handlers = {};
    const req = {
      on(name, fn) { handlers[name] = fn; return req; },
      end(data) {
        recorded.data = JSON.parse(data);
        const response = { statusCode, resume() {}, on(name, fn) { if (name === 'end') fn(); } };
        callback(response);
      },
      destroy() { if (handlers.error) handlers.error(new Error('timeout')); }
    };
    return req;
  } };
}
describe('seller PostHog capture', () => {
  test('disabled by default without configuration', async () => {
    expect(await captureSellerEvent('marketplace_listing_published', 'user-1', {}, { env:{} })).toEqual({ skipped:true });
  });
  test('rejects arbitrary outbound hosts', async () => {
    expect(await captureSellerEvent('marketplace_listing_published', 'user-1', {}, { env:{ ...baseEnv, POSTHOG_CAPTURE_HOST:'https://internal.example/' } })).toEqual({ skipped:true });
  });
  test('sends only pseudonymous allowlisted event fields to approved host', async () => {
    const recorded = {};
    const result = await captureSellerEvent('marketplace_listing_published', 'user-1', { seller_plan:'SELLER', listing_category:'services', currency:'EUR', source:'api' }, { env:baseEnv, transport:fakeTransport(200,recorded) });
    expect(result).toEqual({ delivered:true });
    expect(recorded.options.hostname).toBe('eu.i.posthog.com');
    expect(recorded.data.event).toBe('marketplace_listing_published');
    expect(recorded.data.distinct_id).not.toContain('user-1');
    expect(recorded.data.properties.environment).toBe('staging');
    expect(recorded.data.properties).not.toHaveProperty('email');
  });
  test('invalid free-text fields never reach transport', async () => {
    const recorded = {};
    const result = await captureSellerEvent('marketplace_listing_published','user-1',{ title:'private title' },{ env:baseEnv,transport:fakeTransport(200,recorded) });
    expect(result).toEqual({ skipped:true });
    expect(recorded.options).toBeUndefined();
  });
});
