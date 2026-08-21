# MyZubster Time Machine

MyZubster Time Machine is a read-only historical-state reconstruction layer for public and authorized project data.

It is **not** a claim of physical time travel. It records selected project states as timestamped evidence snapshots so that a later client can ask: **what did MyZubster record at or before a given time?**

## MVP model

```text
public / authorized state
        |
        v
snapshot generator
        |
        v
recordedAt + provenance + state
        |
        v
SHA-256 integrity fingerprint
        |
        v
data/time-machine/snapshots.json
        |
        v
GET /api/time-machine/*
```

## Connected domains

The Time Machine now defines four canonical historical domains:

- `plants` — plant/green observations and related recorded state;
- `sensors` — authorized IoT/environmental readings;
- `maps` — public-safe geographic features and map state;
- `robots` — robot/simulator state that is explicitly recorded and classified.

A snapshot can store them under:

```json
{
  "domains": {
    "plants": {},
    "sensors": {},
    "maps": {},
    "robots": {}
  }
}
```

See `data/time-machine/example-domain-state.json` for the canonical empty template.

Each domain should preserve its own `classification` and `sourceRefs` where practical. Recorded physical data, simulations and derived/inferred data must not be silently mixed.

## API

- `GET /api/time-machine` — module information, supported domains and latest snapshot.
- `GET /api/time-machine/snapshots` — ordered snapshot history.
- `GET /api/time-machine/at?timestamp=<ISO-8601>` — full state recorded at or immediately before a timestamp.
- `GET /api/time-machine/domains/:domain/at?timestamp=<ISO-8601>` — historical state for one of `plants`, `sensors`, `maps` or `robots`.
- `GET /api/time-machine/compare?from=<ISO-8601>&to=<ISO-8601>&domain=<optional-domain>` — compare two recorded states and indicate whether the serialized state changed.
- `GET /api/time-machine/snapshots/:id` — one snapshot plus SHA-256 integrity verification.

The API is deliberately read-only in this MVP. Public HTTP clients cannot create or rewrite historical snapshots.

The comparison endpoint reports changes in **recorded snapshot state only**. It does not infer an event merely because data was absent from an earlier snapshot.

## Creating a snapshot

Prepare a JSON file containing only public or explicitly authorized state. For the connected-domain model you can copy `data/time-machine/example-domain-state.json`, populate only supported evidence, then run:

```bash
npm run time-machine:snapshot -- --input ./state.json --label "Garden + robot state" --source "public-observation-export"
```

The generator appends a record containing:

- a unique snapshot id;
- an ISO-8601 recording timestamp;
- a classification;
- provenance metadata;
- the supplied state object;
- a SHA-256 fingerprint of the snapshot payload.

Commit the resulting `data/time-machine/snapshots.json` change through normal Git review. The Git commit then becomes an additional provenance layer around the snapshot.

## Example history flow

```text
plant / sensor / map / robot source
            |
            v
public-safe export
            |
            v
Time Machine snapshot
            |
            +--> SHA-256
            +--> provenance/sourceRefs
            +--> Git history
            |
            v
historical API / comparison
```

A future UI can therefore select a date and ask, for example:

```text
/api/time-machine/domains/plants/at?timestamp=2026-08-21T08:00:00Z
/api/time-machine/domains/robots/at?timestamp=2026-08-21T08:00:00Z
/api/time-machine/compare?from=2026-08-20T08:00:00Z&to=2026-08-21T08:00:00Z&domain=maps
```

## Evidence boundaries

A Time Machine snapshot proves only what its evidence can support.

- A SHA-256 value identifies the exact snapshot payload; it does not prove that every statement inside the payload is true.
- A Git commit records repository history; it does not prove a physical-world event by itself.
- A photo, sensor record or map feature should retain its own provenance and verification state.
- Proposed, simulated, experimental and production states must remain explicitly distinguished.
- Robot simulation must never be presented as physical robot telemetry unless physical validation is separately documented.
- A map feature must not expose sensitive/private coordinates merely to make a historical snapshot more detailed.
- Unknown values must remain unknown rather than being reconstructed by assumption.

## Next extensions

The next phases can add IPFS/CID publication, signed manifests, a visual date slider, map deltas, charted sensor history and snapshot composition across multiple MyZubster repositories.
