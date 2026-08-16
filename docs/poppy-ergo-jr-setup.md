# Poppy Ergo Jr — Space Station integration

This document explains how to connect a physical **Poppy Ergo Jr** robotic arm to
the MyZubster Space Station and how to distinguish real (Poppy) telemetry from
simulated (Eva Ioni) telemetry.

## Architecture

```
                       ┌────────────────────────────┐
                       │      Space Station API     │
                       │   /api/robot/*  (Express)  │
                       └────────────┬───────────────┘
                                    │ RobotService (abstraction)
                    ┌───────────────┴────────────────┐
                    │                                │
        ┌───────────▼───────────┐        ┌───────────▼───────────┐
        │  PoppyErgoJrDriver    │        │    SimulatedRobot     │
        │  (real, HTTP to pypot)│        │   (Eva Ioni, offline) │
        └───────────┬───────────┘        └───────────────────────┘
                    │ HTTP :6969
        ┌───────────▼───────────┐
        │  pypot REST API       │
        │  (on Raspberry Pi)    │
        └───────────────────────┘
```

- `backend/src/robot/RobotService.js` — registry + uniform status/command/telemetry API.
- `backend/src/robot/PoppyErgoJrDriver.js` — real Poppy driver over pypot REST API.
- `backend/src/robot/SimulatedRobot.js` — deterministic Eva Ioni simulator.
- `backend/src/routes/robot.js` — Express routes + HTML dashboard.
- `backend/src/models/RobotTelemetry.js` — Mongoose persistence of telemetry samples.

## Simulated vs real telemetry

Every telemetry sample carries a `source` field:

| `source`               | Meaning                                    |
|------------------------|--------------------------------------------|
| `poppy`                | Real hardware (Poppy Ergo Jr via pypot)    |
| `eva-ioni-simulated`   | Deterministic offline simulator            |

Consumers can branch on `source` to apply different thresholds or UI badges.

## Requirements

- Poppy Ergo Jr arm assembled and wired (Dynamixel XL-320 motors).
- Raspberry Pi (or any Linux device) with [pypot](https://docs.poppy-project.org/)
  installed and `poppy-ergo-jr` configured.
- Node.js 18+ for the Space Station backend.

## 1. Start pypot on the robot controller

```bash
# On the Raspberry Pi / controller
pip install poppy-ergo-jr
poppy-ergo-jr
# pypot REST API is now listening on http://<pi-host>:6969
```

## 2. Configure the Space Station backend

Set the environment variables to register the real driver:

```bash
POPPY_ENABLE=true
POPPY_HOST=192.168.1.50      # IP of the Raspberry Pi
POPPY_PORT=6969
```

Without `POPPY_ENABLE`/`POPPY_HOST` the backend only registers the Eva Ioni
simulator, so development works offline.

## 3. Run the backend

```bash
cd backend
npm install
npm start          # listens on :3009
```

## 4. Use the API

```bash
# List robots and their simulated/real flag
curl http://localhost:3009/api/robot/status

# Real Poppy telemetry
curl http://localhost:3009/api/robot/telemetry/poppy-ergo-jr

# Move the arm to target angles
curl -X POST http://localhost:3009/api/robot/command \
  -H 'Content-Type: application/json' \
  -d '{"robot":"poppy-ergo-jr","command":"move_to","params":{"motors":{"m1":45,"m2":30,"m3":-20},"duration":2000}}'
```

## 5. Open the dashboard

Visit `http://localhost:3009/api/robot/dashboard` for a self-contained HTML
dashboard that shows robot status, telemetry, and a command button with a
simulated/real badge.

## pypot endpoints used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/motors/list.json` | GET | list motor names |
| `/motors/<motor>/registers/<register>/value.json` | GET | read a register |
| `/motors/<motor>/registers/<register>/value.json` | POST | write a register |
| `/motors/goto.json` | POST | move multiple motors to target angles |

## Streaming (WebSocket) extension

The current driver polls motor registers over HTTP, which is the interface pypot
natively exposes. For higher-frequency streaming, replace the polling loop in
`PoppyErgoJrDriver.getTelemetry()` with a WebSocket/zmq subscriber that pushes
samples into the same `{ source, robot, timestamp, motors }` shape — no changes
to `RobotService` or the route layer are required.
