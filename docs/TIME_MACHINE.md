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
        |
        v
/time-machine visual timeline + map
```

## Connected domains

Snapshots may contain four canonical top-level domains:

```json
{
  "plants": [],
  "sensors": [],
  "maps": [],
  "robots": []
}
```

Each record should keep its own identifiers, status, timestamps, provenance and — when geographic display is intended — recorded coordinates. Unknown coordinates must remain absent rather than being guessed.

Suggested classifications for records include:

- `recorded-physical-state` — evidence directly recorded from an authorized physical observation/device;
- `recorded-public-state` — public application/repository state captured as evidence;
- `derived-state` — computed from named source records and reproducible logic;
- `simulation` — simulator/test data that must never be presented as physical history;
- `proposed` — roadmap or planned state, not historical fact.

## API

- `GET /api/time-machine` — module information and latest snapshot.
- `GET /api/time-machine/snapshots` — ordered snapshot history.
- `GET /api/time-machine/at?timestamp=<ISO-8601>` — state recorded at or immediately before a timestamp.
- `GET /api/time-machine/snapshots/:id` — one snapshot plus SHA-256 integrity verification.
- `GET /api/time-machine/domains/:domain/at?timestamp=<ISO-8601>` — recorded state for `plants`, `sensors`, `maps` or `robots` at a given time.
- `GET /api/time-machine/compare?from=<ISO-8601>&to=<ISO-8601>&domain=<domain>` — compare two recorded points in time.

The API is deliberately read-only in this MVP. Public HTTP clients cannot create or rewrite historical snapshots.

## Visual interface

Open:

```text
/time-machine
```

The visual explorer provides:

- a slider across actual stored snapshots;
- previous/next navigation;
- filters for plants, sensors, maps and robots;
- an OpenStreetMap/Leaflet historical view for records that contain coordinates;
- raw recorded state cards for transparency;
- explicit empty-state handling when a date/domain has no evidence.

The slider moves between **recorded snapshots**, not arbitrary synthesized dates. If no snapshot exists for a period, the UI does not interpolate or invent missing history.

## Creating a snapshot

Prepare a JSON file containing only public or explicitly authorized state, preferably using [`data/time-machine/example-domain-state.json`](../data/time-machine/example-domain-state.json) as the connected-domain template, then run:

```bash
npm run time-machine:snapshot -- --input ./state.json --label "Garden state" --source "public-observation-export"
```

The generator appends a record containing:

- a unique snapshot id;
- an ISO-8601 recording timestamp;
- a classification;
- provenance metadata;
- the supplied state object;
- a SHA-256 fingerprint of the snapshot payload.

Commit the resulting `data/time-machine/snapshots.json` change through normal Git review. The Git commit then becomes an additional provenance layer around the snapshot.

## Evidence boundaries

A Time Machine snapshot proves only what its evidence can support.

- A SHA-256 value identifies the exact snapshot payload; it does not prove that every statement inside the payload is true.
- A Git commit records repository history; it does not prove a physical-world event by itself.
- A photo, sensor record or map feature should retain its own provenance and verification state.
- Proposed, simulated, experimental and production states must remain explicitly distinguished.
- Unknown values must remain unknown rather than being reconstructed by assumption.
- Geographic coordinates are displayed only when explicitly present in the recorded state.

## Future extensions

Possible later phases include IPFS/CID publication, signed manifests, animated map deltas, automatic snapshot composition from verified public exports, garden/plant/robot replay and cross-repository timeline composition.
