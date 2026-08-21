# MyZubster Time Machine

MyZubster Time Machine is a read-only historical-state reconstruction layer for public and authorized project data.

It is **not** a claim of physical time travel. It records selected project states as timestamped evidence snapshots so that a later client can ask: **what did MyZubster record at or before a given time?**

## Program structure

The Time Machine program has two separate but interoperable layers:

1. **Digital Time Machine** — this repository and PR implement timestamped snapshot storage, integrity verification, historical lookup, comparison and visual replay.
2. **Physical Time Machine Demonstrator v1** — tracked in `MyZubster-Robot`, it measures real temporal phenomena and exports public-safe physical measurements into the digital snapshot format.

Physical program links:

- [Epic #135 — Open-Source Physical Time Machine Demonstrator v1](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/135)
- [#136 — precision clock and drift measurement](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/136)
- [#137 — propagation delay and time-of-flight demonstrator](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/137)
- [#138 — synchronized physical sensor-state recorder](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/138)
- [#139 — robot/device telemetry bridge and historical replay](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/139)
- [#140 — completion bounty](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/140) — external settlement currently **UNFUNDED**; 2,500 MYZ is an internal reward/accounting amount contingent on verification.

The physical demonstrator does **not** claim backward time travel, faster-than-light propagation or alteration of past events. Its scope is reproducible measurement of clock drift, synchronization offset, signal propagation delay/time-of-flight, timestamped sensor state and robot/device telemetry.

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

Physical measurements can enter the same model only after they are exported with explicit timestamp source, device/source identity, calibration context, uncertainty where applicable and a classification that distinguishes direct measurement from simulation or derivation.

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

## Physical measurement ingestion requirements

For data produced by the Physical Time Machine program, a public-safe snapshot should retain, where applicable:

- measurement timestamp and declared time reference;
- device/source identifier;
- raw measurement value;
- measurement unit;
- calibration reference or procedure;
- uncertainty/error estimate or known limitations;
- physical-vs-simulation classification;
- public-safe provenance;
- optional coordinates only when explicitly authorized for publication.

Derived values should point back to their raw source records and reproducible calculation method. Measurement noise must not be interpreted as evidence of unsupported physics.

## Evidence boundaries

A Time Machine snapshot proves only what its evidence can support.

- A SHA-256 value identifies the exact snapshot payload; it does not prove that every statement inside the payload is true.
- A Git commit records repository history; it does not prove a physical-world event by itself.
- A photo, sensor record or map feature should retain its own provenance and verification state.
- Proposed, simulated, experimental and production states must remain explicitly distinguished.
- Unknown values must remain unknown rather than being reconstructed by assumption.
- Geographic coordinates are displayed only when explicitly present in the recorded state.
- A measured clock offset or propagation delay is evidence of that measured phenomenon; it is not evidence of backward time travel.

## Bounty boundary

Physical completion bounty [MyZubster-Robot #140](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/140) is currently **UNFUNDED for external settlement**. Its stated **2,500 MYZ** is an internal MyZubster reward/accounting amount to be recorded only after successful verification. A merge, issue closure, screenshot, hash or dataset alone does not prove bounty completion or payment.

## Future extensions

Possible later phases include IPFS/CID publication, signed manifests, animated map deltas, automatic snapshot composition from verified public exports, garden/plant/robot replay, physical measurement adapters and cross-repository timeline composition.
