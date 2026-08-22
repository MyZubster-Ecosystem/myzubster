# MyZubster — Public Open-Source System Guide

This document explains how the MyZubster ecosystem is organized and how its major components connect. It is intentionally public so contributors, users and reviewers can understand the project without relying on private infrastructure knowledge.

> MyZubster is under active development. Every component should be described as verified, development, experimental or roadmap. Testnet validation is not the same as production readiness.

## System map

```text
People / contributors
        |
        v
Account + skills + work history
        |
        +------------------+
        |                  |
        v                  v
Verified wallet       Real-world evidence
        |                  |
        v                  v
MYZ economy           Maps / media / bounties
        |
        v
Character NFTs / digital assets
        |
        v
Marketplace / creator economy
        |
        +------------------+
        |                  |
        v                  v
Web / Android         Onion / privacy access
        |
        v
Persistent worlds / metaverse / multiverse
```

## Status legend

- **Verified** — a reproducible end-to-end flow has been tested.
- **Development** — code or integration exists and is being hardened.
- **Experimental** — prototype/research track.
- **Roadmap** — planned architecture, not a released product.

## Identity and decentralization

MyZubster separates application identity from blockchain ownership.

A MyZubster account handles authentication, permissions, profiles, work history and contribution workflows. A blockchain wallet can be associated with an account through a challenge-and-signature process. The user signs a generated message locally; the backend verifies the signature and records that the user controls that wallet on the selected chain.

The current system does not claim to be a standards-complete decentralized-identity implementation. Instead, it provides reusable identity primitives: account identity, verified wallet ownership, public contribution history, Character NFTs and future attestations.

**Status: wallet verification verified on Ethereum Sepolia; broader decentralized identity in development.**

## MYZ

MYZ is the MyZubster ecosystem value/reward layer. Documentation must distinguish between internal accounting, the ERC-20 testnet token and any external settlement rail.

The NFT branch contains a `MyZubsterToken` ERC-20 implementation. A Sepolia MYZ deployment has been used in an end-to-end NFT marketplace test.

**Status: MYZ ERC-20 verified on Sepolia. No mainnet production claim.**

## Character NFTs

`MyZubsterCharacter` is the current ERC-721 Character NFT contract.

The Character flow connects a MyZubster user, a verified wallet, NFT metadata, an Ethereum transaction and a backend asset record. The backend checks on-chain evidence before marking the asset as minted.

```text
User
  ↓
Verified wallet
  ↓
Character asset draft
  ↓
ERC-721 mint
  ↓
On-chain verification
  ↓
Backend ownership synchronized
```

The first Character NFT end-to-end flow has been successfully tested on Sepolia.

**Status: verified on Sepolia.**

## NFT marketplace

The marketplace is designed to verify sales instead of trusting a client-provided status.

A seller lists an owned asset, a verified buyer completes the required payment, the NFT moves to the buyer, and the backend checks the relevant on-chain transactions before closing the sale.

The tested Sepolia flow included two separate MyZubster users, two verified wallets, a Character NFT listing, MYZ payment, ERC-721 transfer and final backend ownership synchronization.

**Status: end-to-end marketplace flow verified on Sepolia; production hardening remains in development.**

## Comics and creator economy

MyZubster includes a public comic and visual-contribution workflow. Creators can connect original stories and illustrations to documented MyZubster observations, technical work, discoveries or ecosystem narratives and submit them through the open-source contribution process.

The future creator economy can connect comics and other original works to digital ownership and marketplace layers when a specific asset is explicitly minted and listed. A GitHub comic file is not automatically an NFT and publication is not proof of payment.

```text
Original comic / visual
        ↓
rights + provenance
        ↓
GitHub review / publication
        ↓
optional digital asset representation
        ↓
creator marketplace
```

**Status: comic contributor workflow active/development; generalized comic NFT storefront roadmap.**

## Work, skills and competence

A central MyZubster goal is to make competence visible through evidence rather than only self-declared profile fields.

Useful evidence may include accepted open-source contributions, completed bounties, reviewed technical work, real-world observations, creative work, community review and other verifiable contributions.

```text
Profile
  +
work history
  +
evidence
  +
review
  =
verifiable competence history
```

The project should avoid opaque permanent scoring of people. Users should be able to understand which evidence supports a skill or competence claim.

**Status: development / architecture.**

## Android mobile app — work and skills

The Android/mobile application is the planned user-friendly bridge for the work and competence layer.

The intended mobile experience should let a user:

- create or access a MyZubster account;
- maintain a professional/skills profile;
- browse work opportunities and open bounties;
- claim eligible tasks;
- upload authorized evidence and progress;
- follow review and verification status;
- view contribution and competence history;
- connect a wallet when a blockchain workflow requires it;
- view MYZ status and owned digital assets;
- view Character NFTs;
- browse marketplace listings;
- use maps, observations and field workflows from a phone.

```text
Android app
    ↓
Profile + skills
    ↓
Find work / bounty
    ↓
Submit evidence
    ↓
Review / verification
    ↓
Competence history
    ↓
Reward / settlement when applicable
```

Until a production Android package is independently verified, public documentation must label it as development/roadmap and must not claim Google Play availability.

**Status: roadmap / development integration.**

