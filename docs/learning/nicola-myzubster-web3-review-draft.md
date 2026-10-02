# REVIEW DRAFT — Nicola × MyZubster: Web3 learning and documented software development

> **Not approved for publication as Nicola's personal Knowledge Card.** Daniel Ioni has confirmed that `nicolaususnicola-lgtm` is Nicola's GitHub account and described their in-person learning sessions. Nicola should review and approve the training narrative, attribution, and any card published in his name. Public repository artifacts below are linked separately from Daniel's personal account of mentoring.

## 1. Firsthand learning account (Daniel Ioni's declaration; Nicola confirmation pending)

Daniel reports working side by side with Nicola at Nicola's home. Daniel guided Nicola through configuring MetaMask for **Base Sepolia**, using Zorgax to request guidance for steps associated with an online test transaction, and installing/configuring Ubuntu on Nicola's computer. They continued developing their MyZubster-related software in person.

**Important limitations:** This statement does not establish the exact Base Sepolia transaction hash, independently prove completion of a Base Sepolia transaction, or show that Nicola performed all operations without guidance. We should record the transaction as **not yet corroborated** until we obtain its public transaction hash and inspect it. Wallet addresses, recovery phrases and other personal details are intentionally omitted. Ethereum Sepolia and Base Sepolia are **different test networks** and must not be conflated.

## 2. Repository artifacts associated with Nicola's GitHub account

GitHub account: https://github.com/nicolaususnicola-lgtm

### Ethereum Sepolia knowledge-proof experiments — separate from the Base Sepolia training account

Nicola's fork contains [`docs/sepolia-proof.md`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/sepolia-proof.md) documenting a `MyZubsterProof` smart contract deployed to **Ethereum Sepolia**. The report records:
- Contract `0xabCF68e97a32eCa503942A563FF16F209ed45d11`;
- Deployment transaction `0x09dddd29aca76c9a425ba9cb45cefb1bfbe203b9628f5f9526e4a281012d4f20`;
- A first experiment anchoring the SHA-256 hash of the *Knowledge Card URL string*, not the full card's content.

Relevant source commit: https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/2df5b391f707eb0945dda9512ceb9387736b6402

The fork also contains [`proofs/SEPOLIA_PROOF_V3.md`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/proofs/SEPOLIA_PROOF_V3.md) documenting a later proof that anchors the SHA-256 digest of an exact versioned JSON payload rather than only the card URL. The report records:
- Contract `0x3233fA7f8c50Aa25d9B1263c25F28535B6eA59bF`;
- Deployment transaction `0x5c7717be6dc70e6416f8053c72bb1e2bec2b7c5462b23fcb9c4b1077f907fed4`;
- Payload SHA-256 `d1c89d2a4157a159b56e92825ca59fdb1f0e84e003b05e022af67da69ed25ac4`;
- Reproducible commands for local hashing and read-only on-chain readback.

Relevant source commit: https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/148347838cf7bd1c1b83853311fd7a543f5e50e1

**Evidence boundary:** These are publicly available repository documents and GitHub commits attributed to Nicola's account; this dossier has not independently re-executed the contract readbacks or verified the explorer transactions. A matching on-chain content digest would show integrity of a specific committed payload; it would not establish the truth of every claim within the payload, a personal identity, or professional competence. Do not present these Ethereum Sepolia artifacts as proof of the **Base Sepolia** training transaction.

### Nicola Comics × Zorgax local pilot

The [local test report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/TEST-REPORT-2026-09-15.md) records rebuilding and starting the service with Docker Compose, a healthy local API at `localhost:5000`, and successful manual/HTTP checks for:
- `GET /api/comics` and three comic entries;
- `POST /api/zorgax/ask` with `gallery`, `detail`, `candidate` and `next_steps`.

Limitations in that report: automatic `pytest` tests were **not run** in the recorded session; deployment and an end-to-end connection to *public* Zorgax were **pending**. A comic is a proposed NFT candidate with rights still `TO_VERIFY`; the pilot does **not** claim an NFT mint, a wallet transaction, or on-chain NFT evidence.

Coordination reference: https://github.com/MyZubster-Ecosystem/myzubster/issues/1176

## 3. Knowledge areas this experience can document

Under Daniel's firsthand account: guided MetaMask configuration on Base Sepolia, introductory Web3 workflow practice with Zorgax guidance, Ubuntu workstation setup, and collaborative development.

Under the fork's publicly inspectable repository history: Ethereum Sepolia proof-contract source and documentation, reproducible hash-based payload integrity experiments, Docker-based local API testing, read-only comics catalog endpoints, and planning for a future public Zorgax integration.

None of these statements independently certifies Nicola's competence. Exact responsibility for every line of code and the individual learning outcomes should be confirmed by Nicola.

## 4. Before an approved Knowledge Card

- [ ] Nicola reviews and approves the narrative, attribution, and public association with `nicolaususnicola-lgtm`.
- [ ] Confirm whether a **Base Sepolia** test transaction was completed; if so, supply only the public transaction hash/network and verify its status. Never supply seed phrases, passwords, or private keys.
- [ ] Independently read the Ethereum Sepolia transactions/contract state if claiming verified on-chain deployment rather than reporting repository documentation.
- [ ] Choose specific commits for Nicola to confirm as his work; an account-level commit author association alone is not proof of individual responsibility.
- [ ] Create Nicola's Knowledge Card under **Nicola's own authenticated MyZubster account**, with his approval. Do not publish as Nicola through Daniel's account.

## Verified evidence update — 2 October 2026

A separate, earlier **Base Sepolia knowledge-transfer anchor** has now been identified and its [public verifier](https://www.myzubster.com/api/knowledge-anchor/n4k48/0xff3c108275625673ad22a886da2df7120ae81b8f0106ec833613513b03c7bc31) was fetched successfully (HTTP 200, `MATCH`). It anchors the immutable [18 September canonical collaboration manifest](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/knowledge/KNOWLEDGE-TRANSFER-2026-09-18-DANIEL-NICOLA.json), which records a 30-commit snapshot covering the economic ledger, balances and UI. This is an on-chain commitment **to that manifest**, not proof that a particular guided MetaMask training exercise was completed, that Nicola mastered the described skills, or that any NFT was minted. The manifest retains `recipient_attestation:"PENDING"`.

Public source evidence also covers the fork's [Docker Compose setup](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docker-compose.yml) and [local Docker-based Nicola Comics API test report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/TEST-REPORT-2026-09-15.md). The main MyZubster repository documents [a Tor v3 onion Docker service](https://github.com/MyZubster-Ecosystem/myzubster/blob/main/onion/README.md), but no working onion deployment by Nicola has been independently established. Its kefir documentation and [handover implementation](https://github.com/MyZubster-Ecosystem/myzubster/commit/b9ff495f66974090117be46e92bcd20d5950f859) are MyZubster/Daniel artifacts; Nicola's particular kefir participation or knowledge transfer has not yet been corroborated.

For precise status by topic, see the [review evidence ledger](nicola-evidence-ledger-review.md). No additional on-chain anchoring or public Knowledge Card should occur before review and explicit approval.
