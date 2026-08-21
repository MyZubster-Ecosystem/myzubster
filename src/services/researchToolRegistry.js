'use strict';

function createResearchToolRegistry({ crawler, store } = {}) {
  if (!crawler || typeof crawler.crawl !== 'function') throw new Error('research crawler is required');
  if (!store || typeof store.search !== 'function' || typeof store.stats !== 'function') throw new Error('research store is required');

  const tools = {
    web_search: {
      description: 'Search the local MyZubster research index.',
      execute: async input => store.search({ q: input?.q, sourceType: input?.sourceType || 'all', limit: input?.limit }),
    },
    crawl_web: {
      description: 'Crawl one explicitly allowlisted clearnet host with bounded depth/page limits.',
      execute: async input => {
        const url = new URL(input?.seed);
        if (url.hostname.endsWith('.onion')) throw new Error('crawl_web refuses onion targets');
        return crawler.crawl(input);
      },
    },
    crawl_onion: {
      description: 'Crawl one explicitly allowlisted Tor v3 onion host through the local Tor proxy.',
      execute: async input => {
        const url = new URL(input?.seed);
        if (!url.hostname.endsWith('.onion')) throw new Error('crawl_onion requires an onion target');
        return crawler.crawl(input);
      },
    },
    research_status: {
      description: 'Return index counts without crawling or external network activity.',
      execute: async () => store.stats(),
    },
  };

  return {
    list() {
      return Object.entries(tools).map(([name, tool]) => ({ name, description: tool.description }));
    },
    async execute(name, input = {}) {
      const tool = tools[name];
      if (!tool) throw new Error(`unsupported research tool: ${name}`);
      return tool.execute(input);
    },
  };
}

module.exports = { createResearchToolRegistry };
