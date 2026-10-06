# MyZubster Evidence Audit Cycle v1

**Status:** IMPLEMENTED / APPEND-ONLY / HUMAN-GATED  
**Source:** ARPAE Emilia-Romagna measured open data  
**Boundary:** measured does not mean independently verified or scientifically final

This layer extends the evidence vertical slice from a one-shot evidence response into a repeatable audit cycle:

```text
ARPAE MEASURED OBSERVATION
          ↓
PROTECTED / SCHEDULED CAPTURE
          ↓
APPEND-ONLY MEASUREMENT EVENT
          ↓
PERSISTENT HUMAN REVIEW
   ACCEPT / REJECT
          ↓
ACCEPTED-ONLY BASELINE
          ↓
ZORGAX ADVISORY RULES
NO_ACTION / NEEDS_CLARIFICATION / UPDATE_PREPARED
          ↓
HUMAN-RECORDED OUTCOME
          ↓
PUBLIC SANITIZED AUDIT TIMELINE
```

## Storage model

`src/models/EvidenceAuditEvent.js` stores four event types:

- `MEASUREMENT_CAPTURED`
- `REVIEW_RECORDED`
- `RECOMMENDATION_PREPARED`
- `OUTCOME_RECORDED`

Events are append-only. The model rejects update, replace and delete operations. New information is represented by a new event rather than overwriting an old one.

Measurement capture is idempotent: the same `evidence_id` generates the same measurement event ID, so repeated capture of the same ARPAE observation does not create duplicate history.

## Capture

### Scheduled capture

Vercel cron calls:

`GET /api/robots/evidence/arpae/capture/cron`

The route requires `CRON_SECRET` and writes only the hard-coded ARPAE measured source. It never falls back to simulation if ARPAE is unavailable.

### Manual authorised capture

`POST /api/robots/evidence/arpae/capture`

Requires one of the existing evidence ingest credentials. Capture persists the prepared measured record and its integrity digest without performing a human review.

The public `GET /api/robots/evidence/arpae/latest` remains read-only and does not write to storage.

## Persistent human review

`POST /api/robots/evidence/audit/review`

Requires `EVIDENCE_REVIEW_TOKEN`.

Example request:

```json
{
  "evidence_id": "ev_...",
  "review": {
    "decision": "ACCEPT",
    "reviewer_ref": "maintainer:reviewer-1",
    "note": "Accepted as a bounded provisional ARPAE observation."
  }
}
```

The review event preserves the original measurement and records the reviewed evidence separately. A conflicting second decision is rejected instead of silently replacing the first one.

Human review still does not set `verified=true`.

## Baseline

`GET /api/robots/evidence/arpae/baseline`

The baseline uses only measurements with a persisted human `ACCEPT` review. Pending and rejected measurements do not contribute.

Current v1 gate:

- minimum accepted samples: `3`
- temperature deviation attention threshold: `5 C`
- relative humidity deviation attention threshold: `15 percentage points`

Until a metric has enough accepted samples, it remains `INSUFFICIENT_ACCEPTED_EVIDENCE` and Zorgax does not classify a deviation as meaningful.

These thresholds are operational demonstration rules, not scientific or regulatory limits.

## Zorgax recommendation

After an `ACCEPT` review, the system prepares one append-only `RECOMMENDATION_PREPARED` event.

Possible classifications:

- `NEEDS_CLARIFICATION` — baseline is not ready or no comparable metric is ready;
- `NO_ACTION` — the accepted measurement is within configured baseline-deviation bounds;
- `UPDATE_PREPARED` — one or more accepted measurements exceed a configured deviation threshold and human attention is suggested.

Every recommendation carries:

```text
automatic_action = false
independently_verified = false
```

No recommendation activates hardware, changes a partner/participant state, sends money or publishes a scientific conclusion.

## Outcome log

`POST /api/robots/evidence/audit/outcome`

Requires `EVIDENCE_REVIEW_TOKEN` and records a human/operator outcome against the evidence/recommendation chain.

Allowed states:

- `OBSERVED`
- `IMPROVED`
- `NO_EFFECT`
- `WORSENED`
- `INCONCLUSIVE`

Example:

```json
{
  "evidence_id": "ev_...",
  "actor_ref": "operator:example",
  "outcome": {
    "state": "INCONCLUSIVE",
    "note": "No intervention was performed; observation retained for comparison.",
    "linked_evidence_id": "ev_optional_followup"
  }
}
```

The system records the outcome; it does not claim to have performed a consequential intervention.

## Public audit projection

`GET /api/robots/evidence/arpae/history`

This endpoint exposes a sanitized public projection containing:

- evidence ID and truth label;
- observation time;
- ARPAE source/station/license/quality state;
- KPI values;
- integrity digest;
- review state and decision;
- bounded Zorgax recommendation;
- outcome state when present.

It intentionally omits reviewer identities, private review notes and private outcome notes.

The public dashboard is `/evidence-pipeline.html`.

## Truth boundaries

```text
LIVE GET ≠ PERSISTED HISTORY
MEASURED ≠ INDEPENDENTLY VERIFIED
ACCEPTED HUMAN REVIEW ≠ SCIENTIFIC VALIDATION
BASELINE ≠ CAUSAL MODEL
ZORGAX RECOMMENDATION ≠ AUTOMATIC ACTION
OUTCOME LOG ≠ SYSTEM-PERFORMED INTERVENTION
OPEN-DATA LICENSE ≠ PARTNERSHIP / ENDORSEMENT
```

## Next gate

The next material step is not to relax these boundaries. It is to accumulate accepted measurements, validate the baseline methodology with an appropriate domain reviewer, and then connect one explicitly authorised pilot/site dataset using the same append-only evidence contract.
