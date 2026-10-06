# How MyZubster works

This document explains MyZubster for people discovering the project for the first time. It separates **implemented and verified features** from **work in progress**, so roadmap items are not confused with production capabilities.

## 1. What MyZubster is

MyZubster is an open-source ecosystem connecting accounts, community profiles, Zorgax assistance, a Marketplace, contributors, research projects and real-world pilots. GitHub provides the open collaboration layer; the website provides the user-facing entry point; evidence systems connect validated activity to reproducible records.

```text
PERSON / GROUP / UNIVERSITY / PILOT
              ↓
        FREE ACCOUNT
              ↓
      PROFILE + ZORGAX
              ↓
  MARKETPLACE / CONTRIBUTION / RESEARCH
              ↓
        EVIDENCE RECORD
              ↓
   OPTIONAL BLOCKCHAIN ANCHOR
```

## 2. Account and free registration

The intended entry model is free-first. A user can create/authenticate an account, enter the community, build a profile and use the basic Seller/Marketplace path without being forced to purchase a subscription first.

Authentication and onboarding can connect Google or GitHub identity where available. Zorgax guides the user through missing profile information. The user remains responsible for reviewing information before publication.

Becoming a basic Seller is designed to start with `SELLER_FREE`: no card, Checkout or recurring subscription should be required merely to become a Seller or publish within the free allowance.

## 3. Marketplace

The Marketplace connects offers and needs across areas such as technology, services, sound systems and events, art, agriculture, circular economy, research, wellbeing and pet/community support.

A Marketplace record can represent a listing, request, agreement, order or other validated activity. The public description itself remains editable where the product requires editing. **Immutability applies to versioned evidence of an event, not to a claim that every visible word can never change.**

When an important Marketplace state is finalized, the evidence architecture can create a canonical record and cryptographic hash. Later changes produce a new version/evidence event rather than silently rewriting the historical proof.

```text
LISTING / AGREEMENT / ORDER
          ↓
VALIDATED VERSION
          ↓
CANONICAL PAYLOAD
          ↓
SHA-256 HASH
          ↓
MYZ EVIDENCE LEDGER
          ↓
BLOCKCHAIN ANCHOR (when verified)
```

Personal data, private messages and complete contracts should remain off-chain. Only privacy-safe hashes and identifiers should be anchored.

## 4. Free model, 2% commission and when MyZubster earns

MyZubster uses a free-first Seller model. Creating an account and entering the basic Seller path does not itself generate revenue for MyZubster.

The current monetization design targets a **2% platform commission on eligible real paid Marketplace transactions**. FREE/BARTER activity does not generate that commission. The commission should be calculated server-side from the trusted transaction/order state rather than from an arbitrary amount supplied by a browser.

Example:

```text
Seller registers       → €0 platform revenue
Seller publishes free  → €0 platform revenue
Free/barter exchange   → €0 platform commission
Eligible €100 sale     → target €2 platform commission
                         €98 before other applicable payment costs/taxes/adjustments
```

This means MyZubster starts earning platform commission only when a qualifying paid transaction actually occurs and is successfully processed. Registration numbers, listings, clicks and test payments are not the same as earned Marketplace revenue.

Stripe Connect onboarding is being implemented so seller payment onboarding can happen at the first real paid transaction/payout rather than being a barrier to free participation. Production payment behavior must be verified before being described as fully live.

## 5. MYZ

`MYZ` is currently an **internal utility/accounting credit**, not a public blockchain investment token and not automatically redeemable for fiat.

MYZ can represent internal accounting around contributions and ecosystem utilities. The new MYZ Evidence Ledger work adds deterministic SHA-256 evidence for two principal event classes:

- `CONTRIBUTION` — validated contribution to MyZubster;
- `MARKETPLACE` — validated Marketplace activity.

Each evidence record can contain a stable evidence ID, source reference, MYZ amount, payload hash, previous hash and evidence hash. This creates a tamper-evident append-only history. A blockchain anchor is a separate step: a database hash chain alone must not be described as a blockchain transaction.

### Status

