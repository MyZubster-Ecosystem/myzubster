const { createResearchToolRegistry } = require('../src/services/researchToolRegistry');

describe('research tool registry', () => {
  test('exposes only bounded research/search tools', async () => {
    const crawler = { crawl: jest.fn(async input => ({ seed: input.seed })) };
    const store = {
      search: jest.fn(async () => [{ title: 'result' }]),
      stats: jest.fn(async () => ({ total: 1, byType: { web: 1 } })),
    };
    const tools = createResearchToolRegistry({ crawler, store });

    expect(tools.list().map(item => item.name)).toEqual([
      'web_search',
      'crawl_web',
      'crawl_onion',
      'research_status',
    ]);
    await expect(tools.execute('unsupported_tool', {})).rejects.toThrow(/unsupported/i);
    await expect(tools.execute('crawl_web', { seed: 'http://example.onion/' })).rejects.toThrow(/refuses onion/i);
  });
});
