# 🐳 MyZubster Ecosystem — Docker Deployment Guide

One-command deployment for the entire MyZubster ecosystem: frontend, backend, gateway, marketplace, AI automation, and MongoDB.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Service Architecture](#service-architecture)
- [Port Mapping](#port-mapping)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [Data Persistence](#data-persistence)
- [Logs & Debugging](#logs--debugging)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster
```

### 2. Create your environment file

```bash
cp .env.docker .env
# Edit .env with your settings (at minimum, change passwords)
```

### 3. Start everything

```bash
docker compose up -d
```

That's it! All 6 services will build and start.

### 4. Verify it's running

```bash
# Check all containers
docker compose ps

# Check health
curl http://localhost:3009/health

# View logs
docker compose logs -f
```

### 5. Stop

```bash
docker compose down          # Stop containers
docker compose down -v       # Stop + remove volumes (⚠️ deletes data)
```

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MyZubster Ecosystem                     │
├─────────────┬──────────────┬──────────────┬─────────────────┤
│  Frontend   │   Backend    │   Gateway    │   Marketplace   │
│  (React +   │  (Node.js +  │  (Express +  │  (Express +     │
│   nginx)    │  Express +   │  MongoDB +   │   SQLite)       │
│  Port 3000  │  Mongoose)   │  Monero)     │  Port 4000      │
│             │  Port 3009   │  Port 3001   │                 │
├─────────────┴──────┬───────┴──────────────┴─────────────────┤
│                    │                                         │
│            ┌───────▼────────┐    ┌──────────────────┐       │
│            │    MongoDB     │    │  AI Automation   │       │
│            │   (mongo:7)    │    │  (Node.js +      │       │
│            │  Port 27017    │    │   Telegram Bot)  │       │
│            │                │    │  Port 5000       │       │
│            └────────────────┘    └──────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Service Descriptions

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Frontend** | React + nginx | Web UI with interactive garden maps (react-leaflet) |
| **Backend** | Node.js + Express + Mongoose | Core API — gardens, messages, plant data |
| **Gateway** | Node.js + Express | API gateway with JWT auth + Monero payment processor |
| **Marketplace** | Node.js + Express + SQLite | Skills and services marketplace |
| **AI Automation** | Node.js + Express | Telegram bot + GitHub automation + cron jobs |
| **MongoDB** | mongo:7 | Primary database for all services |

---

## Port Mapping

| Service | Container Port | Host Port | URL |
|---------|---------------|-----------|-----|
| Frontend | 80 | `FRONTEND_PORT` (default: 3000) | http://localhost:3000 |
| Backend | 3009 | `BACKEND_PORT` (default: 3009) | http://localhost:3009 |
| Gateway | 3001 | `GATEWAY_PORT` (default: 3001) | http://localhost:3001 |
| Marketplace | 4000 | `MARKETPLACE_PORT` (default: 4000) | http://localhost:4000 |
| AI Automation | 5000 | `AI_AUTOMATION_PORT` (default: 5000) | http://localhost:5000 |
| MongoDB | 27017 | `MONGO_PORT` (default: 27017) | mongodb://localhost:27017 |

To change a port, set the corresponding variable in your `.env` file:

```env
FRONTEND_PORT=8080
BACKEND_PORT=8090
```

---

## Environment Variables

Copy `.env.docker` to `.env` and customize:

### Required (change from defaults!)

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_INITDB_ROOT_PASSWORD` | `changeme_in_production` | MongoDB root password |
| `JWT_SECRET` | `changeme_in_production` | JWT signing secret for Gateway |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_INITDB_ROOT_USERNAME` | `myzubster` | MongoDB root username |
| `MONGO_INITDB_DATABASE` | `myzubster` | MongoDB database name |
| `BACKEND_PORT` | `3009` | Backend host port |
| `FRONTEND_PORT` | `3000` | Frontend host port |
| `GATEWAY_PORT` | `3001` | Gateway host port |
| `MARKETPLACE_PORT` | `4000` | Marketplace host port |
| `AI_AUTOMATION_PORT` | `5000` | AI Automation host port |
| `MONGO_PORT` | `27017` | MongoDB host port |
| `REACT_APP_API_URL` | `http://localhost:3009` | Frontend → Backend URL |
| `TELEGRAM_BOT_TOKEN` | _(empty)_ | Telegram bot token for AI automation |
| `GITHUB_TOKEN` | _(empty)_ | GitHub token for AI automation |

---

## Production Deployment

For production, use the production override file:

```bash
# 1. Create a production .env with real secrets
cp .env.docker .env
vim .env  # set real passwords, JWT secret, etc.

# 2. Start with production overrides
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production overrides include:

- **`restart: always`** — containers auto-restart on crash or server reboot
- **Resource limits** — CPU and memory caps per service to prevent runaway processes
- **Structured logging** — JSON log driver with rotation (50 MB × 5 files)
- **Required secrets** — the prod file uses `${VAR:?error}` syntax so startup fails fast if secrets are missing

### Resource Requirements (minimum)

| Component | CPU | RAM |
|-----------|-----|-----|
| MongoDB | 0.5 cores | 512 MB |
| Backend | 0.25 cores | 128 MB |
| Frontend | 0.1 cores | 64 MB |
| Gateway | 0.25 cores | 128 MB |
| Marketplace | 0.1 cores | 64 MB |
| AI Automation | 0.25 cores | 128 MB |
| **Total** | **~1.5 cores** | **~1 GB** |

---

## Data Persistence

Three named Docker volumes ensure data survives container restarts:

| Volume | Service | Contents |
|--------|---------|----------|
| `mongodb_data` | MongoDB | Database files |
| `mongodb_config` | MongoDB | Configuration |
| `marketplace_data` | Marketplace | SQLite database |

### Backup

```bash
# Backup MongoDB
docker exec myzubster-mongodb mongodump --archive --gzip > mongodb-backup.gz

# Backup Marketplace SQLite
docker cp myzubster-marketplace:/app/data/marketplace.db ./marketplace-backup.db
```

### Restore

```bash
# Restore MongoDB
docker exec -i myzubster-mongodb mongorestore --archive --gzip < mongodb-backup.gz

# Restore Marketplace SQLite
docker cp ./marketplace-backup.db myzubster-marketplace:/app/data/marketplace.db
```

---

## Logs & Debugging

### View all logs

```bash
docker compose logs          # All services, last 100 lines
docker compose logs -f       # Follow (tail -f) all services
docker compose logs backend  # Follow one service
```

### Container inspection

```bash
docker compose ps            # Status of all containers
docker inspect myzubster-backend  # Full container details
docker exec -it myzubster-mongodb mongosh  # Access MongoDB shell
```

### Rebuild a single service

```bash
docker compose up -d --build backend    # Rebuild only backend
docker compose up -d --build            # Rebuild all
```

---

## Health Checks

Every service exposes a health endpoint:

| Service | Health URL | Expected Response |
|---------|-----------|-------------------|
| Backend | `http://localhost:3009/health` | `200 OK` |
| Gateway | `http://localhost:3001/health` | `200 OK` |
| Marketplace | `http://localhost:4000/api/health` | `200 OK` |
| AI Automation | `http://localhost:5000/health` | `200 OK` |
| Frontend | `http://localhost:3000` | `200 OK` (HTML) |
| MongoDB | `mongosh --eval "db.runCommand('ping')"` | `{ ok: 1 }` |

Quick health check all services:

```bash
for port in 3000 3009 3001 4000 5000; do
  echo -n "Port $port: "
  curl -sf http://localhost:$port/health && echo "✅" || echo "❌"
done
```

---

## Troubleshooting

### Container won't start

```bash
# Check why it failed
docker compose ps
docker compose logs <service-name>

# Common fix: rebuild from scratch
docker compose down
docker compose up -d --build
```

### MongoDB auth errors

The backend and other services connect to MongoDB using credentials from `.env`. If you see auth errors:

1. Ensure `MONGO_INITDB_ROOT_PASSWORD` in `.env` matches what services use
2. If you changed the password after first run, you need to wipe the volume:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Port conflicts

If a port is already in use:

```bash
# Find what's using the port (Linux/Mac)
lsof -i :3009

# Or change the port in .env
echo "BACKEND_PORT=3090" >> .env
```

### Slow first build

First build downloads base images and installs dependencies. Subsequent builds use Docker layer caching and are much faster.

### Gateway/Marketplace clone failures

These Dockerfiles clone from GitHub during build. If you're behind a firewall or in an air-gapped environment, you'll need to modify the Dockerfiles to use local copies instead.

### Out of disk space

```bash
# Remove unused images and build cache
docker system prune -af

# Check disk usage
docker system df
```

---

## Development vs Production

| Feature | Development (`docker-compose up`) | Production (`-f docker-compose.prod.yml`) |
|---------|----------------------------------|------------------------------------------|
| Restart policy | `unless-stopped` | `always` |
| Resource limits | None | CPU + memory caps |
| Log rotation | Docker default | JSON driver, 50MB × 5 files |
| Secret validation | Soft defaults | Hard required (`?`) |
| NODE_ENV | Not set | `production` |

---

## Supported Platforms

- ✅ Linux (x86_64, arm64)
- ✅ macOS (Intel, Apple Silicon via Docker Desktop)
- ✅ Windows (Docker Desktop with WSL 2 backend)

> **Note:** Windows users must use Docker Desktop with WSL 2 backend enabled. Hyper-V backend may have performance issues with volume mounts.

---

## License

Part of the [MyZubster Ecosystem](https://github.com/MyZubster-Ecosystem/myzubster). See repository root for license.
