# MyZubster Ecosystem

Public index linking the MyZubster pilot-node work to the public `@myzubster` identity and active contributor pilots.

## Public Identity

- **MyZubster Public Identity:** https://github.com/myzubster
- **Ecosystem Repository:** https://github.com/MyZubster-Ecosystem/myzubster

## Connected Pilots & Contributors

### Nicola / N4K48
- **Contributor:** [@nicolaususnicola-lgtm](https://github.com/nicolaususnicola-lgtm)
- **Role:** Independent pilot-node / Docker interoperability contributor
- **Evidence:** [pilot/n4k48-tested-checkpoint](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/tree/pilot/n4k48-tested-checkpoint)
- **Reference Issue:** #1474
- **Verified Scope:**
  - Independent Docker node
  - Local restart/persistence checks
  - Read-only bridge/adaptor flows
  - Public Git provenance
  - Reproducible evidence bundle

### Open Period Care — Research/Evidence Contributor
- **Contributor:** [@khongten124](https://github.com/khongten124)
- **Role:** Research/evidence contributor
- **References:** #1399, #1450, PR #1451, #1486, #1488
- **Current Evidence State:** `SUPPORTED`
- **Technical Interoperability:**
  - Independent verifier executed outside the MyZubster VPS
  - Contributor-side interoperability checkpoint: `TESTED`

### Open Period Care — Technical/Verifier Contributor
- **Contributor:** [@Shweta-singh24](https://github.com/Shweta-singh24)
- **Role:** Technical/verifier contributor
- **Reference:** #1399
- **Initial Scope:**
  - Docker
  - Node.js
  - HTTPS/read-only interoperability
  - Documentation/usability
  - Contributor-to-contributor verification

## Shared Interoperability Model

```text
@myzubster public identity
        |
        v
MyZubster-Ecosystem/myzubster
        |
        +------------------------------+
        |                              |
        v                              v
N4K48 / Nicola                 Open Period Care
independent node               read-only evidence node
        |                              |
        v                              +--> @khongten124
reproducible evidence                  research/evidence producer
                                       |
                                       +--> @Shweta-singh24
                                            technical/verifier
```

## Network Objective

Move from isolated pilot contributions toward a reproducible contributor-node network where each contributor can maintain:

- Their own GitHub identity and repository history
- Their own pilot/node or verifier environment
- Machine-readable evidence
- Deterministic hashes
- Knowledge Cards / Contributor Passport links
- Public, sanitized interoperability records

## Security & Evidence Boundary

The network must not require contributors to share:

- Private SSH keys
- Server passwords
- Database credentials
- API secrets
- Wallet seeds/private keys
- Sensitive health data

**Note:** Technical `TESTED` status refers only to the exact interoperability checks performed. It does not imply laboratory, clinical, regulatory, scientific, or physical-world verification.

## Next Checkpoints

- [x] N4K48 independent Docker-node evidence published
- [x] Open Period Care read-only node deployed
- [x] Open Period Care independent verifier published
- [x] @khongten124 contributor-side interoperability tested
- [ ] @Shweta-singh24 independent verifier run
- [ ] contributor-to-contributor interoperability confirmed
- [ ] scoped VPS contributor access activated with public SSH keys
- [ ] unified Contributor Passport / Knowledge Graph links across the three pilot contributors

---

This repository serves as the public linkage between the `@myzubster` identity, pilot infrastructure, contributor competencies, and reproducible evidence.
