# Zorgax Research RAG

## Purpose

This layer connects ZORGAX-001 to the bounded MyZubster research index introduced by the guarded research/search crawler work.

The default chat flow is now:

```text
user question
    ↓
Zorgax local context
    ├── opt-in persistent memory
    ├── MyZubster observation registry
    └── ResearchDocument text index
            ↓
      bounded top-k retrieval
            ↓
   provenance-bearing RAG context
            ↓
          Ollama
            ↓
 answer + source labels/provenance
```

## Important boundary

Zorgax **does not autonomously crawl the web or Tor**.

The chat route may search material that is already present in the local MongoDB research index. If no useful source is found, the response can indicate that a refresh is required, but the actual crawl remains behind the existing `/api/research/crawl` administrator gate.

This preserves a clear separation:

```text
READ path
Zorgax → local research index

WRITE / network path
explicit administrator action → allowlist policy → bounded crawler → local index
```

## Configuration

The research integration activates only when the existing research feature is enabled:

```bash
RESEARCH_SEARCH_ENABLED=true
```

Optional context limit:

```bash
ZORGAX_RESEARCH_CONTEXT_LIMIT=5
```

The runtime clamps the Zorgax research context to a maximum of 8 retrieved sources.

Crawling continues to use the controls defined by the research crawler:

```bash
RESEARCH_CRAWLER_ADMIN_TOKEN=<secret>
RESEARCH_CRAWLER_ALLOWED_HOSTS=example.org
RESEARCH_CRAWLER_ALLOWED_ONIONS=<explicit-v3-onion-host>
TOR_SOCKS_PROXY=127.0.0.1:9050
```

No crawler credential, allowlisted target, or onion seed belongs in Git.

## Chat API

`POST /api/zorgax/chat`

Additional request fields:

```json
{
  "message": "What evidence is in the research index?",
  "useResearch": true,
  "researchScope": "all",
  "researchLimit": 5
}
```

Allowed scopes:

- `all`
- `web`
- `onion`

Relevant response fields:

```json
{
  "research_enabled": true,
  "research_used": ["R1", "R2"],
  "research_sources": [],
  "research_provenance": "MongoDB ResearchDocument text index",
  "research_refresh_required": false,
  "research_crawl_performed": false
}
```

## Direct retrieval API

`GET /api/zorgax/research?q=<query>&scope=all&limit=5`

This endpoint is read-only. It never performs network crawling.

## Source labels

Retrieved records are assigned transient answer labels:

```text
[R1]
[R2]
[R3]
```

The RAG context tells Zorgax to cite those labels when a source materially supports an answer. The API separately returns the structured source record containing:

- URL;
- source type (`web` or `onion`);
- host;
- title;
- snippet;
- crawl timestamp;
- content hash.

The labels are response-local references, not permanent document identifiers.

## Prompt-injection boundary

Indexed pages are treated as untrusted external content.

The model receives explicit instructions that retrieved material must never be treated as tool instructions or system policy. In particular, retrieved text cannot authorize:

- role changes;
- secret disclosure;
- shell execution;
- link following;
- form submission;
- crawler execution;
- exploit execution;
- credential requests.

A source saying “ignore previous instructions” remains evidence text and has no control-plane authority.

## Provenance semantics

A research record proves that the crawler stored a particular representation of a page at a particular time and content hash. It does **not** automatically prove:

- authorship;
- publication date;
- current validity;
- truth of the page;
- identity of the operator;
- legality or reliability of the source.

`.onion` and clearnet records are evaluated using the same evidence standard.

## UI

The `/zorgax` interface includes a **Ricerca locale** toggle.

When enabled, the chat response can display the retrieved source labels and URLs. If no source exists, the UI explains that no crawl was started and that refresh requires the administrator-controlled research workflow.

## Current status

This implementation is a local retrieval integration. It does not turn Zorgax into an autonomous browsing or offensive-security agent.
