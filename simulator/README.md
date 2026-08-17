# Eva Ioni Telemetry Simulator

Reproducible telemetry simulator for the MyZubster Space Station MVP. It
generates realistic Eva Ioni robot telemetry and periodically submits it to the
Space Station telemetry API.

## Quick start

```bash
# Submit one sample to the default local endpoint
TELEMETRY_ONCE=1 python simulator/eva_ioni_simulator.py

# Continuous simulation against a remote Space Station API
TELEMETRY_API_URL=https://your-space-station.example.com/api/telemetry \
TELEMETRY_UPDATE_INTERVAL=5 \
ROBOT_ID=eva-ioni-001 \
python simulator/eva_ioni_simulator.py
```

## Configuration (environment variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEMETRY_API_URL` | `http://localhost:3009/api/telemetry` | Telemetry endpoint (POST) |
| `TELEMETRY_UPDATE_INTERVAL` | `5` | Seconds between submissions |
| `ROBOT_ID` | `eva-ioni-001` | Robot / device identifier |
| `TELEMETRY_MAX_RETRIES` | `5` | Max retries per failed submission |
| `TELEMETRY_RETRY_BACKOFF` | `2` | Initial backoff (seconds), doubles each retry |
| `TELEMETRY_ONCE` | `false` | Submit a single sample then exit |

## Telemetry payload

Each submission is a JSON document posted to the endpoint:

```json
{
  "robotId": "eva-ioni-001",
  "temperature": 24.5,
  "humidity": 55.0,
  "battery": 87.0,
  "cpuTemperature": 48.2,
  "signalStrength": -62,
  "status": "exploring",
  "timestamp": "2026-08-16T04:00:00Z",
  "source": "simulator"
}
```

## Resilience

HTTP failures are handled without crashing the simulator. On failure the
simulator retries with exponential backoff (capped at 60s) up to
`TELEMETRY_MAX_RETRIES` times before dropping the sample and continuing with the
next interval.
