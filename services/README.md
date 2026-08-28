# MyZubster Microservices

This directory contains the microservices architecture introduced for issue #98.

## Architecture

```
                     +-----------+
   clients  ------>  |  gateway  |  :8080  (unified entry point)
                     +-----+-----+
                           |
              discovers + proxies via
                           |
                     +-----v-----+
                     |  registry |  :8500  (service discovery, TTL heartbeats)
                     +-----+-----+
        +----------+-----+-----+-----+-----------+
        |          |           |      |           |
     +--v--+   +---v----+  +---v----+ +-v-+  +----v---------+
     |auth |   |gardens |  |bounties| | ai|  | notifications|
     |:8081|   |:8082   |  |:8083   | |:8084| |:8085        |
     +-----+   +--------+  +--------+ +---+  +--------------+
```

- **Service split**: `auth`, `gardens`, `bounties`, `ai`, `notifications`.
- **Communication**: REST over HTTP (Node built-in `http`), no extra dependencies.
- **Service discovery**: `registry` (Consul-style register/heartbeat/reap over REST).
- **API gateway**: `gateway` does prefix routing, discovery and load-balanced proxying.
- **Containerization**: each service has its own `Dockerfile`; `docker-compose.yml` wires them together.

## Run

```bash
docker compose up --build
```

The gateway is exposed on `http://localhost:8080`.

## Gateway routes

| Prefix          | Service        |
| --------------- | -------------- |
| `/auth/*`       | auth           |
| `/gardens/*`    | gardens        |
| `/bounties/*`   | bounties       |
| `/ai/*`         | ai             |
| `/notifications/*` | notifications |

The gateway strips the prefix before forwarding, so `/auth/login` -> auth `/login`.

## Example requests

```bash
# register + login via gateway
curl -X POST localhost:8080/auth/register -H 'Content-Type: application/json' -d '{"email":"a@b.c","password":"pw"}'
curl -X POST localhost:8080/auth/login    -H 'Content-Type: application/json' -d '{"email":"a@b.c","password":"pw"}'

# create a bounty
curl -X POST localhost:8080/bounties -H 'Content-Type: application/json' -d '{"title":"Fix bug","reward":10}'

# send a notification
curl -X POST localhost:8080/notifications/notify -H 'Content-Type: application/json' -d '{"to":"user","msg":"hi"}'

# registry introspection
curl localhost:8500/services
```

## Health checks

Every service exposes `GET /health` (e.g. `localhost:8080/health` for the gateway).

## Notes / next steps

- Domain handlers currently use in-memory stores to keep the architecture runnable with zero new dependencies. Wire each service to its models (`src/models/*`) and persistence in follow-up issues.
- To migrate the existing monolith incrementally, add gateway routes that proxy to the legacy app and retire controllers as each service takes over.
