# Space Station Telemetry Dashboard

Self-contained web dashboard for the MyZubster Space Station MVP. Consumes the
telemetry API (`GET /api/telemetry`) and renders current + historical robot
telemetry without any build step or framework.

## Usage

Open `telemetry.html` in any desktop browser, or serve it statically:

```bash
npx serve frontend/dashboard-public
```

The dashboard fetches from `/api/telemetry` by default. To point at a different
Space Station API, set `window.TELEMETRY_API_URL` before the script runs, or edit
the `API_URL` constant at the top of the inline script.

## Features

- Robot/device identification
- Current temperature, humidity, and battery with visual bars
- Historical telemetry table with status badges
- Automatic refresh (5s)
- Clear API/network error banner with retry
- Responsive layout for desktop and mobile
- No credentials or secrets committed