**Implemented in development:** MYZ evidence hashing, contribution/Marketplace evidence types, previous-hash chaining, verification logic and a Tari testnet anchoring adapter.

**Not yet production-complete:** a real operational Tari testnet wallet/RPC connection for MYZ evidence, verified end-to-end transaction evidence and any Tari mainnet activation.

## 6. XMR / Monero

XMR is used in a separate settlement architecture. The existing Gateway implementation is designed around Monero **stagenet**, strict transaction validation and independent verification.

```text
AUTHORIZED SETTLEMENT
        ↓
XMR STAGENET SUBMISSION
        ↓
SUBMITTED
        ↓
INDEPENDENT VERIFIER
        ↓
TXID + RECIPIENT + AMOUNT + NETWORK + CONFIRMATIONS
        ↓
CONFIRMED
        ↓
PAID
```

A contract or Marketplace event can be linked off-chain to its verified XMR settlement evidence. The full contract and personal data are not placed on the Monero blockchain.

### Status

**Implemented in development/validation:** stagenet-only safety gates, canonical atomic amounts, TXID validation, submitter/verifier separation, idempotency/replay protections and fail-closed verification.

**Not yet production-complete:** a completed real-world mainnet payout system. Mainnet requires a separate security, custody, secrets, authorization, reconciliation and compliance review.

## 7. Contributors and immutable provenance

Contributors can participate through GitHub, documentation, code, testing, research, design, authorized observations and pilots.

The evidence model is intended to link a validated contribution to a stable source reference such as an approved/merged contribution or other reviewed project event. The evidence hash allows later verification that the recorded contribution has not been silently altered.

```text
CONTRIBUTION
    ↓
HUMAN / PROJECT VALIDATION
    ↓
SOURCE REFERENCE
    ↓
MYZ ACCOUNTING EVENT
    ↓
EVIDENCE HASH
    ↓
OPTIONAL VERIFIED BLOCKCHAIN ANCHOR
```

This does not mean that every GitHub action automatically earns MYZ or becomes blockchain evidence. Attribution, reward accounting and external settlement remain separate controlled steps.

## 8. Comic / Fumetto NFT

MyZubster also has a public narrative layer at `/fumetto`. The Comic Universe demonstrates a different blockchain use case: an artwork and its metadata can be referenced through IPFS and represented by an ERC-721 NFT.

### Implemented and verified on testnet

The first test NFT is documented on **Base Sepolia** (Chain ID `84532`):

- Collection: `MyZubster Comic Universe` (`MYZCOMIC`)
- Contract: `0x89f20a2697bc2e7746b5FC8dD5229Fb54C00Bb03`
- Token ID: `0`
- Comic: `MyZubster Comic #001 — La Città Come Organismo`
- artwork stored/referenced through IPFS;
- metadata stored/referenced through IPFS;
- ERC-721 contract with per-token metadata URI;
- confirmed testnet mint;
- `ownerOf(0)` and `tokenURI(0)` were subsequently verified.

Architecture:

```text
COMIC ARTWORK
     ↓
IPFS ARTWORK CID
     ↓
NFT METADATA
     ↓
IPFS METADATA CID
     ↓
ERC-721 CONTRACT
     ↓
BASE SEPOLIA
     ↓
VERIFIABLE TOKEN
```

NFT ownership represents ownership of the token. It does not automatically transfer copyright, trademark or commercial licensing rights.

### Still to implement before production NFT launch

- redundant IPFS pinning;
- broader automated contract testing;
- read-only NFT verification panel inside `/fumetto`;
- public display of contract, chain, token ID and metadata verification;
- explicit licensing/collector terms;
- security/deployment review;
- separate decision and authorization before Base mainnet mint/sale.

The existing Base Sepolia NFT is therefore a verified **testnet integration**, not a production NFT sale.

## 9. Nicola, universities and research profiles

MyZubster is building profile/repository patterns for individual pilot participants, including the work being organized around Nicola, and a broader university/research layer. The objective is to let a person or research group document software, datasets, methodology, contributions and reproducible pilot evidence through GitHub and MyZubster.

The university role is not to provide automatic endorsement. Universities and researchers can instead contribute through research design, data methodology, reproducibility, validation, student projects, software experiments, measurements and independent analysis where a real collaboration is established.

