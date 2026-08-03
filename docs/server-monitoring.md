# Server Monitoring and Auto-Recovery

This adds production-oriented monitoring for the MyZubster backend.

## Endpoints

- `GET /health` returns backend, MongoDB, and SSH status.
- `GET /api/monitoring/status` returns the raw monitoring snapshot.
- `GET /api/monitoring/dashboard` returns service status, incidents, and recent logs.
- `GET /monitoring` serves a lightweight dashboard page.
- `POST /api/monitoring/recover` previews recovery actions by default. Send `{ "execute": true }` to run them.

## Auto-Recovery

Set these environment variables on the server:

```bash
MONITOR_AUTO_RECOVERY=true
MONITOR_RECOVERY_MODE=pm2
PM2_APP_NAME=myzubster-backend
MONITOR_SSH_HOST=127.0.0.1
MONITOR_SSH_PORT=22
```

Use the bundled PM2 config:

```bash
cd backend
pm2 start ecosystem.config.js
pm2 save
```

For systemd-based recovery, set `MONITOR_RECOVERY_MODE=systemd` and configure:

```bash
SYSTEMD_BACKEND_SERVICE=myzubster-backend
SYSTEMD_MONGO_SERVICE=mongod
SYSTEMD_SSH_SERVICE=ssh
```

## Alerts

Slack and Telegram alerts are optional. Configure either channel:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

## Logs

Application request logs and monitoring events are written as JSON lines to `backend/logs/monitoring.log` by default. The file rotates automatically when it reaches `MONITOR_LOG_MAX_BYTES`.

## One-Shot Check

Run a single monitoring pass:

```bash
cd backend
node src/monitor.js
```

Run the same check and execute recovery actions when services are unhealthy:

```bash
cd backend
node src/monitor.js --execute
```
