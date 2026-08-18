# MyZubster — Project Status / PC Handoff

Updated: 2026-08-18

## Current position

The project is in **PoC / engineering preparation**. No production deployment and no official integration with the Municipality of Rimini, Diocese, Hera, the Italian State, PDND or other public infrastructure is claimed.

## Workstreams

| Workstream | Status | Next action |
|---|---|---|
| Distributed Onion architecture | 🟡 In progress | Make Node A independently runnable |
| Docker/PC handoff | 🟡 In progress | Validate compose and local startup |
| Discovery + health | 🟡 Design/PoC | Implement and test observations |
| A/B/C failover | ⬜ Not deployed | Deploy independent hosts after Node A |
| Rimini Civic Data PoC | 🟡 Design | Select an official public dataset/feed |
| Event Civic Gateway | 🟡 Design | Build read-only demo from authorized public data |
| PA / State interoperability | 🟡 Architecture | Map PoC against PDND/API, Cloud PA and security requirements |
| Institutional integration | ⬜ Not started | Requires explicit authorization and institutional contact |

## Immediate sequence

1. Validate repository and Docker configuration on PC.
2. Build a self-contained Node A.
3. Run Node A locally and test its health endpoint.
4. Deploy Node A on a real Docker host.
5. Verify through Tor from an independent network.
6. Add Node B and C on independent hosts/networks.
7. Implement multi-observer health and failover.
8. Build the Rimini public-data gateway using only authorized/open data.
9. Produce a reproducible resilience demo.
10. Only after the technical PoC is validated, prepare any institutional proposal.

## Important boundaries

- Do not treat public Wi-Fi, 4G or 5G as production infrastructure or as a server deployment mechanism.
- Do not expose Tor SOCKS ports publicly.
- Do not commit Onion private keys or credentials.
- Do not connect to municipal, diocesan, Hera or state systems without explicit authorization.
- Do not process personal/sensitive data in the first PoC.
- Do not represent the PoC as an official public-service integration.

## PC resume checklist

```bash
git fetch --all --prune
git checkout feat/distributed-onion-health
git pull --ff-only
```

Then read, in order:

1. `onion/PROJECT-STATUS.md`
2. `onion/ROADMAP.md`
3. `onion/PC-SETUP.md`
4. `onion/RIMINI-CIVIC-DATA-PILOT.md`
5. `onion/RIMINI-EVENT-CIVIC-GATEWAY-POC.md`
6. `onion/PA-INTEGRATION-ROADMAP.md`

## Definition of done for the first milestone

M1 is complete only when a real Node A is deployed on an actual host, reachable through its intended Onion path from an independent network, survives a controlled restart with persistent identity, and has a recorded health check.
