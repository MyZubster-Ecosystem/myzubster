'use strict';

const { createZorgaxResearchSmoke } = require('../src/services/zorgaxResearchSmoke');

async function main() {
  const baseUrl = process.env.MYZUBSTER_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5003}`;
  const query = String(process.env.ZORGAX_RAG_SMOKE_QUERY || '').trim();
  const scope = process.env.ZORGAX_RAG_SMOKE_SCOPE || 'all';
  const limit = process.env.ZORGAX_RAG_SMOKE_LIMIT || 3;
  const timeoutMs = process.env.ZORGAX_RAG_SMOKE_TIMEOUT_MS;

  if (!query) {
    console.error('ZORGAX_RAG_SMOKE_QUERY is required. The smoke test never invents a crawl target or query.');
    process.exitCode = 2;
    return;
  }

  const smoke = createZorgaxResearchSmoke({ baseUrl, timeoutMs });
  const result = await smoke.run({ query, scope, limit });

  const summary = {
    baseUrl: result.baseUrl,
    query: result.query,
    scope: result.scope,
    timeoutMs: result.timeoutMs,
    zorgaxStatus: {
      http: result.zorgaxStatus.status,
      ok: result.zorgaxStatus.ok,
      model: result.zorgaxStatus.body?.model || null,
      modelLoaded: result.zorgaxStatus.body?.model_loaded ?? null,
    },
    researchStatus: {
      http: result.researchStatus.status,
      ok: result.researchStatus.ok,
      total: result.researchStatus.body?.total ?? null,
      byType: result.researchStatus.body?.byType || null,
    },
    retrieval: {
      http: result.retrieval.status,
      ok: result.retrieval.ok,
      count: result.sources.length,
      labels: result.sources.map(source => source.label),
      urls: result.sources.map(source => source.url),
    },
    chat: result.chat ? {
      http: result.chat.status,
      ok: result.chat.ok && result.chat.body?.ok === true,
      researchUsed: result.researchUsed,
      citedResearchUsed: result.citedResearchUsed,
      citationSatisfied: result.citationSatisfied,
      provenance: result.chat.body?.research_provenance || null,
      responsePreview: String(result.chat.body?.response || '').slice(0, 500),
    } : null,
    grounded: result.grounded === true,
    crawlPerformed: false,
    reason: result.reason || null,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!result.readyForGroundedChat) {
    console.error('Grounded chat was not attempted. No crawl was performed. Populate the guarded local research index explicitly, then rerun.');
    process.exitCode = 3;
    return;
  }

  if (!result.grounded) {
    console.error('Zorgax answered without the expected research provenance and source-label citation contract.');
    process.exitCode = 4;
    return;
  }

  console.log('Zorgax research RAG smoke test passed with local provenance, source-label citation, and zero crawler execution.');
}

main().catch(error => {
  console.error(`Zorgax research RAG smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