### Current distinction

**Implemented/available:** open GitHub collaboration patterns, profile templates, research-oriented repository work, public evidence documentation and the broader Marketplace/Zorgax/community infrastructure.

**In progress:** connecting individual profiles such as Nicola's into a standardized research/pilot evidence workflow and turning those links into independently validated academic collaborations. A repository link or invitation must not be represented as institutional university approval or partnership.

## 10. Circular-economy pilots

The pilot architecture connects the software platform to real-world circular-economy questions. Candidate/project areas include circular care and absorbent-material recycling, water, agriculture, community events/subcultures, reusable resources, Marketplace exchange and digital/metaverse documentation.

A pilot should follow an evidence-oriented path:

```text
REAL PROBLEM
    ↓
PILOT SITE / PARTICIPANTS
    ↓
AUTHORIZED DATA + METHODOLOGY
    ↓
UNIVERSITY / TECHNICAL / COMMUNITY CONTRIBUTIONS
    ↓
ZORGAX + MYZUBSTER WORKFLOW
    ↓
MARKETPLACE / PROJECT OUTPUT
    ↓
VERSIONED EVIDENCE
    ↓
OPTIONAL BLOCKCHAIN PROOF
    ↓
REPRODUCIBLE RESULTS
```

For example, a circular-care pilot can study materials, collection/reuse/recycling processes and traceability. Blockchain evidence can prove the integrity/version of selected records; it cannot by itself prove that an environmental claim is scientifically correct. Scientific conclusions still require valid methodology, measurements and review.

### Circular Care / absorbent hygiene products (AHP)

MyZubster has a dedicated technical specification for blockchain traceability of **absorbent hygiene products (AHP)**, including baby diapers, menstrual absorbent products and adult-incontinence products. The parent venture is `MZ-VENTURE-AHP-001 — MyZubster Circular Care`.

The objective is to create an auditable chain of custody:

```text
DESIGN VERSION
      ↓
PRODUCT LOT
      ↓
SUPPLY
      ↓
COLLECTION
      ↓
TRANSPORT
      ↓
TREATMENT
      ↓
RECOVERED FRACTIONS
      ↓
DESTINATION / REUSE
      ↓
REPORT
```

The design uses a **hybrid evidence ledger**. Operational records and evidence files remain off-chain. Events are canonicalized and hashed with SHA-256. Related hashes are grouped into a Merkle tree. The intended blockchain transaction publishes only the Merkle root, manifest hash, schema version and anchoring receipt. This lets an authorized verifier prove that a specific event was included without publishing the underlying personal or operational document.

Planned AHP event types include:

- `DESIGN_VERSION_PUBLISHED`;
- `LOT_CREATED`;
- `LOT_SUPPLIED`;
- `COLLECTION_RECORDED`;
- `TRANSPORT_TRANSFERRED`;
- `TREATMENT_ACCEPTED`;
- `TREATMENT_COMPLETED`;
- `FRACTION_RECOVERED`;
- `DESTINATION_CONFIRMED`;
- `CORRECTION_ISSUED`;
- `ANCHOR_PUBLISHED`.

Historical events are intended to be append-only. A correction creates a new signed event referring to the superseded event instead of deleting or silently changing history.

A QR/NFC identifier is planned to connect a physical lot/container to the evidence trail. Post-consumer pilots should normally aggregate at container or batch level rather than tracking an individual person's use.

#### What is already implemented or specified

**Implemented elsewhere in the MyZubster blockchain/evidence stack:**

- reusable SHA-256 evidence patterns;
- append-only/tamper-evident MYZ evidence concepts for Marketplace and contributors;
- blockchain/testnet integration work for other MyZubster evidence use cases;
- XMR stagenet settlement verification architecture;
- Base Sepolia Comic NFT proof of blockchain integration.

**Specified for Circular Care/AHP:**

