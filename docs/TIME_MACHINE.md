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

## API

- `GET /api/time-machine` — module information and latest snapshot.
- `GET /api/time-machine/snapshots` — ordered snapshot history.
- `GET /api/time-machine/at?timestamp=<ISO-8601>` — state recorded at or immediately before a timestamp.
- `GET /api/time-machine/snapshots/:id` — one snapshot plus SHA-256 integrity verification.

The API is deliberately read-only in this MVP. Public HTTP clients cannot create or rewrite historical snapshots.

## Creating a snapshot

Prepare a JSON file containing only public or explicitly authorized state, then run:

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

## Future extensions

Possible later phases include IPFS/CID publication, signed manifests, visual timeline comparison, garden/plant/robot replay, map deltas and snapshot composition across multiple MyZubster repositories.
