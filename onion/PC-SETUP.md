# MyZubster Distributed Onion — PC Setup

This document is the handoff point for continuing development from a PC.

## 1. Clone and select the branch

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster
git checkout feat/distributed-onion-health
git pull --ff-only origin feat/distributed-onion-health
```

## 2. Prerequisites

- Docker Engine
- Docker Compose v2 (`docker compose`)
- Git
- outbound Internet access

No inbound port needs to be exposed for the probe agent. Tor provides the transport to Onion Services.

## 3. Configure candidates

Copy the example candidate file and add only real v3 Onion hostnames obtained from deployed nodes:

```bash
cp onion/candidates.txt.example onion/candidates.txt
```

Do not commit `candidates.txt` if it contains private/internal deployment information.

## 4. Run the distributed local stack

```bash
docker compose -f onion/compose.distributed.yml up -d --build
```

Inspect logs:

```bash
docker compose -f onion/compose.distributed.yml logs -f probe-agent
```

Observations are stored in the `probe_data` Docker volume.

## 5. Deployment model

For real distribution, run the Onion Service on independent hosts/VMs. Do not run all production nodes on the same Docker host if the goal is host-level fault tolerance.

Suggested minimum test topology:

- Node A: host/network 1
- Node B: host/network 2
- Node C: host/network 3
- Observer 1: mobile 4G/5G
- Observer 2: independent fixed network

The observer network must not be treated as evidence that a node is globally down. Health is derived from multiple observations.

## 6. Failover test

After at least two real Onion nodes are deployed:

1. verify both nodes from Observer 1;
2. verify both nodes from Observer 2;
3. stop Node A;
4. confirm A becomes degraded/unreachable after the configured observation window;
5. confirm B remains usable;
6. restart A;
7. confirm A recovers without losing its persistent Onion identity.

## 7. Security rules

- Never commit Onion private keys.
- Never expose the Tor SOCKS port publicly.
- Keep each node identity in persistent protected storage.
- Do not publish private/internal candidate metadata.
- Treat discovery advertisements as untrusted until cryptographically verified.
- Use bounded retries and jitter to avoid retry storms.
