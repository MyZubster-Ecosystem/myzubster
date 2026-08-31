# MyZubster Evidence Vertical Slice v1

**Status:** IMPLEMENTED / SAFE-BY-DEFAULT / HUMAN-GATED  
**Scope:** environmental observation → provenance → KPI → Zorgax classification → human review → public demo

This vertical slice is the first concrete implementation of the evidence pipeline described in `VISION.md`.

It is deliberately small and truth-labeled. The public demo uses **synthetic EVA IONI simulation telemetry**. The same service can prepare a record from an authorized real measurement, but real measurements are not accepted unless explicit authorization and provenance metadata are present.

## Flow

```text
AUTHORIZED INPUT OR SAFE SIMULATION
            ↓
       SOURCE CLASS
   SIMULATED / MEASURED
            ↓
         PROVENANCE
 source id + observed time
            ↓
       BOUNDED KPI SET
 temperature / humidity /
 soil moisture / battery
            ↓
    SHA-256 INTEGRITY DIGEST
            ↓
     ZORGAX CLASSIFICATION
       UPDATE_PREPARED
            ↓
       HUMAN REVIEW GATE
        ACCEPT / REJECT
            ↓
 BOUNDED PUBLICATION REVIEW
```

## Public endpoints

- `GET /api/evidence/health` — capability and governance state;
- `GET /api/evidence/demo` — live synthetic EVA IONI evidence record;
- `/evidence-pipeline` — public dashboard for the demo record.

## Protected endpoints

### `POST /api/evidence/ingest`

Requires a bearer token matching one of:

- `EVIDENCE_INGEST_TOKEN`;
- `ROBOT_SIMULATION_TOKEN`;
- `CRON_SECRET`.

The endpoint is stateless: it prepares and returns an evidence record but does not persist or publish it automatically.

Example simulated input:

```json
{
  "source_class": "SIMULATED",
  "context": "simulation test",
  "provenance": {
    "source_id": "EVA-IONI:simulation-runtime-v1",
    "observed_at": "2026-08-31T07:30:00.000Z"
  },
  "telemetry": {
    "temperature_c": 22.4,
    "relative_humidity_pct": 60,
    "soil_moisture_pct": 49
  }
}
```

Example measured input:

```json
{
  "source_class": "MEASURED",
  "context": "authorized environmental pilot observation",
  "provenance": {
    "source_id": "sensor-001",
    "observed_at": "2026-08-31T07:30:00.000Z"
  },
  "authorization": {
    "confirmed": true,
    "scope": "environmental observation only",
    "reference": "AUTH-REFERENCE-001"
  },
  "telemetry": {
    "temperature_c": 21.7,
    "relative_humidity_pct": 63,
    "soil_moisture_pct": 52
  }
}
```

A `MEASURED` request is rejected unless:

- `authorization.confirmed === true`;
- `authorization.scope` is present;
- `authorization.reference` is present;
- `provenance.source_id` is present;
- `provenance.observed_at` is a valid date;
- at least one supported bounded numeric KPI is present.

### `POST /api/evidence/review`

Requires `EVIDENCE_REVIEW_TOKEN`.

The endpoint accepts an untampered evidence record and an explicit human review:

```json
{
  "evidence": { "...": "record returned by ingest/demo" },
  "review": {
    "decision": "ACCEPT",
    "reviewer_ref": "maintainer:example",
    "note": "accepted for bounded downstream use"
  }
}
```

Review decisions are `ACCEPT` or `REJECT`.

Human acceptance does **not** make a record independently verified and does not change its source class:

```text
SIMULATED → SIMULATED_HUMAN_REVIEWED
MEASURED  → MEASURED_HUMAN_REVIEWED
```

The `claims.verified` flag remains `false`. A future independent verification layer must be separate and evidence-backed.

## Supported KPIs

| Key | Range | Unit |
|---|---:|---|
| `temperature_c` | -50..80 | C |
| `relative_humidity_pct` | 0..100 | pct |
| `soil_moisture_pct` | 0..100 | pct |
| `battery_pct` | 0..100 | pct |

Unknown fields are not promoted into KPI output. Out-of-range values fail closed.

## Integrity

Each prepared record contains a SHA-256 digest covering its evidence identity, source class, truth label, provenance, KPI values and authorization state.

The human-review service checks the digest before accepting the record. If a KPI or other covered field is changed after preparation, review fails.

This is an integrity check for the prepared payload, not a cryptographic proof that an external physical measurement actually occurred.

## Truth boundaries

The implementation intentionally enforces:

```text
SIMULATION ≠ MEASUREMENT
HUMAN REVIEW ≠ INDEPENDENT VERIFICATION
PREPARED RECORD ≠ PERSISTED RECORD
API RESPONSE ≠ PUBLICATION
MEASURED CLAIM ≠ AUTHORIZED INPUT WITHOUT EVIDENCE
```

No endpoint in this slice:

- activates robot hardware;
- controls actuators;
- sends payments;
- changes partner or participant states;
- auto-merges GitHub changes;
- publishes private source data;
- declares external scientific validation.

## Next gate

The next meaningful milestone is to connect **one genuinely authorized sensor or dataset source** to `POST /api/evidence/ingest`, preserve a safe authorization reference, run the human review gate, and publish only a sanitized evidence record/dashboard state.

Until an authorized external source is connected, the public demonstration must remain labeled `SIMULATED`.
