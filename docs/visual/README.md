# MyZubster GitHub Visual Hub

This directory is the canonical entry point for the MyZubster visual documentation layer maintained by Zorgax Visual Intelligence.

The goal is not decoration. The goal is to make architecture, contributor workflows, maturity, provenance, evidence and the GitHub-native metaverse model easier to understand without upgrading claims beyond their evidence.

## Open the hub

Serve `docs/visual/` with any static HTTP server and open `index.html`.

The hub is intentionally plain HTML/CSS/JavaScript so it can be hosted on GitHub Pages or integrated into `myzubster.com` without a mandatory framework or backend.

## Canonical evidence model

Interactive evidence-first views read `data/evidence.json`. World State, Adoption Ladder, Chronicle, Character Registry, Mission-to-Chronicle and Evidence Freshness Monitor must preserve the states and source boundaries recorded there; a view may filter, audit or reorganize records but must not promote them.

## Public visual asset layer

The binary PNG asset layer lives in the dedicated public repository `MyZubster-Ecosystem/MyZubster-Visual`. Narrative/AI images remain illustrative and **NOT EVIDENCE**. Public availability does not establish deployment, adoption, affiliation, identity, payment or physical truth.

## Current packages

- **#001 — Ecosystem Architecture** — repository and integration boundaries.
- **#002 — Contributor → Evidence** — bounty, evidence, review and settlement separation.
- **#003 — GitHub-Native Metaverse** — repository → mission → contributor → evidence → verification → ecosystem change.
- **#004 — Maturity Map** — maturity vocabulary; component classifications remain evidence-dependent.
- **#005 — Public Repository Map** — searchable public repository inventory.
- **#006 — Contributor Journey** — discovery → mission → evidence → review → verified ecosystem change.
- **#007 — World State / Evidence Ledger** — explicit claim states capped by linked evidence.
- **#008 — Chronicle** — evidence-linked narrative timeline generated from canonical records.
- **#009 — Adoption Ladder** — discovery → interest → fork → contribution → integration → deployment → verified adoption.
- **#010 — Character Registry** — Git-linked contributor characters with bounded status semantics.
- **#011 — Gateway System** — gateway and settlement boundaries.
- **#012 — App / Marketplace** — client and marketplace system boundaries.
- **#013 — Robotics / IoT** — experimental physical-system tracks with maturity labels.
- **#014 — Runtime Evidence** — runtime claims separated from code/workflow existence.
- **#015 — Registry / Real-World Observation** — observation records separated from physical truth.
- **#016 — Security / Trust Boundaries** — authorization and verification boundaries.
- **#017 — Cross-Repository Mission Graph** — repository relationships without implying live integration.
- **#018 — Evidence Provenance Inspector** — source and claim-boundary inspection.
- **#019 — Contributor Trust / Verification Journey** — contribution history → contextual trust; reward is not trust.
- **#020 — Mission-to-Chronicle Renderer** — mission/evidence records → bounded narrative, preserving missing transitions as evidence gaps.
- **#021 — Evidence Freshness / Contradiction Monitor** — deterministic freshness and internal-consistency review signals over the canonical evidence dataset.
- **Concept Image Archive** — AI/narrative assets catalogued without promotion to evidence.

## Character Registry

The authoritative starting point for contributor characters is GitHub Issue [#617](https://github.com/MyZubster-Ecosystem/myzubster/issues/617).

Character states are evidence-bounded. `VERIFIED_CONTRIBUTOR` means a public contribution link exists; it does **not** mean KYC, legal identity verification, employment, partnership, payment, endorsement or ownership.

## Evidence guardrails

```text
Issue              != completed mission
PR opened          != accepted contribution
PR merged          != external payment
Workflow exists    != successful runtime
Database/API record!= physical truth
AI-generated image != evidence
Token/reward       != trust or identity
Repository relation!= live integration
Roadmap item       != released feature
Discovery          != adoption
Fresh              != true
Stale              != false
```

Every visual package should include provenance notes or a manifest describing its source and whether it is documentation, evidence, official material or narrative illustration.

## Before publishing a visual

- [ ] Text is readable on desktop and mobile.
- [ ] Every factual claim has a public evidence link.
- [ ] AI visuals are explicitly marked illustrative / not evidence.
- [ ] No invented metrics, geography, contributors or system-health claims remain.
- [ ] No secrets, tokens, private keys or unnecessary personal data appear.
- [ ] External projects are not described as partners without evidence.
- [ ] Logos and names do not imply endorsement or affiliation.
- [ ] The repository-native/canonical documentation remains the factual reference.

## Next priorities

1. **#022 — Public Ecosystem Status Console**;
2. review-readiness pass across canonical data, navigation and accessibility;
3. next evidence-first system view only if justified by verified repository state.

## Governance

Visual packages should normally be introduced through a dedicated branch and **draft pull request**. Human review remains required before merge.

See also `ASSET_PIPELINE.md`, `../ZORGAX_SYSTEM.md`, `../ZORGAX_AUTOMATION.md`, `../MYZUBSTER_METAVERSE.md`, and `../../BOUNTIES.md`.

**MyZubster — build the world in public.**
