# Review evidence ledger — Nicola × MyZubster (2026-10-02)

This file records checks that can be made from the connected MyZubster side **without Nicola's additional testimony**. It is not a certification of personal competence, wallet ownership, or independent blockchain validation.

| Item | Evidence inspected | Result / limitation |
|---|---|---|
| GitHub account | Daniel explicitly identifies `nicolaususnicola-lgtm` as Nicola's account; repository commits queried with the connected GitHub account | Owner identification is Daniel's declaration, not an independent identity verification |
| Solidity experiment | [Repository Solidity source](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/contracts/MyZubsterProof.sol) and [source commit 2df5b391](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/2df5b391f707eb0945dda9512ceb9387736b6402) | Actual source defines constructor-set `knowledgeHash`, `creator` and `timestamp`; commit is attributed to the GitHub account. This does not by itself prove contract deployment. |
| Ethereum Sepolia first deployment | [Repository report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/sepolia-proof.md) | Report identifies transaction `0x09dddd29aca76c9a425ba9cb45cefb1bfbe203b9628f5f9526e4a281012d4f20` and contract `0xabCF68e97a32eCa503942A563FF16F209ed45d11`, anchoring the **card URL string** hash. Direct independent explorer/RPC confirmation was not completed during this review. |
| Ethereum Sepolia versioned-payload proof | [V3 report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/proofs/SEPOLIA_PROOF_V3.md) and [commit 14834783](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/148347838cf7bd1c1b83853311fd7a543f5e50e1) | Report describes transaction `0x5c7717be6dc70e6416f8053c72bb1e2bec2b7c5462b23fcb9c4b1077f907fed4` and full-content-hash experiment; reporting a successful local verification is not the same as independently repeating it. |
| Nicola Comics local API | [Versioned test report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/TEST-REPORT-2026-09-15.md) and [MyZubster issue #1176](https://github.com/MyZubster-Ecosystem/myzubster/issues/1176) | Local HTTP/manual test report records three comics, working `gallery`, `detail`, `candidate`, `next_steps`; no pytest run, public Zorgax end-to-end integration or NFT mint established. |
| Base Sepolia / MetaMask instruction | Daniel's firsthand declaration of in-person guided training | Network and training description captured; **no public Base Sepolia transaction hash** has been provided. These activities are distinct from the Ethereum Sepolia deployments above. |
| Ubuntu workstation setup | Daniel's firsthand declaration | Not independently corroborated by a setup log; neither proof of autonomous proficiency nor detailed hardware/user data is asserted. |

## Review actions

- Email sent to Nicola at an address previously used in exchanges with Daniel, requesting his review and public-consent decision. No reply has yet been received.
- The two narrative documents and this ledger remain in **draft PR #1434**. Do not merge or create a public Knowledge Card in Nicola's name until Nicola reviews the narratives and approves the proposed attribution.
- The explorer links can be opened by the reader from the upstream reports. In this review, direct explorer access was unsuccessful, so on-chain confirmation is **pending**, not assumed.
- No secret wallet or personal authentication information is requested or stored.

## Additional evidence discovered in the ongoing review

### Base Sepolia knowledge-transfer anchor — **public verifier reports MATCH**

The fork's [18 September knowledge-transfer manifest](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/knowledge/KNOWLEDGE-TRANSFER-2026-09-18-DANIEL-NICOLA.json) describes a frozen 30-commit development snapshot on the Nicola fork. The corresponding [human evidence record](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/knowledge/KNOWLEDGE-TRANSFER-2026-09-18-DANIEL-NICOLA.md) reports SHA-256 `39ab3a177734b5e3e254657cfe6015100644bcda2fb008cf2561d000669b9e14`.

The [public MyZubster Base Sepolia verification endpoint](https://www.myzubster.com/api/knowledge-anchor/n4k48/0xff3c108275625673ad22a886da2df7120ae81b8f0106ec833613513b03c7bc31) was fetched during this review. It returned HTTP 200 and `{success:true,status:"MATCH"}`, chain ID `84532`, block `47000958`, and transaction `0xff3c108275625673ad22a886da2df7120ae81b8f0106ec833613513b03c7bc31`. The verifier reported a recognized delegated `redeemDelegations` execution with matching call data and zero value. The [repository receipt](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/knowledge/KNOWLEDGE-TRANSFER-2026-09-18-DANIEL-NICOLA.receipt.md) explains the delegated execution. The BaseScan explorer page could not be accessed directly in this review, so this is an **independently retrieved public MyZubster verifier result, not an independent second-provider chain readback**.

**Precise meaning:** The referenced online operation and its public verifier support the integrity/timestamp claim for this exact manifest covering the 30-commit snapshot. They do not attest every later idea or skill, Docker/Tor/kefir setup, a completed separate transfer/payment, or Nicola's learning. The manifest explicitly sets `recipient_attestation:"PENDING"`.

### Local Docker, data persistence and AI stack — **source and local-test evidence**

The fork contains a [versioned Docker Compose definition](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docker-compose.yml) with Python API `5000`, Qdrant, persistent volumes and Open WebUI. Ollama is configured via `host.docker.internal`; the Compose file demonstrates configuration, not a universal guarantee that every dependency is active. The [Nicola Comics local test report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/TEST-REPORT-2026-09-15.md) records `docker compose up --build -d`, a healthy service on local port 5000 and successful manual HTTP checks. Automated pytest was unavailable in that recorded session. The public Git history of the fork has Docker-related commits, but this does not by itself establish how much assistance Nicola needed.

### Decentralization and Tor onion — **MyZubster code exists; Nicola deployment not established**

The main repository contains [a documented Tor v3 onion service](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/onion/README.md) in an isolated Docker container, forwarded to an internal frontend service. [MyZubster commit `6750da8`](https://github.com/MyZubster-Ecosystem/myzubster/commit/6750da8facc5acbdf4d395f5e18ba8796499a02f) is attributed to Daniel's linked GitHub account. The onion documentation expressly distinguishes a healthy local container from proven external reachability over Tor. We did **not** find source/operation evidence in Nicola's fork for a working onion endpoint or a Tor end-to-end test on Nicola's computer. Therefore record **a shared technical topic/project context only**, pending Nicola's description and a sanitized test report. Never publish onion private keys, service administrator secrets, or personal infrastructure addresses.

### Nicola Comics → proposed NFT — **illustrations and candidate, not mint**

The [Nicola Comics roadmap](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/n4k48-comics/ROADMAP.md) records three versioned AI-assisted illustrations and [the visuals commit](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/f853710e24c305cb292b271c0d37696147e35239), published gallery and a single proposed NFT candidate. The [local test report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/TEST-REPORT-2026-09-15.md) records read-only API operation, not a mint or wallet functionality. Rights remain `TO_VERIFY`; a public transaction proving some unrelated knowledge anchor must not be represented as proof of an NFT mint, sale, transfer, or rights ownership.

### Kefir — **MyZubster subject area and Daniel's testimony; no Nicola learning evidence yet**

The main [MyZubster README](https://github.com/MyZubster-Ecosystem/myzubster) discusses kefir and responsible community exchange of fermentation knowledge, including Daniel's personal account of learning and maintaining kefir cultures. MyZubster [commit `b9ff495`](https://github.com/MyZubster-Ecosystem/myzubster/commit/b9ff495f66974090117be46e92bcd20d5950f859) shows implementation of a kefir handover flow in the main project and is attributed to Daniel's GitHub account. We found **no specific source connecting Nicola to a kefir lesson, physical handover, biological outcome or independently verified knowledge**. If Daniel and Nicola confirm a session, it may be documented as firsthand learning testimony with their approval. A blockchain timestamp would prove existence/integrity of an approved statement, **not** fermentation safety, health benefits, food-handling compliance or that Nicola mastered the practice.

## Proposed scope for any future on-chain evidence

A new approved, versioned snapshot could include references to the Docker and Nicola Comics artifacts, approved descriptions of shared learning, and candid status flags for onion and kefir. First obtain Nicola's review and explicit recipient attestation; then freeze a sanitized canonical document, recompute SHA-256, and **optionally** add a *new* Base Sepolia commitment only if an additional immutable timestamp is useful. Do not rewrite the 18 September anchored manifest or imply that an old transaction proves newly added claims. Use a separate transaction only with user approval. No real-money transfer is required for documentation; a content hash in Git suffices where public blockchain anchoring is unnecessary.
