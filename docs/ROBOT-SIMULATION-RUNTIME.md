# MyZubster Robot Simulation Runtime

Status target: **SIMULATION ACTIVE**.

This runtime makes EVA IONI and MyZubster Robot observable as software simulations without implying that physical robots are connected or actuating hardware.

## Public endpoints

- `GET /api/robots/health` — capability and safety boundary.
- `GET /api/robots/status` — current request-driven synthetic heartbeat for both robot identities.
- `GET /api/robots/simulation/pulse` — safe synthetic pulse used for runtime probes and observability.

## Authenticated simulation ingest

`POST /api/robots/simulation/telemetry` accepts only `mode: "simulation"` and requires `Authorization: Bearer <ROBOT_SIMULATION_TOKEN or CRON_SECRET>`.

Physical command-like fields are rejected. The endpoint does not perform movement, irrigation, relay control, settlement or payment.

## Scheduled pulse

Vercel invokes `GET /api/robots/simulation/cron` daily. The route is protected by the existing `CRON_SECRET` convention and emits a structured `[robot-sim] fleet pulse` runtime log.

## State semantics

- `ONLINE / WEB`: website/API is deployed.
- `SIMULATION_ACTIVE`: the deployed simulation runtime can generate observable synthetic heartbeats/telemetry while actuators remain disabled.
- `HARDWARE_CONNECTED`: reserved for a real authenticated controller heartbeat with evidence.
- `PHYSICAL_PILOT`: reserved for bounded physical actuation after safety review, E-stop/manual override verification and published sanitized test evidence.

`SIMULATION_ACTIVE` is not evidence of a physical robot, autonomous payment authority, wallet custody, autonomous purchasing or autonomous contracting.
