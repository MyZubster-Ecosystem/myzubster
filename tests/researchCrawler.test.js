const { createResearchCrawler } = require('../src/services/researchCrawler');
const { createResearchPolicy } = require('../src/services/researchSearchPolicy');

describe('research crawler', () => {
  test('indexes bounded same-host pages and ignores out-of-policy links', async () => {
    const policy = createResearchPolicy({ allowedHosts: ['example.com'] });
    const pages = {
      'https://example.com/': '<html><head><title>Home</title></head><body>Alpha <a href="/docs">Docs</a><a href="https://outside.test/">Outside</a></body></html>',
      'https://example.com/docs': '<html><head><title>Docs</title></head><body>Beta</body></html>',
    };
    const fetchWeb = jest.fn(async url => ({ status: 200, contentType: 'text/html; charset=utf-8', body: pages[url] }));
    const fetchOnion = jest.fn();
    const documents = [];
    const store = { upsert: jest.fn(async document => documents.push(document)) };
    const crawler = createResearchCrawler({ policy, fetchWeb, fetchOnion, store });

    const result = await crawler.crawl({ seed: 'https://example.com/', maxDepth: 2, maxPages: 25 });

    expect(result.indexedCount).toBe(2);
    expect(result.visited).toBe(2);
    expect(fetchWeb).toHaveBeenCalledTimes(2);
    expect(fetchOnion).not.toHaveBeenCalled();
    expect(documents.map(item => item.title)).toEqual(['Home', 'Docs']);
    expect(documents[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('routes allowlisted onion seeds through the Tor fetcher', async () => {
    const host = `${'a'.repeat(56)}.onion`;
    const policy = createResearchPolicy({ allowedOnions: [host] });
    const fetchWeb = jest.fn();
    const fetchOnion = jest.fn(async () => ({ status: 200, contentType: 'text/plain', body: 'onion research page' }));
    const store = { upsert: jest.fn(async document => document) };
    const crawler = createResearchCrawler({ policy, fetchWeb, fetchOnion, store });

    const result = await crawler.crawl({ seed: `http://${host}/`, maxDepth: 0, maxPages: 1 });

    expect(result.sourceType).toBe('onion');
    expect(fetchOnion).toHaveBeenCalledTimes(1);
    expect(fetchWeb).not.toHaveBeenCalled();
  });
});
