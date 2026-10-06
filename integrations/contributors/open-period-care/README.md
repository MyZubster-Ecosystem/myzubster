# Open Period Care contributor bridge

This directory contains the first MyZubster-side read-only adapter for an independent contributor project.

## Purpose

The bridge connects the public Open Period Care research package maintained by **@khongten124** to the MyZubster knowledge layer without copying ownership, changing upstream evidence, or granting infrastructure access.

The adapter:

1. reads the canonical MyZubster contributor registry;
2. fetches the three public upstream research artifacts;
3. preserves repository, branch, commit, path and a SHA-256 digest for provenance;
4. emits normalized `myzubster.contributor-knowledge-record.v1` JSON records;
5. preserves source evidence states such as `PROPOSED` and `SUPPORTED` instead of promoting them to stronger states.

## Canonical upstream checkpoint

- repository: `khongten124/myzubster`
- branch: `feat/open-period-care-research-1450`
- commit: `17cf7ca0a941d10e184771e574683785c1dbc8bf`
- artifacts:
  - `docs/pilots/open-period-care/README.md`
  - `docs/pilots/open-period-care/evidence-matrix.md`
  - `docs/pilots/open-period-care/knowledge-cards.md`

## Run

```bash
python3 integrations/contributors/open-period-care/open_period_care_bridge.py
```

The command emits one JSON object per source document.

## Test

```bash
python3 -m unittest integrations/contributors/open-period-care/tests/test_open_period_care_bridge.py
```

The unit tests are network-free and verify provenance retention, deterministic hashing, read-only source enumeration, and preservation of evidence-state boundaries.

## Evidence boundary

This bridge is a **technical interoperability adapter**. It does not establish medical, clinical, laboratory, professional or regulatory validation. In particular, source content marked `SUPPORTED` is literature/standards support, not a technical `TESTED` result and not accredited `VERIFIED` evidence.

A later live run against the public upstream artifacts can be recorded as:

`TESTED — Open Period Care public evidence successfully fetched and normalized through the MyZubster contributor bridge`

That status would apply only to the bridge behavior, not to the underlying scientific or product claims.
