const {
  previewData,
  digestPreview,
  dataIntent,
  inferCategory,
  searchWeb,
  looksTimeSensitive,
  openAIFallbackReason,
  buildRuntimeProductContext,
  buildAssistantPrompt
} = require('../src/services/zorgaxAssistantService');

const originalFetch = global.fetch;
const originalBraveKey = process.env.BRAVE_SEARCH_API_KEY;
const originalTavilyKey = process.env.TAVILY_API_KEY;

afterEach(() => {
  global.fetch = originalFetch;
  if (originalBraveKey === undefined) delete process.env.BRAVE_SEARCH_API_KEY;
  else process.env.BRAVE_SEARCH_API_KEY = originalBraveKey;
  if (originalTavilyKey === undefined) delete process.env.TAVILY_API_KEY;
  else process.env.TAVILY_API_KEY = originalTavilyKey;
});

describe('Zorgax general assistant data contract', () => {
  test('detects explicit data-entry intent without writing anything', () => {
    expect(dataIntent('salva umidità terreno 42%')).toBe(true);
    expect(dataIntent('qual è il meteo?')).toBe(false);
  });

  test('creates a deterministic confirmation digest', () => {
    const result = previewData('umidità terreno 42%');
    expect(result.persistent_write_performed).toBe(false);
    expect(result.confirmation).toBe(`CONFERMA ${result.digest.slice(0, 8)}`);
    expect(digestPreview(result.preview)).toBe(result.digest);
  });

  test('classifies common MyZubster data domains', () => {
    expect(inferCategory('temperatura e umidità del suolo')).toBe('environment');
    expect(inferCategory('robot con sensore e motore')).toBe('robotics');
    expect(inferCategory('competenza saldatura')).toBe('skills');
  });
});

describe('Zorgax live research fallbacks', () => {
  test('detects time-sensitive research queries', () => {
    expect(looksTimeSensitive('ultime notizie sul clima oggi')).toBe(true);
    expect(looksTimeSensitive('spiegami la fotosintesi')).toBe(false);
  });

  test('uses Google News before Wikipedia for current queries when paid search keys are absent', async () => {
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.TAVILY_API_KEY;

    global.fetch = jest.fn(async input => {
      const url = String(input);
      if (url.includes('news.google.com')) {
        return {
          ok: true,
          text: async () => `<?xml version="1.0"?><rss><channel><item><title>Fresh climate report</title><link>https://news.google.com/rss/articles/example</link><pubDate>Sat, 29 Aug 2026 01:00:00 GMT</pubDate><source>Example News</source><description><![CDATA[<p>Fresh climate update from Italy.</p>]]></description></item></channel></rss>`
        };
      }
      if (url.includes('wikipedia.org')) {
        return {
          ok: true,
          json: async () => ({
            query: {
              pages: {
                1: {
                  title: 'Climate',
                  fullurl: 'https://en.wikipedia.org/wiki/Climate',
                  extract: 'Background information about climate.'
                }
              }
            }
          })
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const result = await searchWeb('ultime notizie sul clima oggi', 3);

    expect(result.live_search_available).toBe(true);
    expect(result.sources[0].provider).toBe('google_news');
    expect(result.providers_used).toEqual(expect.arrayContaining(['google_news', 'wikipedia']));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});


describe('Zorgax OpenAI fallback classification', () => {
  test('distinguishes quota exhaustion from transient rate limits', () => {
    expect(openAIFallbackReason({ status: 429, code: 'credit_balance_exhausted', type: 'insufficient_quota' })).toBe('openai_credit_balance_exhausted');
    expect(openAIFallbackReason({ status: 429, code: 'rate_limit_exceeded', type: 'rate_limit_error' })).toBe('openai_rate_limit_exceeded');
    expect(openAIFallbackReason({ status: 429 })).toBe('openai_rate_limit');
  });
});


describe('Zorgax shared runtime product context', () => {
  test('marks canonical live routes without promoting unverified capabilities', () => {
    const runtime = buildRuntimeProductContext();
    expect(runtime).toContain('LIVE ROUTE: /marketplace');
    expect(runtime).toContain('LIVE ROUTE: /metaverse');
    expect(runtime).toContain('LIVE/PILOT ROUTE: /life-pilot');
    expect(runtime).toContain('LIVE AUTH ROUTE: /social-login');
    expect(runtime).toContain('MYZ is an internal reward/accounting ledger');
    expect(runtime).toContain('Advanced bounties');
    expect(runtime).toContain('UNKNOWN/UNVERIFIED');
    expect(runtime).toContain('does NOT automatically prove every feature');
  });

  test('injects the same canonical runtime facts into the shared assistant prompt', () => {
    const prompt = buildAssistantPrompt('Quali funzioni sono live?', []);
    expect(prompt).toContain('RUNTIME PRODUCT FACTS — CANONICAL APPLICATION CONTEXT');
    expect(prompt).toContain('/marketplace');
    expect(prompt).toContain('/life-pilot');
    expect(prompt).toContain('USER MESSAGE:\\nQuali funzioni sono live?');
  });
});
