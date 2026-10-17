# N4K48 Outbound Catalog Agent — Independent Interoperability & Evidence Checklist

> **Governance Tracking Reference**: [RFC Issue #1617](https://github.com/MyZubster-Ecosystem/myzubster/issues/1617) · [Draft PR #1618](https://github.com/MyZubster-Ecosystem/myzubster/pull/1618)  
> **Related Technical Trackers**: [Issue #1520](https://github.com/MyZubster-Ecosystem/myzubster/issues/1520) · [Issue #1580](https://github.com/MyZubster-Ecosystem/myzubster/issues/1580) · [Issue #1584](https://github.com/MyZubster-Ecosystem/myzubster/issues/1584)  
> **Scope**: Offline local test harness, protocol contract verification, and security boundaries.  
> **Author**: Wasim (@wasim-builds)  
> **Date**: October 2026  

---

## 1. Scope & Hard Constraints

This checklist defines the formal acceptance criteria for independent contributor node interoperability (specifically the N4K48 catalog bridge), adhering to the core governance principles proposed in [PR #1618](https://github.com/MyZubster-Ecosystem/myzubster/pull/1618):

| Constraint | Requirement | Verification Method |
| :--- | :--- | :--- |
| **Zero Infrastructure Cost** | Verified strictly in local test harness or private hardware node (e.g. Raspberry Pi test node). Zero cloud instances or VPS expenses. | Review test runner for local loopback `127.0.0.1` and mock assertions. |
| **Zero Production Access** | No production database, server, or cloud credentials required or permitted. | Confirm absence of live API keys, mainnet addresses, or production endpoints. |
| **Fail-Closed Boundary** | Disallowed actions, malformed inputs, or corrupted envelopes must fail closed without querying local catalogs or exposing stack traces. | Unit test execution with adversarial payloads. |
| **Privacy & Metadata Stripping** | Catalog responses strip all internal URLs, file paths, or private metadata before transmission to broker. | Assert outbound payload filters in mock exchanges. |

---

## 2. Reviewer PASS / FAIL Verification Matrix

Independent reviewers must verify each phase against the reproducible test suites:

### Phase 1: Wire Protocol Contract & Endpoint Constraints
- [ ] **Check 1.1**: The agent communicates exclusively via two HTTP endpoints:
  - `GET /node/next` (leased task retrieval)
  - `POST /node/result` (execution result submission)
- [ ] **Check 1.2**: Actions are strictly limited to read-only operations:
  - `gallery` (returns up to 4 titles, max 140 chars per title)
  - `candidate` (returns read-only candidate metadata)
  - `detail` (requires `comic_id`; returns at most 1 title, max 140 chars)
- [ ] **Check 1.3**: Non-read-only actions (`delete`, `mint`, `update`) are rejected immediately without querying the local catalog.
- **Criteria**: **PASS** if unauthorized actions return generic `{'error': 'invalid job'}` and trigger zero queries to the local catalog.

### Phase 2: Authentication & Token Isolation
- [ ] **Check 2.1**: All broker endpoints mandate `Authorization: Bearer <TOKEN>`. Unauthenticated requests yield `401 Unauthorized`.
- [ ] **Check 2.2**: Node tokens (`NODE_TOKEN`) and admin tokens (`ADMIN_TOKEN`) are strictly role-separated. Node tokens cannot issue administrative job requests.
- [ ] **Check 2.3**: Tokens are never forwarded or exposed to the local catalog API (`http://127.0.0.1:5000`).
- [ ] **Check 2.4**: No persistent credentials, API keys, or private keys are stored in version control or output logs.
- **Criteria**: **PASS** if token isolation assertions pass and zero credentials appear in logs or git index.

### Phase 3: Payload Bounding & Privacy Cleansing
- [ ] **Check 3.1**: Gallery responses truncate output to a maximum of 4 titles, even if the local catalog returns >4 items.
- [ ] **Check 3.2**: Individual title strings are truncated to 140 characters.
- [ ] **Check 3.3**: Non-title metadata (such as internal `url`, `private`, host paths, or storage references) are explicitly omitted from the result payload.
- [ ] **Check 3.4**: An empty sources list (`{'sources': []}`) is processed as a valid empty catalog (`{'action': 'gallery', 'titles': []}`).
- **Criteria**: **PASS** if all output payloads adhere strictly to bounded schema constraints without leaking upstream metadata.

### Phase 4: Error Sanitization & Resilience
- [ ] **Check 4.1**: Local network failures (`TimeoutError`, `URLError`, `HTTPError`, `OSError`) yield sanitized error `{'error': 'local catalog unavailable'}` with zero raw exception messages.
- [ ] **Check 4.2**: Malformed catalog JSON yields sanitized error `{'error': 'invalid catalog response'}`.
- [ ] **Check 4.3**: Transport failures during `POST /node/result` do not mark the task completed, preventing silent drops or false-positive acknowledgments.
- [ ] **Check 4.4**: Polling loop safely recovers and resumes polling after intermittent socket drops or malformed payloads.
- [ ] **Check 4.5**: Broker lease reassignment invalidates prior lease IDs, preventing stale or duplicate submissions.
- **Criteria**: **PASS** if all error conditions produce generic, sanitized responses and the agent safely recovers without crashing.

### Phase 5: Cryptographic & Test Evidence Gate
- [ ] **Check 5.1**: Validate SHA-256 hash of `integrations/contributors/n4k48-agent/bridge/agent.py`:
  ```text
  75ab34d21f668fa48383ac7070c717b074c868694c3042928e4532b5ccd34fa1
  ```
- [ ] **Check 5.2**: Execute Python standard library unit tests (24 tests total):
  ```bash
  python3 -m unittest discover -s integrations/contributors/n4k48-agent/bridge -p 'test_*.py' -v
  ```
- [ ] **Check 5.3**: Execute Jest bridge service unit tests (3 tests total):
  ```bash
  npx jest tests/nicolaComicsBridgeService.test.js
  ```
- **Criteria**: **PASS** if all 27 tests pass with zero failures and zero skipped tests.

---

## 3. Tier Separation Model

Independent nodes participate according to three distinct verification tiers:

| Tier | Environment | Scope | Production Risk |
| :--- | :--- | :--- | :--- |
| **Tier 1: Local In-Memory Mock** | Python `unittest` with mock socket exchanges | Verify schema parsing, bounding, and error recovery. | **None** (100% offline) |
| **Tier 2: Loopback Broker Bridge** | Ephemeral local broker server on `127.0.0.1` | Verify HTTP handshake, lease lifecycle, and token enforcement. | **None** (zero host exposure) |
| **Tier 3: Standalone Autonomy** | Local agent with `--standalone-catalog` | Bounded reading from local JSON fixture without broker dependency. | **None** (zero outbound network) |

---

## 4. Auditor & Contributor Sign-Off Template

```text
================================================================================
           MYZUBSTER INDEPENDENT NODE INTEROPERABILITY SIGN-OFF
================================================================================
Node / Contributor Alias : 
Repository Commit SHA    : 
Audit Date               : 
Python Test Results      : [ ] PASS (24/24 tests)  [ ] FAIL
Jest Bridge Test Results : [ ] PASS (3/3 tests)    [ ] FAIL
Zero VPS Cost Verified   : [ ] CONFIRMED (100% offline local test harness)
Zero Host Port Exposure  : [ ] CONFIRMED (no non-loopback bindings)
Zero Secret Leaks        : [ ] CONFIRMED (sanitized logs and envelopes)

Auditor Notes / Comments:
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
Auditor Signature / Handle: 
================================================================================
```
