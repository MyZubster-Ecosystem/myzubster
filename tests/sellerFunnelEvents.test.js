'use strict';
const { buildSellerEvent, pseudonym } = require('../src/services/sellerFunnelEvents');
const secret = 'test-secret-for-pseudonymization-32-bytes-long';
const base = { event:'marketplace_listing_published', userId:'user-123', secret, properties:{ environment:'staging', seller_plan:'SELLER_FREE', listing_category:'services', currency:'EUR', source:'api' } };
describe('seller funnel event contract', () => {
  test('creates stable pseudonymous event without raw user ID', () => {
    const a = buildSellerEvent(base);
    const b = buildSellerEvent(base);
    expect(a).toEqual(b);
    expect(a.distinct_id).not.toContain('user-123');
    expect(a.properties.schema_version).toBe(1);
  });
  test('requires secret and actor', () => {
    expect(() => pseudonym('user-123', '')).toThrow();
    expect(() => pseudonym('', secret)).toThrow();
  });
  test('rejects unapproved fields including email and free text', () => {
    expect(() => buildSellerEvent({ ...base, properties:{ email:'x@example.org' } })).toThrow();
    expect(() => buildSellerEvent({ ...base, properties:{ title:'my listing' } })).toThrow();
    expect(() => buildSellerEvent({ ...base, properties:{ source:'https://example.org/?token=abc' } })).toThrow();
  });
  test('rejects invalid event, schema and environment', () => {
    expect(() => buildSellerEvent({ ...base, event:'seller_pageview' })).toThrow();
    expect(() => buildSellerEvent({ ...base, properties:{ schema_version:2 } })).toThrow();
    expect(() => buildSellerEvent({ ...base, properties:{ environment:'production;drop' } })).toThrow();
  });
});
