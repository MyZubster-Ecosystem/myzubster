# Zorgax LIFE Automation v1 — Synthetic Vertical Slice Demo

This demo exercises the Phase 1 evidence pipeline from synthetic input through human review gates to `REPORTABLE` export.

## Run

```bash
node examples/zorgax-life-demo/run.js
```

## Flow

```text
synthetic JSON
  → ingest
  → schema check
  → normalization
  → deterministic fingerprint / dedupe
  → provenance
  → DRAFT_EVIDENCE
  → technical review
  → scientific review
  → authorized human validation
  → REPORTABLE export
```

The runner writes `examples/zorgax-life-demo/output.reportable.json` locally. That output is intentionally not committed because it includes a run timestamp and can be regenerated deterministically apart from timestamps.

## Dataset

`synthetic-water.json` contains demo-only water measurements. It is not partner data and must not be interpreted as a real measurement, scientific result or pilot result.

## API equivalent

The same Phase 1 pipeline is exposed at:

- `GET /api/zorgax/life/status`
- `POST /api/zorgax/life/ingest`
- `POST /api/zorgax/life/ingest.csv`
- `POST /api/zorgax/life/review`
- `POST /api/zorgax/life/validate`
- `POST /api/zorgax/life/reportable`

Phase 1 accepts synthetic/demo data only.

## Guardrails

- missing required fields route to `MISSING_CONTEXT`;
- anomalies route to `ANOMALY_REVIEW`;
- duplicate fingerprints become `SUPERSEDED`;
- technical and scientific review gates cannot be skipped;
- only `VALIDATED` records may become `REPORTABLE`;
- `restricted` records cannot become reportable;
- no real partner data belongs in this demo.
