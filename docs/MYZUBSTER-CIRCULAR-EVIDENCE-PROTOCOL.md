# MyZubster Circular Evidence Protocol

Status: architecture/specification. This document defines a common evidence model for MyZubster circular-economy pilots. It does not by itself certify environmental claims, authorize waste treatment, or prove that a physical event occurred.

## Purpose

Use one reusable evidence architecture across different MyZubster pilots while allowing every sector to keep its own measurements, regulations and scientific methodology.

Common flow:

`real activity -> measurement -> evidence -> MyZubster record -> cryptographic commitment -> Marketplace/Metaverse -> customer/community action -> reuse/recycling/next event`

The blockchain layer is an integrity/timestamp layer. Full documents, personal data, health data, commercial secrets and detailed operational records remain off-chain.

## Common evidence envelope

Each pilot event should be append-only and contain, where applicable:

- `eventId` and `pilotId`
- evidence type and schema version
- pseudonymous actor/organization reference
- subject reference: lot, product, service, event, asset or container
- timestamp
- measurement and unit
- measurement method/source
- evidence/document hashes
- previous-event reference
- verification/signature state
- optional Marketplace listing/order reference
- optional reuse/recycling/destination reference
- optional blockchain anchor receipt

Corrections create a new event that references the old one. Historical evidence is never silently overwritten.

## Sector profiles

### Kefir and community food pilots

Possible evidence: quantity produced or exchanged, batch/lot where appropriate, reuse/propagation of cultures, ingredients/provenance where authorized, community contributions, Marketplace exchanges and circular handling of containers or by-products.

Food-safety and regulatory claims require the appropriate independent evidence; blockchain anchoring does not certify food safety.

### Hemp

Possible evidence: cultivated/received quantity, harvest weight, transformation, recovered material fractions, by-products, reuse, destination and Marketplace transactions.

The pilot must use the measurements and regulatory controls appropriate to the specific hemp activity.

### Circular Care / AHP

Possible evidence: product lot, input weight, collection, transport, treatment acceptance, recovered fractions, rejects, final destination/reuse and associated authorized Circular Water measurements.

Post-use absorbent products must not be introduced into water-treatment processes unless an authorized technical/regulatory protocol explicitly permits it.

### Circular Water

Possible evidence: authorized plant/site datasets, flow/quality measurements, treatment/reuse events, KPI/MRV evidence and links to related circular pilots where scientifically justified.

### Sound systems, events and subcultures

Circular contribution does not always require kilograms. Evidence can cover events delivered, equipment shared/rented, repairs, reuse, maintenance, services contributed, community participation and documented circular practices.

### Agriculture and fruit businesses

Possible evidence: lot, quantity, producer, Marketplace listing/order, direct customer relationship, surplus handling, recovery, reuse, composting or other documented destination.

This can let a customer inspect available evidence about a product or seller and, where a real scheme exists, choose an available return/reuse/recycling path.

## Marketplace

Marketplace can connect evidence to listings and transactions without claiming that every listing is independently verified.

A listing may expose a verification summary such as:

- evidence available / unavailable
- producer or pilot identity status
- lot or service reference
- measurements supplied
- independent verification status
- circular destination/return option where available
- blockchain anchor status and verification link

Free/barter activity can create evidence without a platform commission. Eligible real paid Marketplace transactions follow the separately defined MyZubster monetization policy; blockchain evidence must not be confused with payment settlement.

## Metaverse

The Metaverse can act as an exploration layer for producers, pilots, universities, sound systems and communities. A visitor can discover a project, inspect its declared/verified evidence, open its Marketplace offering and interact directly with the participant.

The interface must distinguish participant declarations from independently verified evidence.

## Contributions and MYZ

A contribution can create a MYZ evidence event when the contribution policy recognizes it. MYZ remains an internal utility/accounting mechanism unless separately reviewed and implemented otherwise.

Evidence should record what contribution occurred and its verification state. It must not imply monetary or investment value.

## Integrity architecture

Recommended pipeline:

1. Store canonical event + supporting evidence off-chain.
2. Canonicalize the event and calculate a SHA-256 commitment.
3. Sign/verify the event where the pilot requires it.
4. Link events append-only.
5. Batch commitments with a Merkle tree when appropriate.
6. Anchor only the Merkle root/commitment and minimal non-sensitive metadata on an approved test network.
7. Store network, transaction ID, block reference and confirmation state in the off-chain receipt.
8. Allow an independent verifier to recompute the event hash and Merkle proof.

For sensitive or predictable evidence, use an appropriate nonce/salted commitment design so public commitments do not make dictionary attacks easier.

## What blockchain proves and does not prove

A confirmed anchor can support evidence that a specific cryptographic commitment existed by a certain point and has not subsequently been changed without detection.

It does **not** independently prove that:

- a stated weight was measured correctly;
- recycling physically occurred;
- a product is environmentally sustainable;
- a scientific result is valid;
- a participant is legally compliant;
- a product is safe or certified.

Those claims require measurements, authorized operators, signatures, audits, scientific methods or other appropriate verification.

## Pilot completion gate

A pilot should be described as end-to-end verified only when it has:

1. a real participant/site;
2. a defined physical or service flow;
3. sector-appropriate measurements/KPIs;
4. authorization for the data used;
5. append-only evidence records;
6. required signatures/verification;
7. mass-balance or equivalent reconciliation where relevant;
8. a confirmed testnet anchor of the evidence commitment/Merkle root;
9. an independently reproducible verification proof;
10. a report separating measured, declared, independently verified, estimated and unknown information.

Production/mainnet use, regulated processing, payment settlement and public environmental claims remain separate approval/review gates.

## Target MyZubster journey

`participant -> free MyZubster profile -> pilot/profile evidence -> product/service/listing -> Marketplace/Metaverse discovery -> customer/community interaction -> contribution/transaction -> reuse/recycling/next event -> verification -> evidence commitment -> blockchain anchor`

This architecture is intended to make MyZubster extensible: a new circular-economy pilot should implement a sector profile and reuse the common evidence layer rather than inventing a new blockchain workflow for every category.
