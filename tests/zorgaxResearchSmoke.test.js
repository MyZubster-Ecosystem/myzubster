'use strict';

const {
  assertLoopbackBaseUrl,
  createZorgaxResearchSmoke,
} = require('../src/services/zorgaxResearchSmoke');

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('Zorgax research VPS smoke', () => {
  test('refuses non-loopback base URLs', () => {
    expect(() => assertLoopbackBaseUrl('https://example.com')).toThrow(/loopback-only/i);
    expect(assertLoopbackBaseUrl('http://127.0.0.1:5003')).toBe('http://127.0.0.1:5003');
    expect(assertLoopbackBaseUrl('http://localhost:5003/path?q=1')).toBe('http://localhost:5003');
  });

  test('does not call chat or crawl when the local index has no match', async () => {
    const calls = [];
    const fetchImpl = jest.fn(async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).endsWith('/api/zorgax/status')) {
        return jsonResponse(200, { ok: true, model: 'zorgax:latest', model_loaded: true });
      }
      if (String(url).endsWith('/api/research/status')) {
        return jsonResponse(200, { success: true, total: 0, byType: {} });
      }
      if (String(url).includes('/api/zorgax/research?')) {
        return jsonResponse(200, { ok: true, count: 0, sources: [], crawl_performed: false });
      }
      throw new Error(`unexpected request: ${url}`);
    });

    const smoke = createZorgaxResearchSmoke({ fetchImpl });
    const result = await smoke.run({ query: 'known smoke topic' });

    expect(result.readyForGroundedChat).toBe(false);
    expect(result.chat).toBeNull();
    expect(result.crawlPerformed).toBe(false);
    expect(calls.some(call => call.url.includes('/api/research/crawl'))).toBe(false);
    expect(calls.some(call => call.url.endsWith('/api/zorgax/chat'))).toBe(false);
  });

  test('runs grounded chat only after provenance-bearing retrieval succeeds', async () => {
    const fetchImpl = jest.fn(async (url, options = {}) => {
      const value = String(url);
      if (value.endsWith('/api/zorgax/status')) {
        return jsonResponse(200, { ok: true, model: 'zorgax:latest', model_loaded: true });
      }
      if (value.endsWith('/api/research/status')) {
        return jsonResponse(200, { success: true, total: 1, byType: { web: 1 } });
      }
      if (value.includes('/api/zorgax/research?')) {
        return jsonResponse(200, {
          ok: true,
          count: 1,
          crawl_performed: false,
          sources: [{
            label: 'R1',
            url: 'https://example.invalid/evidence',
            sourceType: 'web',
            title: 'Evidence',
            snippet: 'Local indexed evidence.',
            contentHash: 'a'.repeat(64),
          }],
        });
      }
      if (value.endsWith('/api/zorgax/chat')) {
        const payload = JSON.parse(options.body);
        expect(payload.useMemory).toBe(false);
        expect(payload.useObservations).toBe(false);
        expect(payload.useResearch).toBe(true);
        return jsonResponse(200, {
          ok: true,
          response: 'Grounded answer [R1]',
          research_used: ['R1'],
          research_sources: [{ label: 'R1', url: 'https://example.invalid/evidence' }],
          research_provenance: 'MongoDB ResearchDocument text index',
          research_crawl_performed: false,
        });
      }
      throw new Error(`unexpected request: ${url}`);
    });

    const smoke = createZorgaxResearchSmoke({ fetchImpl });
    const result = await smoke.run({ query: 'known smoke topic', scope: 'web', limit: 2 });

    expect(result.readyForGroundedChat).toBe(true);
    expect(result.grounded).toBe(true);
    expect(result.researchUsed).toEqual(['R1']);
    expect(result.crawlPerformed).toBe(false);
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('/api/research/crawl'))).toBe(false);
  });
});
