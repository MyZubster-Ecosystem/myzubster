# N4K48 × foxxx009 Second Independent Node Checkpoint — Protocol & Evidence Spec

## 1. Purpose

This document formalises the second independent reproduction checkpoint between:

- **N4K48** (`nicolaususnicola-lgtm/myzubster-mvp`)
- **foxxx009** (independently controlled contributor environment)

It operationalises the issue titled "[PILOT TEST] Second independent node checkpoint — N4K48 × foxxx009" by providing:

1. A frozen test contract (commit, branch, fixture hash, expected output).
2. Evidence state machine rules (PROPOSED → READY → TESTED → VERIFIED/FAILED).
3. A reproducible command surface with no secrets, VPS access, or production dependencies.
4. A shared evidence record that both contributors must sign-off before closing.

## 2. Scope

### In scope

- Reproduce the N4K48 VPS → broker → agent → local catalog → Bridge checkpoint in a second independent environment.
- Use sanitized deterministic fixtures only.
- Record exact commit SHAs, runtime versions, and commands on both sides.
- Publish PASS/FAIL with sanitized logs.

### Out of scope

- Full decentralization claims.
- Production readiness or certification.
- Any funding, payment, bounty, or partnership obligations.
- Access to production endpoints, private databases, or shared filesystems.
- Use of real wallet keys, SSH keys, tokens, or credentials.

## 3. Frozen Test Contract

### 3.1 N4K48 Side

| Field | Value (to be confirmed before READY state) |
|---|---|
| Repository | `nicolaususnicola-lgtm/myzubster-mvp` |
| Branch | `main` (or explicitly named feature/test branch) |
| Commit SHA | `<N4K48_COMMIT_SHA>` |
| Fixture file | `test/fixtures/sanitized_checkpoint_v1.json` |
| Fixture hash (SHA-256) | `<FIXTURE_HASH>` |
| Test command | `./scripts/run_checkpoint_test.sh --fixture test/fixtures/sanitized_checkpoint_v1.json` |
| Expected result | Bridge payload returns `{ "status": "ok", "checkpoint": "v1", "hash": "<EXPECTED_HASH>" }` |
| Runtime versions | Node `<NODE_VERSION>`, Bridge protocol draft `N4K48_BRIDGE_PROTOCOL_V1_DRAFT.md` |

### 3.2 foxxx009 Side

| Field | Value (to be confirmed before READY state) |
|---|---|
| Environment | Local Docker or native runtime, independently administered |
| Runtime versions | Node `<NODE_VERSION>`, Docker `<DOCKER_VERSION>` (if used) |
| Fixture copy | Identical to N4K48 fixture (same hash) |
| Test command | `./scripts/run_checkpoint_test.sh --fixture test/fixtures/sanitized_checkpoint_v1.json` |
| Expected result | Same as N4K48 expected result |
| Commit SHA (if forking repo) | `<FOXXX009_COMMIT_SHA>` |

### 3.3 Sanitized Deterministic Fixture

The fixture (`test/fixtures/sanitized_checkpoint_v1.json`) MUST contain only public, deterministic data:

```json
{
  "checkpoint_version": "v1",
  "participant_n4k48": "nicolaususnicola-lgtm",
  "participant_foxxx009": "foxxx009",
  "input_payload": {
    "type": "interoperability_check",
    "seed": "deterministic_seed_for_pilot_test_only",
    "messages": [
      "VPS -> broker acknowledgment",
      "broker -> agent delivery confirmation",
      "agent -> local catalog registration",
      "local catalog -> Bridge handshake"
    ]
  },
  "expected_bridge_response": {
    "status": "ok",
    "checkpoint": "v1",
    "hash": "__EXPECTED_HASH_PLACEHOLDER__"
  },
  "notes": "No credentials, keys, tokens, or private endpoints. Public-only reproducible test data."
}
```

Before execution, the actual `hash` value in `expected_bridge_response.hash` MUST be computed and recorded. The placeholder `__EXPECTED_HASH_PLACEHOLDER__` is replaced with the real SHA-256 of the canonical bridge response.

## 4. Evidence State Machine

```
PROPOSED
   │
   ▼
 READY  ← both sides confirm commits, fixture hash, commands
   │
   ▼
 TESTED  ← reproducible run completed, sanitized evidence published
   │
   ├── PASS ──► VERIFIED (exact checkpoint only; not a broad platform claim)
   │
   └── FAIL ──► FAILED (limitations and divergence recorded)
```

### State definitions

- **PROPOSED**: Issue exists, scope frozen in principle.
- **READY**: Both participants publish exact commits, fixture hash, commands, and expected output.
- **TESTED**: A reproducible run is completed; sanitized evidence is published.
- **VERIFIED**: PASS achieved. Applicable only to the exact reproduced checkpoint. Does NOT imply full decentralization, production readiness, or certification.
- **FAILED**: Run completed but interoperability did not hold. Divergence documented.

## 5. Pre-Execution Requirements

Both contributors MUST publish the following before any run:

1. Exact repository URL and branch.
2. Exact commit SHA locked for the test.
3. Fixture file path and its SHA-256 hash.
4. Exact test command(s) with all flags.
5. Expected result (full JSON response).
6. Explicit list of out-of-scope items.

All of the above is recorded in this document under Section 3.

## 6. Post-Execution Evidence

After the test run, both contributors publish:

- Actual result (full sanitized JSON or log excerpt).
- PASS or FAIL verdict.
- Relevant logs with ALL secrets removed (credentials, keys, tokens, private endpoints).
- Evidence hash (SHA-256 of the combined post-run artifacts).
- Limitations encountered.
- Any divergence from the protocol or expected result.
- Comparison of N4K48 side vs. foxxx009 side outputs.

Evidence files MUST be stored in a public, read-only location (e.g., a public Gist, IPFS pin, or public commit in either repository under `docs/evidence/`).

## 7. Acceptance Criteria Checklist

- [ ] @nicolaususnicola-lgtm confirms exact N4K48 commit, fixture, and command.
- [ ] @foxxx009 confirms independent environment, runtime versions, and exact commit.
- [ ] Commands and expected output are frozen in Section 3 before execution.
- [ ] Sanitized evidence is published from both contributor sides.
- [ ] Results are independently reviewable from public artifacts.
- [ ] Limitations and failures are recorded without suppression.
- [ ] No secret or private material appears in any published evidence.
- [ ] Final state is recorded as `TESTED/PASS` or `TESTED/FAIL` only after evidence exists.

## 8. Funding / Access Boundary

This checkpoint creates NO bounty, payment, VPS access, treasury role, production permission, or ongoing maintainer obligation. Any future compensation or access must be agreed separately in writing before work that depends on it begins.

## 9. File Inventory

| File | Purpose |
|---|---|
| `docs/N4K48_FOXXX009_CHECKPOINT_V1.md` | This document — protocol and evidence spec |
| `test/fixtures/sanitized_checkpoint_v1.json` | Deterministic, secrets-free test fixture |
| `scripts/run_checkpoint_test.sh` | Reproducible entry-point script for both contributors |
| `docs/evidence/README.md` | Evidence storage index and hash registry |
