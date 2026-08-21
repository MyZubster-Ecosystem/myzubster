# Zorgax Research RAG — VPS Smoke Test

This procedure validates the local MyZubster research index → Zorgax retrieval → Ollama response path on the VPS.

It is deliberately **read-only with respect to crawling**: the smoke command never calls `/api/research/crawl`, never invents a target, never submits forms, and never initiates Tor or clearnet crawling.

## Preconditions

- MongoDB is reachable through the configured `MONGO_URI`.
- Ollama is running on the local host and the configured Zorgax model is loaded.
- The MyZubster gateway is running locally.
- `RESEARCH_SEARCH_ENABLED=true` is set for the gateway process.
- At least one previously authorized/indexed research document matches the chosen smoke query.

## Start the branch on the VPS

```bash
cd ~/all-repos/myzubster
git fetch origin
git switch feature/zorgax-research-rag-2026-08-21
git pull --ff-only origin feature/zorgax-research-rag-2026-08-21
npm ci
```

Run the gateway with the existing local MongoDB and Ollama configuration. Example environment shape:

```bash
export RESEARCH_SEARCH_ENABLED=true
export MONGO_URI='mongodb://127.0.0.1:27017/myzubster'
export OLLAMA_URL='http://127.0.0.1:11434'
# Keep the model already used by the VPS, for example:
# export OLLAMA_MODEL='zorgax:latest'

npm start
```

Do not place credentials in shell history when avoidable. The smoke command does not require the crawler admin token.

## Run the smoke test from a second VPS shell

Choose a query that should already exist in the local research index:

```bash
cd ~/all-repos/myzubster
export ZORGAX_RAG_SMOKE_QUERY='MyZubster research provenance'
export MYZUBSTER_BASE_URL='http://127.0.0.1:5003'

npm run smoke:zorgax-research
```

The smoke harness defaults to a **60 second** request timeout so CPU-only Ollama inference is not rejected by the earlier 15 second limit. It can be overridden when needed:

```bash
export ZORGAX_RAG_SMOKE_TIMEOUT_MS=120000
```

The timeout is bounded between **1 second and 5 minutes**. Values outside that range are clamped, so the harness cannot become an unbounded wait.

Expected successful shape:

```text
timeoutMs = 60000 (or configured bounded value)
zorgaxStatus.ok = true
researchStatus.ok = true
retrieval.count > 0
chat.ok = true
researchUsed = [R1, ...]
citedResearchUsed = [R1, ...]
citationSatisfied = true
grounded = true
crawlPerformed = false
```

A grounded pass requires the final answer to contain at least one exact source label reported in `research_used`, such as `[R1]`. Structured provenance without an answer-level source label is treated as a failed grounding contract.

Small local models may still omit a requested label even when the structured research contract is correct. The Zorgax chat route therefore applies a deterministic **provenance-only fallback**: if research sources were retrieved and the model answer contains none of their exact labels, the API appends `Research context provenance: [R1]` using the first valid retrieved label. The response also reports `research_citation_enforced: true` and `research_cited_labels` so callers can distinguish a model-authored citation from the API fallback.

The fallback does **not** claim that every sentence in the generated answer is independently supported by that source. It only records which provenance-bearing research context was supplied to the model, and it never invents a label when no research source exists.

The command only accepts a loopback MyZubster base URL (`127.0.0.1`, `localhost`, or `::1`). This prevents the smoke harness itself from becoming an arbitrary remote HTTP client.

## If the index has no match

The command stops before calling Zorgax chat and prints that no indexed source matched the query. It does **not** crawl automatically.

If a refresh is intentionally required, use the existing administrator-protected research endpoint only with a target already present in `RESEARCH_CRAWLER_ALLOWED_HOSTS` or `RESEARCH_CRAWLER_ALLOWED_ONIONS`.

Example for an already-approved clearnet host:

```bash
curl --fail-with-body \
  -X POST 'http://127.0.0.1:5003/api/research/crawl' \
  -H 'Content-Type: application/json' \
  -H "x-research-admin-token: ${RESEARCH_CRAWLER_ADMIN_TOKEN}" \
  --data '{"seed":"https://APPROVED-HOST.example/","maxDepth":1,"maxPages":5}'
```

Replace the placeholder only with a host explicitly configured in the allowlist. Do not use the smoke procedure as authorization to discover or crawl arbitrary targets.

After the authorized indexing run completes, rerun `npm run smoke:zorgax-research` with a query known to match the newly indexed material.

## Pass criteria

A pass requires all of the following:

1. Zorgax local status succeeds and Ollama is reachable.
2. Research index status succeeds.
3. Retrieval returns at least one provenance-bearing source.
4. Chat returns at least one `research_used` label and structured `research_sources`.
5. The final answer contains at least one exact source label such as `[R1]` from `research_used`, either model-authored or transparently supplied by the provenance fallback.
6. `research_crawl_performed` remains `false` throughout the chat flow.
7. The response is generated without persistent memory or observation-registry context, isolating the research RAG path for this smoke test.

This validates the local retrieval/grounding path. It does not by itself establish trustworthiness, freshness, or correctness of the indexed pages.
