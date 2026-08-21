const {
  createResearchPolicy,
  isPrivateIp,
  isV3OnionHost,
} = require('../src/services/researchSearchPolicy');

describe('research crawler URL policy', () => {
  test('allows only explicitly allowlisted clearnet hosts', () => {
    const policy = createResearchPolicy({ allowedHosts: ['example.com'] });
    expect(policy.assertUrl('https://example.com/docs').sourceType).toBe('web');
    expect(policy.assertUrl('https://sub.example.com/docs').sourceType).toBe('web');
    expect(() => policy.assertUrl('https://example.net/')).toThrow(/allow/i);
  });

  test('blocks obvious local and private targets', () => {
    const policy = createResearchPolicy({ allowedHosts: ['localhost', '127.0.0.1', 'example.com'] });
    expect(() => policy.assertUrl('http://localhost/')).toThrow(/private|local/i);
    expect(() => policy.assertUrl('http://127.0.0.1/')).toThrow(/private|local/i);
    expect(isPrivateIp('10.0.0.8')).toBe(true);
    expect(isPrivateIp('192.168.1.10')).toBe(true);
    expect(isPrivateIp('8.8.8.8')).toBe(false);
  });

  test('accepts only allowlisted Tor v3 onion hosts', () => {
    const host = `${'a'.repeat(56)}.onion`;
    expect(isV3OnionHost(host)).toBe(true);
    const policy = createResearchPolicy({ allowedOnions: [host] });
    expect(policy.assertUrl(`http://${host}/`).sourceType).toBe('onion');
    expect(() => policy.assertUrl(`http://${'b'.repeat(56)}.onion/`)).toThrow(/allow/i);
    expect(() => policy.assertUrl('http://abcdefghijklmnop.onion/')).toThrow(/v3/i);
  });
});
