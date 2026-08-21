# MyZubster Research Search + Onion Crawler

Status: experimental, disabled by default.

This module combines three architectural ideas while keeping a strict research-only safety boundary:

- **HexStrike AI**: a small tool registry that an AI agent can inspect and invoke through explicit, named capabilities;
- **Ahmia crawler**: bounded-depth crawling of Tor onion services through a local Tor proxy;
- **private/local web search projects**: locally stored crawl results searched from MyZubster instead of delegating every query to an external search provider.

The implementation in this repository is original code. It does not copy or embed HexStrike's offensive tooling.

## Safety boundary

The research layer intentionally does **not** expose exploit generation, brute force, credential attacks, mass scanning, vulnerability exploitation, form submission, browser automation, JavaScript execution, authentication bypass, file downloads or arbitrary shell execution.

Crawler constraints:

- feature is disabled unless `RESEARCH_SEARCH_ENABLED=true`;
- crawl/tool execution requires `RESEARCH_CRAWLER_ADMIN_TOKEN`;
- clearnet hosts must be listed in `RESEARCH_CRAWLER_ALLOWED_HOSTS`;
- onion hosts must be Tor v3 and explicitly listed in `RESEARCH_CRAWLER_ALLOWED_ONIONS`;
- clearnet DNS is rejected if it resolves to loopback/private/link-local ranges;
- redirects are disabled;
- crawling is same-host only;
- depth is capped at 2;
- pages are capped at 25 per run;
- responses are capped at 1 MiB;
- only HTTP(S) GET-style retrieval is used;
- only `text/html` and `text/plain` content is indexed;
- Tor traffic is sent through a local SOCKS endpoint, default `127.0.0.1:9050`.

## Environment

```bash
RESEARCH_SEARCH_ENABLED=false
RESEARCH_CRAWLER_ADMIN_TOKEN=<random-secret>
RESEARCH_CRAWLER_ALLOWED_HOSTS=docs.example.org,project.example.org
RESEARCH_CRAWLER_ALLOWED_ONIONS=<56-char-v3-host>.onion
TOR_SOCKS_PROXY=127.0.0.1:9050
```

Do not commit the admin token.

## API

### Search the local index

```http
GET /api/research/search?q=provenance&scope=all&limit=10
```

`scope` can be `all`, `web`, or `onion`.

### Index status

```http
GET /api/research/status
```

### List agent-facing tools

```http
GET /api/research/tools
```

The registry exposes only:

- `web_search`
- `crawl_web`
- `crawl_onion`
- `research_status`

### Start a bounded crawl

```http
POST /api/research/crawl
X-Research-Admin-Token: <token>
Content-Type: application/json

{
  "seed": "https://docs.example.org/",
  "maxDepth": 1,
  "maxPages": 10
}
```

### Agent-style tool execution

```http
POST /api/research/tools/execute
X-Research-Admin-Token: <token>
Content-Type: application/json

{
  "tool": "crawl_web",
  "input": {
    "seed": "https://docs.example.org/",
    "maxDepth": 1,
    "maxPages": 10
  }
}
```

## Tor setup

The service does not install or manage Tor. Run Tor separately and expose SOCKS only on loopback. The crawler uses `curl --socks5-hostname` with argument arrays rather than a shell command.

Before enabling an onion seed, verify that the service is one you are authorized to index and add the exact v3 hostname to the allowlist.

## Search index

Crawled pages are stored in MongoDB as `ResearchDocument` records with:

- normalized URL and source type (`web`/`onion`);
- title and extracted text;
- SHA-256 content hash;
- crawl depth, HTTP status and content type;
- crawl timestamp.

MongoDB's text index ranks title matches above body matches. This is an MVP search layer, not a claim of web-scale crawling or ranking quality.

## Reference projects reviewed

- `0x4m4/hexstrike-ai` — MCP/tool orchestration architecture and agent-facing capability model.
- `gh4rib/ahmia-crawler` — Tor crawler pattern with bounded Scrapy depth examples.
- `AstraBert/PrAIvateSearch` — local/private AI web-search application concept.

These references informed architecture only; production suitability, licenses and upstream security must be reviewed independently before importing third-party code.
