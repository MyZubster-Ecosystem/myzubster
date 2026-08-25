# ChatGPT × Zorgax Automation v2

## Goal
Use ChatGPT as the conversational control surface and Zorgax as the evidence-oriented orchestration layer for MyZubster research, LIFE preparation, repository monitoring and partner-data workflows.

ChatGPT interprets intent, summarizes evidence and asks for human decisions. Zorgax executes narrow, reproducible workflows and records provenance. Neither layer may invent evidence or silently convert discussion into confirmed facts.

## Operating loop

```text
USER / PROJECT EVENT
        ↓
     ChatGPT
 intent + context + requested outcome
        ↓
     ZORGAX ROUTER
        ↓
 ┌──────┼────────┬─────────┐
 LIFE  GitHub   Research  Data
  ↓      ↓         ↓       ↓
search  checks   sources  ingest
  └──────┴────────┴─────────┘
        ↓
 evidence normalization
        ↓
 confidence + provenance
        ↓
 deduplication / change detection
        ↓
 human-readable ChatGPT brief
        ↓
 HUMAN APPROVAL when required
        ↓
 action / issue / draft / evidence record
```

## Search profiles

### LIFE Official Watch
Priority sources: European Commission, CINEA, Funding & Tenders Portal, MASE/NCP. Track calls, deadlines, eligibility, programme documents, info days and material corrections. Never treat an unofficial date as authoritative.

### Consortium & Partner Evidence
Track only evidence relevant to role, technical capability, public commitments and documented collaboration. Emails and private records remain private unless explicitly authorized. A meeting or support relationship does not equal partnership.

### Technical Research
Search official documentation, standards, papers and reproducible technical sources. Prefer primary sources. Store query, source URL/reference, retrieval time, claim supported and confidence.

### MyZubster Ecosystem
Track meaningful external integrations, contributions, deployments, independent technical discussion and adoption signals. Deduplicate passive indexing and promotional repetition.

### GitHub Health
Track failed CI, regressions, dependency/security notices, open implementation issues and documentation/code divergence. Low-risk fixes may become draft PRs; no automatic merge.

## Research result contract
Every result passed from Zorgax to ChatGPT should contain:

- `query_id`
- `profile`
- `query`
- `retrieved_at`
- `source_type`
- `source_reference`
- `claim`
- `evidence_excerpt_or_structured_fact`
- `confidence`
- `independence` (project / official / independent / aggregator)
- `freshness`
- `dedupe_key`
- `material_change`
- `recommended_next_action`

## ChatGPT behavior
ChatGPT should:

1. search connected project sources when the question concerns private project state;
2. search current public sources for changing external facts;
3. separate confirmed facts, proposals, hypotheses and missing information;
4. cite the evidence used;
5. prefer a delta brief over repeating unchanged information;
6. propose the next concrete action;
7. require explicit approval before consequential external writes unless the user already requested that write;
8. never expose credentials, private datasets or unnecessary personal data.

## Automation classes

### Event-driven
- new partner email → classify request/commitment → update private partner-state draft → suggest response;
- GitHub CI failure → collect logs → diagnose → open implementation task/draft fix when bounded;
- new dataset → validate schema → normalize → provenance → draft evidence → review gate.

### Scheduled
- LIFE official-source watch;
- MyZubster ecosystem/adoption research;
- repository health review;
- open partner/action follow-up review.

Scheduled jobs should be quiet when there is no material change.

## Research fan-out
For broad questions Zorgax can run multiple narrow searches in parallel, then merge them by evidence rather than by wording:

```text
question
  ↓
official sources ─┐
technical sources ├→ normalize → dedupe → rank → brief
project sources ──┤
GitHub evidence ──┘
```

Ranking factors: authority, directness, freshness, reproducibility, independence and relevance.

## Memory/state
Do not rely on conversational memory as the system of record. Persist durable project state in explicit project artifacts: GitHub issues/docs for public technical state and authorized private systems for private correspondence/data. ChatGPT should retrieve before making project-state claims.

## Human gates
Human approval is mandatory for: partner status confirmation, external emails/messages, submissions, budgets/contracts, scientific claim approval, publication of restricted data, production changes and merges with material risk.

## LIFE 2027 integration
Zorgax LIFE Automation v1 remains the data/evidence pipeline. This v2 layer adds research and conversational orchestration around it:

```text
RESEARCH WATCH → CONSORTIUM STATE → DATA PIPELINE → EVIDENCE → REVIEW → PILOT/REPORT
```

## Success metrics
- fewer repeated searches;
- fewer unsupported claims;
- material-change-only notifications;
- source/provenance coverage for every external claim;
- time from new signal to actionable brief;
- percentage of automated actions requiring no correction;
- zero secret leakage;
- zero autonomous partner/funding claims.
