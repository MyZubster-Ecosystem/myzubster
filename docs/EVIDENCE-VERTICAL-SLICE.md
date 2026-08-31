# MyZubster Evidence Vertical Slice v1

**Status:** IMPLEMENTED / SAFE-BY-DEFAULT / HUMAN-GATED  
**Scope:** environmental observation → provenance → KPI → Zorgax classification → human review → public evidence surface

This vertical slice is the first concrete implementation of the evidence pipeline described in `VISION.md`.

It now has two deliberately separated source paths:

1. **SIMULATED** — synthetic EVA IONI telemetry for a safe software demonstration;
2. **MEASURED** — observed meteorological open data from **ARPAE Emilia-Romagna**.

The two source classes must never be conflated.

## First real measured source: ARPAE Emilia-Romagna

MyZubster connects to ARPAE's public dataset **“Meteo - dati osservati”**:

- dataset page: `https://dati.arpae.it/dataset/dati-dalle-stazioni-meteo-locali-della-rete-idrometeorologica-regionale`;
- near-real-time NDJSON feed: `https://dati-simc.arpae.it/opendata/osservati/meteo/realtime/realtime.jsonl`;
- provider: ARPAE Emilia-Romagna;
- license: **Creative Commons Attribution**;
- data type: observed hydro-meteorological station measurements.

ARPAE states that the published station data pass automatic plausibility/quality controls and may still change after later validation. MyZubster therefore records this source as:

```text
MEASURED
+ OPEN-DATA AUTHORIZATION
+ PROVIDER PROVENANCE
+ PROVISIONAL / SUBJECT TO LATER VALIDATION
+ HUMAN REVIEW PENDING
+ INDEPENDENTLY VERIFIED = false
```

`MEASURED` means that the values originate from a real observation source. It does **not** mean scientifically final, independently verified or validated by MyZubster.

## ARPAE adapter behavior

`src/services/arpaeMeasuredObservationService.js`:

- streams the bounded ARPAE NDJSON source;
- prefers the public `Rimini Urbana` station;
- falls back to the nearest compatible station to Rimini if the preferred station is unavailable;
- reads RMAP/BUFR-style station reports;
- maps `B12101` dry-bulb temperature from Kelvin to Celsius;
- maps `B13003` relative humidity to percent;
- ignores the known manual-invalid flag `B33196 = 1` for an affected variable;
- preserves station/network/coordinate identity in provenance;
- creates `MEASURED_PENDING_HUMAN_REVIEW` evidence through the same canonical evidence service;
- attributes reuse to the ARPAE open-data dataset and does not infer partnership or endorsement.

The source fetch is bounded by timeout and maximum response size. Source failure produces **no measured claim** and does not fall back to simulation.

## Flow

```text
ARPAE OBSERVED OPEN DATA       EVA IONI SAFE SIMULATION
          │                              │
          ▼                              ▼
      MEASURED                       SIMULATED
          └──────────────┬───────────────┘
                         ▼
                    PROVENANCE
                         ▼
                    BOUNDED KPIs
                         ▼
                  SHA-256 INTEGRITY
                         ▼
               ZORGAX CLASSIFICATION
                  UPDATE_PREPARED
                         ▼
                 HUMAN REVIEW GATE
                  ACCEPT / REJECT
                         ▼
             BOUNDED PUBLICATION REVIEW
```

## Public endpoints

- `GET /api/robots/evidence/health` — capability, governance state and connected measured-source metadata;
- `GET /api/robots/evidence/arpae/latest` — current truth-labeled ARPAE measured evidence;
- `GET /api/robots/evidence/demo` — current synthetic EVA IONI evidence;
- `/evidence-pipeline.html` — public comparison dashboard.

The ARPAE endpoint uses CDN/server cache headers and an in-process 15-minute cache to avoid unnecessary upstream requests.

## Protected endpoints

### `POST /api/robots/evidence/ingest`

Requires a bearer token matching one of:

- `EVIDENCE_INGEST_TOKEN`;
- `ROBOT_SIMULATION_TOKEN`;
- `CRON_SECRET`.

It prepares and returns an evidence record but does not persist or publish it automatically.

A `MEASURED` request is rejected unless:

- `authorization.confirmed === true`;
- `authorization.scope` is present;
- `authorization.reference` is present;
- `provenance.source_id` is present;
- `provenance.observed_at` is a valid date;
- at least one supported bounded numeric KPI is present.

### `POST /api/robots/evidence/review`

Requires `EVIDENCE_REVIEW_TOKEN` and accepts only an untampered evidence record plus an explicit `ACCEPT` or `REJECT` decision.

Human acceptance does **not** make a record independently verified and does not change its source class:

```text
SIMULATED → SIMULATED_HUMAN_REVIEWED
MEASURED  → MEASURED_HUMAN_REVIEWED
```

The `claims.verified` flag remains `false`.

## Supported KPIs

| Key | Range | Unit |
|---|---:|---|
| `temperature_c` | -50..80 | C |
| `relative_humidity_pct` | 0..100 | pct |
| `soil_moisture_pct` | 0..100 | pct |
| `battery_pct` | 0..100 | pct |

The ARPAE v1 adapter currently promotes only temperature and relative humidity because those fields have a documented direct mapping into the canonical schema. Additional ARPAE variables can be added only with explicit unit/timerange semantics and tests.

## Integrity and truth boundaries

Each prepared record contains a SHA-256 digest covering evidence identity, source class, truth label, provenance, KPI values, authorization, claims, Zorgax state and review state.

The implementation intentionally enforces:

```text
SIMULATION ≠ MEASUREMENT
MEASUREMENT ≠ FINAL VALIDATION
HUMAN REVIEW ≠ INDEPENDENT VERIFICATION
OPEN-DATA LICENSE ≠ PARTNERSHIP OR ENDORSEMENT
PREPARED RECORD ≠ PERSISTED RECORD
API RESPONSE ≠ EXTERNAL SCIENTIFIC VALIDATION
SOURCE FAILURE → NO MEASURED CLAIM
```

No endpoint in this slice activates robot hardware, controls actuators, sends payments, changes LIFE partner/participant states, auto-merges GitHub changes or publishes private source data.

## Next gate

With an authorized real source now connected, the next meaningful milestone is **persistence + explicit human review + sanitized historical evidence**:

1. retain selected measured evidence records in a bounded append-only store;
2. record reviewer decisions without rewriting the original source truth;
3. expose a small history/dashboard that separates `MEASURED_PENDING_HUMAN_REVIEW`, `MEASURED_HUMAN_REVIEWED` and future independently verified states;
4. add an independent validation layer only when a genuinely independent source/method exists.