- complete chain-of-custody event vocabulary;
- required pseudonymous identifiers;
- RFC 8785 canonical JSON + SHA-256 design;
- Merkle batch architecture;
- blockchain anchor receipt format;
- digital-signature and actor-role model;
- QR/NFC physical linkage design;
- privacy boundaries;
- verification states from `DRAFT` through `ANCHORED`;
- correction/dispute model;
- pilot acceptance criteria;
- security baseline.

#### What is not implemented yet

The AHP document is currently a **technical specification, not a completed blockchain pilot**. In particular, MyZubster does not yet have evidence of a real AHP blockchain transaction representing a physical absorbent-product recycling batch.

The remaining implementation gates are:

1. implement the AHP event schema and local append-only evidence ledger;
2. implement canonical JSON, signatures and persistent evidence storage for the AHP event model;
3. connect a real authorized pilot site and obtain authorized operational data;
4. assign a real pilot/product lot and connect it through QR/NFC;
5. capture signed supply, collection, transport, treatment and destination events;
6. reconcile input mass, rejected mass and recovered fractions within a declared tolerance;
7. implement Merkle batching of verified event hashes;
8. select a pilot blockchain/testnet using explicit cost, finality, energy, SDK, retention and governance criteria;
9. implement the chain-specific anchor adapter;
10. execute and confirm the first real **testnet** AHP anchor transaction;
11. store transaction ID, chain/network, block reference, Merkle root and confirmation state in the anchor receipt;
12. implement an independent Merkle-proof verifier and public evidence page;
13. test corrections, key rotation, duplicate/replay protection and failed-anchor recovery;
14. complete privacy/security review before any production deployment;
15. require a separate production/Mainnet authorization rather than treating a successful testnet pilot as automatic Mainnet approval.

A successful blockchain anchor proves **integrity and timestamp of the evidence**. It does not by itself prove that an absorbent product was recycled, that measurements are accurate, or that an environmental result is scientifically valid. Those claims require signed operational records, measurements and independent scientific/technical verification.

## 11. What blockchain means inside MyZubster

MyZubster is not designed to put everything on-chain. The intended model is selective evidence anchoring:

| Layer | Purpose | Status |
|---|---|---|
| GitHub | Open-source provenance and collaboration | Operational |
| Marketplace | Offers, needs, Seller activity and transactions | MVP / active development |
| MYZ | Internal utility/accounting credit | Implemented internal flow; evidence extension in development |
| MYZ Evidence Ledger | Hash contributions and Marketplace evidence | Development implementation |
| Tari anchor | External MYZ evidence anchor | Testnet adapter; real wallet E2E pending |
| XMR | Privacy-oriented settlement evidence | Stagenet implementation/validation; mainnet pending |
| Comic NFT | ERC-721 narrative/digital collectible proof | Base Sepolia testnet NFT verified |
| AHP / Circular Care | Chain-of-custody + Merkle blockchain evidence for absorbent-product circularity | Technical specification; physical pilot + testnet anchor pending |
| IPFS | Content-addressed Comic artwork/metadata | Initial test pinning; redundancy pending |

## 12. The complete MyZubster journey

```text
DISCOVER MYZUBSTER
      ↓
CREATE / AUTHENTICATE FREE ACCOUNT
      ↓
COMPLETE PROFILE WITH ZORGAX
      ↓
CHOOSE A PATH
 ┌────────────┬─────────────┬──────────────┬──────────────┐
 │ Marketplace│ Contributor │ Research     │ Pilot        │
 └────────────┴─────────────┴──────────────┴──────────────┘
      ↓
CREATE REAL, REVIEWABLE ACTIVITY
      ↓
VALIDATION / AGREEMENT / MERGE / MEASUREMENT
      ↓
EVIDENCE + PROVENANCE
      ↓
MYZ ACCOUNTING / MARKETPLACE TRANSACTION WHERE APPLICABLE
      ↓
OPTIONAL VERIFIED BLOCKCHAIN EVIDENCE
      ↓
PUBLICLY EXPLAINABLE, AUDITABLE HISTORY
```

MyZubster's goal is therefore not simply "put it on blockchain". The goal is to connect people, transactions, contributions and research to evidence whose origin and later integrity can be checked, while keeping sensitive information off-chain and clearly distinguishing prototypes, testnets and verified production functionality.
