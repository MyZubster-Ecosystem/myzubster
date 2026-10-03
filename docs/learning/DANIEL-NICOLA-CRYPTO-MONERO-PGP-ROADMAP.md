# Daniel × Nicola — MyZubster cryptography, PGP and Monero test roadmap (REVIEW DRAFT)

**Date:** 2026-10-02  
**Status:** proposed shared roadmap; pending Nicola's review, task acceptance and test-environment agreement.  
**Scope:** strengthen and test existing MyZubster and Nicola MVP cryptographic functions; incrementally assess PGP and Monero without claiming payment, custody, end-to-end encryption or third-party security certification before tests demonstrate them.

**Participants and review:** Daniel proposes product integration, mentoring, evidence publication through Zorgax and review of the main MyZubster code. Nicola is invited—not assigned without consent—to reproduce MVP tests, verify source artifacts, suggest his implementation milestones and approve any representation of his learning or contribution. Any critical security change requires code review and isolated tests before public rollout.

## Verified starting point (repository sources, not a claim that everything is production-tested)

1. **Existing Base Sepolia anchor:** The [18 September collaboration manifest](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/knowledge/KNOWLEDGE-TRANSFER-2026-09-18-DANIEL-NICOLA.json) describes a 30-commit snapshot. [MyZubster's public verifier](https://www.myzubster.com/api/knowledge-anchor/n4k48/0xff3c108275625673ad22a886da2df7120ae81b8f0106ec833613513b03c7bc31) returned `MATCH` when queried during the review. A separate independent blockchain RPC/explorer check and Nicola's recipient attestation remain outstanding.
2. **Ethereum Sepolia proofs:** Nicola's [versioned v3 proof report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/proofs/SEPOLIA_PROOF_V3.md) describes the hash of exact committed JSON bytes and supplies a read-only verification command. [Verifier code](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/src/core/knowledge_proof.py) computes SHA-256, validates `bytes32`, and performs public JSON-RPC reads. Independently rerunning all proof readbacks is still a test task.
3. **Marketplace crypto preferences:** [MyZubster crypto route](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/src/routes/marketplaceCryptoRoutes.js) and [crypto policy](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/src/services/marketplaceCryptoPolicy.js) support seller preference selection for XMR/BTC/ETH, with automatic conversion explicitly **disabled**. They do not document a production Monero wallet, completed crypto settlement, exchange or custody workflow.
4. **PGP data field:** [User schema](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/src/models/User.js) contains `communityProfile.pgpPublicKey`. Existence of a storage field is **not** evidence of verified key ownership, authenticated key discovery, encryption/decryption, or signed-message workflows.
5. **Monero documentation:** [Daniel's Monero Docs dossier](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/contributions/daniel-ioni-monero-docs-wallet-rpc.md) documents a `get_transfers.pending` wording proposal; upstream PR #389 was closed **without merge**. This is documentation experience, not evidence of a deployed or independently approved Monero payment integration.
6. **Local test platform:** Nicola's [Docker Compose](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docker-compose.yml), [Nicola Comics local report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/TEST-REPORT-2026-09-15.md), and [MyZubster onion service documentation](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/onion/README.md) provide a starting point. No onion end-to-end deployment on Nicola's PC, live public Zorgax integration or NFT mint is established by those references.


## Local setup status update — Daniel's firsthand report (pending Nicola confirmation)

Daniel reports that he has already guided Nicola through **installing MyZubster locally**, and that Nicola is now using **ChatGPT to help configure his own computer**. This is a new reported baseline for the R0/R2 workflow, not yet an independently inspected machine setup. ChatGPT assistance is distinct from Zorgax usage and does not by itself establish technical competence or successful installation of every subsystem.

**Next R2 test session:** Nicola should run the existing non-destructive checks on his own machine, sharing only sanitized output: operating system/version and non-sensitive Docker/Compose versions, `docker compose config` after masking environment secrets, container health, local API smoke tests, and available automated test results. Record what works, what required ChatGPT guidance, and what remains blocked. Do not share ChatGPT transcripts containing passwords, API tokens, wallet addresses that Nicola wishes to keep private, or personal device details. No external machine access, public local endpoints, wallet signing, or network transactions are necessary.

Nicola's explicit confirmation of the installation, current software revision, and learning outcomes is still pending.

## Roadmap: gates, owners to confirm, and acceptance evidence

| Stage | Proposed work | Required tests/evidence | Completion gate |
|---|---|---|---|
| **R0 — Agree scope & threat model** | Daniel and Nicola review existing components, inventory endpoints/secrets/network boundaries, choose isolated environments and define who may publish results. | Jointly approved scope, risk inventory, test matrix; no secrets committed. | Nicola confirms participation and test environment; security scope agreed. |
| **R1 — Reproduce existing cryptographic proofs** | Reproduce exact canonical JSON hashes for the existing Base Sepolia manifest and Ethereum Sepolia v1/v2/v3 proof files. Independently read existing public network transactions/contract state with read-only RPC. | Versioned SHA-256 results; network ID checks (Base Sepolia `84532`, Ethereum Sepolia `11155111`), explorer/RPC receipt results; `MATCH` and deliberate `NO_MATCH` tests for a changed byte, wrong chain, invalid `bytes32`, bad address, unreachable RPC. | Repeatable verification report from at least one independently configured RPC source; explicitly record unavailable services as `UNVERIFIED`. **No new on-chain transactions necessary.** |
| **R2 — Docker and local security test baseline** | Rebuild the Nicola MVP isolated Docker stack and document versions/configuration. Test API and AI features offline/local before cross-system integration; never expose Nicola's PC to the public internet for this pilot. | `docker compose config`, build/start/health evidence, storage/restart test, permission and network exposure review, automated Python/API regression tests, dependency review, secrets scan, sanitized logs. Separate manual HTTP results from pytest/CI results. | Versioned test report and green documented tests; known failures remain explicit. |
| **R3 — PGP proof-of-possession prototype** | Inventory existing `pgpPublicKey` field and design user-approved upload/display with key fingerprint, revocation, rotation and removal. Run signed challenge/proof-of-possession verification in isolated test environment. PGP encrypted communications are a distinct *optional* phase, not implied by key storage. | Generate **test-only** key pairs on participant-owned machines; server receives public keys/signatures only; verify valid, tampered, wrong-key, expired/revoked and oversized/malformed inputs; rate-limit challenge, TTL and replay tests; privacy and key lifecycle review. | Documented passing/failing tests and approved API contract. No real private key, passphrase or recovery material uploaded or logged. |
| **R4 — Monero read-only integration discovery** | Inventory existing XMR seller preference code and decide if a noncustodial, opt-in, **read-only** Monero Wallet RPC adapter is appropriate. Use disposable/staging wallet and synthetic/isolated test environment rather than real users' wallets. Treat knowledge of `get_transfers.pending` from the earlier proposal as a documentation input only. | Authentication/least-privilege of RPC boundary, timeout and bad-response handling, state distinctions for pending/confirmed/unconfirmed, network and wallet separation, mock/RPC contract tests with no financial transfer; never expose unauthenticated Wallet RPC publicly. | Threat-model and maintainer review, sanitized read-only results and test coverage. **No production payments, exchanges, custody or automatic conversion.** |
| **R5 — Integrate safely in MyZubster** | Only after R1–R4, prototype optional PGP/public-proof presentation and Monero read-only *status* views behind feature flags and owner authorization. Keep Zorgax in an explanatory/read-only role unless a separately reviewed user-approved transaction design exists. | RBAC/authorization, request validation, account isolation, idempotence/replay, error handling, privacy, secret-leak scans, abuse/rate tests, rollback drill; CI gates. Confirm UX does not imply certification or transaction completion. | Code review and test signoff for each feature; pilot environment first. |
| **R6 — Publish signed evidence & knowledge responsibly** | Prepare separate Daniel mentoring and Nicola project records. Freeze a canonical, sanitized, versioned manifest referencing source commits, reports and individually validated receipts. Optionally add digital signatures and a *new* testnet commitment only if needed and separately authorized. | Recompute digest from committed bytes; verify test signatures; independent source links; Nicola's explicit recipient attestation if describing knowledge he acquired; explicit review/approval through the owner account and Zorgax preview. | Knowledge Cards published only by their respective owners; never rewrite the 18 September already anchored manifest to claim newer events. |

## Concrete R1 test matrix

- **Positive:** SHA-256 of the exact committed payload matches the documented digest; read-only `knowledgeHash()` matches; correct chain ID and successful receipt; delegated Base Sepolia payload matches expected committed string.
- **Negative:** change one byte of payload; select a wrong contract/network; truncate digest; malformed URL/address; failed or missing receipt; simulate RPC timeout and rate-limit responses; two independent readers produce different responses (record discrepancy; do not claim confirmed).
- **Evidence:** reproducible commands, UTC timestamps, tool versions, network endpoints, expected/actual values, source commit SHA and sanitized machine-readable report. A verifier response from MyZubster is first-party; a second RPC/explorer independently configured is a separate check.
- **Safety:** offline hash verification and read-only public RPC before any signing. No wallet recovery phrases, private keys, real customer data or real-money transactions.

## Monero & PGP minimum security decisions (not implemented by this roadmap)

**Monero:** XMR preference storage is not settlement. If proceeding later, decide the wallet architecture, secure RPC topology (loopback/private network, authentication, least privilege), testnet/stagenet compatibility, confirmation semantics, accounting/audit boundary, user consent, regulatory and security review, and failure-handling before any payment feature. Do not expose a spend-capable Wallet RPC to Zorgax or a public HTTP endpoint.

**PGP:** A user-posted PGP public key is not verified ownership; require a signed challenge linked to an authenticated session, fingerprint visibility, rotation/revocation, and strict separation of public keys and user-held private keys. Do not call an uploaded key end-to-end encryption or verified identity without corresponding protocol-level tests and documented boundaries.

**Zorgax:** Never let prompt text alone authorize a wallet send, spending action, private-key export, permission escalation or publication. Require explicit purpose-bound human confirmation for any later state-changing operation and re-validate on the server.

**Onion:** MyZubster has a documented Tor v3 Docker component, but readiness/health alone is not public Tor reachability. If piloting an onion endpoint, test from a separate Tor client, persistence, privilege boundaries and secrecy of onion private identity. Do not expose Nicola's personal machine.

## Adjacent project and knowledge items (separate evidence tracks)

- **Nicola Comics:** local read-only catalog and proposed NFT candidate; rights review and public Zorgax E2E test are separate gates. Do not claim mint, token ID, contract address or on-chain NFT evidence until actually verified.
- **Kefir:** Daniel's ecosystem has related documentation and a handover implementation; a knowledge-transfer claim specifically involving Nicola requires a scoped record confirmed by Nicola. A blockchain document anchor is not evidence of a biological or health claim.
- **Marketplace declarations:** link relevant verified project artifacts as context but do not automatically upgrade declared personal competencies to independently certified competencies.

## Joint weekly workflow (proposal; dates not fixed)

1. At the beginning of each agreed session, select one stage and define expected tests; commit the test plan.
2. Develop on topic-specific branches in the repo controlled by the participant; open a PR with code and test output. Avoid writing directly to Nicola's repo without his authorization.
3. Collect sanitized automated test results and record negative tests, failures, network details and exact source SHA.
4. Daniel and Nicola review the report, record responsibility/learning claims separately from code evidence and decide what is ready to publish.
5. Update a cumulative status matrix (`NOT_STARTED`, `IN_PROGRESS`, `PASS`, `FAIL`, `BLOCKED`, `UNVERIFIED`) with links. Publish Knowledge Cards only through each owner account with explicit preview/approval.

## First proposed joint session

- Nicola reviews [draft PR #1434](https://github.com/MyZubster-Ecosystem/myzubster/pull/1434) and this roadmap.
- Reproduce existing **offline** SHA-256 digests and negative tests; configure a separate public RPC for read-only checks of the existing Ethereum/Base Sepolia proofs.
- Agree one Docker reproducibility run and one PGP toy-key proof-of-possession experiment.
- Record the exact scope of any Monero Wallet RPC research before touching a real wallet. No new transaction, signing action or production release is authorized by this roadmap.

**Publication policy:** roadmap and implementation plans are not claims of completed development. Every completed stage requires traceable sources, test conditions, report and review; user learning and public profile attribution require participant approval.