## Escrow and settlement boundaries

Escrow is a separate security and settlement layer for workflows that need release, refund or dispute handling. It should define who participates, what evidence is required, what timeout/dispute process applies and which settlement rail is being used.

Configuration alone is not proof that funds are held in a live multisig arrangement. MyZubster documentation must distinguish an escrow design from an independently verified escrow transaction.

**Status: experimental/integration track unless a specific implementation is verified.**

## Monero / XMR

Monero can exist as a privacy-oriented external settlement rail for workflows that explicitly support it. XMR is separate from MYZ and separate from EVM NFT ownership.

A GitHub merge, internal accounting record or NFT event must never be presented as proof of an XMR payment. External settlement needs its own evidence and verification.

**Status: separate integration boundary.**

## Onion / Tor access

The repository contains an `onion/` deployment track with a Dockerfile, README, entrypoint and healthcheck. This provides a privacy-oriented alternative access path for selected services.

Tor/Onion access does not automatically make the full application anonymous or decentralized. Authentication, logs, external APIs and submitted data still require explicit privacy review.

Private Tor service keys and infrastructure credentials must never be committed. Public Onion addresses may be documented only when intentionally designated as public endpoints.

**Status: development / integration.**

## IPFS / IPNS distribution

Public and sanitized evidence can be distributed through content-addressed systems such as IPFS/IPNS so public datasets or content snapshots are not dependent on a single application server.

Sensitive information, credentials and sensitive locations must not be placed into immutable public content-addressed storage.

**Status: development / integration.**

## Metaverse / multiverse direction

MyZubster treats the metaverse/multiverse as a long-term layer built on persistent identity, assets, work, evidence and economy — not simply as a 3D graphic world.

```text
Identity
  ↓
Character / avatar
  ↓
Owned digital assets
  ↓
MYZ economy
  ↓
Marketplace
  ↓
Skills + contribution evidence
  ↓
Persistent environments
```

Future environments may include biodiversity worlds, urban laboratories, creator/comic worlds, work and skill hubs, digital twins and other experiences connected to real MyZubster evidence.

**Status: roadmap; foundational NFT and MYZ testnet primitives verified.**

## Open-source distribution

MyZubster is designed to be inspectable, forkable and reproducible through public repositories.

Public repositories can contain source code, contracts, tests, safe deployment templates, architecture documentation, public testnet contract addresses, sanitized datasets and reproducible test evidence.

They must never contain private keys, seed phrases, real database passwords, JWT secrets, private API keys, personal access tokens, private Tor keys or unnecessary personal information.

```text
GitHub repositories
       ↓
branches + pull requests
       ↓
tests + review
       ↓
web / API / containers / mobile
       ↓
publicly inspectable system
```

## Architecture rule: evidence domains stay separate

```text
PR merged
   ≠
work verified
   ≠
reward recorded
   ≠
NFT transferred
   ≠
external payment verified
   ≠
escrow released
```

Each transition needs evidence appropriate to that layer.

## User-facing goal

The long-term product goal is to hide infrastructure complexity without hiding verification.

A normal user should experience:

```text
Create account
   ↓
Build profile and skills
   ↓
Connect wallet only when needed
   ↓
Create / receive digital identity
   ↓
Work / contribute / create
   ↓
Earn / buy / sell
   ↓
See clear verification status
```

Users should not need to understand RPC URLs, chain IDs, Hardhat, command-line tools or database schemas to use MyZubster.

## Public capability matrix

| Component | Public status |
|---|---|
| Core web/API | Development / validation |
| Account authentication | Development / active |
| Wallet signature verification | Verified on Sepolia |
| MYZ internal ecosystem accounting | Development / existing layer |
| MYZ ERC-20 | Verified on Sepolia; no mainnet claim |
| Character ERC-721 | Verified on Sepolia |
| NFT backend mint verification | Verified on Sepolia |
| NFT marketplace MYZ payment verification | Verified on Sepolia |
| NFT ownership transfer verification | Verified on Sepolia |
| Comic contributor workflow | Active / development |
| General comic NFT storefront | Roadmap |
| Skills/work competence graph | Development / architecture |
| Android skills/work client | Roadmap / integration |
| Escrow/multisig | Experimental / integration |
| Monero/XMR settlement | Separate integration track |
| Onion/Tor deployment | Development / integration |
| IPFS/IPNS distribution | Development / integration |
| Metaverse/multiverse worlds | Roadmap |

## Contributing

Contributors are welcome across Android/mobile UX, NFT onboarding, smart-contract testing, marketplace UX, accessibility, work/skills profiles, escrow design, comics, Onion/Tor deployment, IPFS publishing, metaverse prototypes, translations and documentation.

Before contributing:

1. read the repository and issue/bounty rules;
2. never include secrets;
3. add tests when behavior changes;
4. distinguish verified implementation from roadmap claims;
5. include reproducible evidence where appropriate;
6. preserve privacy and data minimization.

## Transparency principle

```text
CODE + TESTS + VERIFIABLE EVIDENCE
              >
PROMOTIONAL CLAIMS
```

MyZubster is open source so the public can understand how the pieces fit together and can also see which components are verified today, which are still being developed and which remain long-term ideas.
