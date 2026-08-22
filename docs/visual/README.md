# MyZubster GitHub Visual Hub

This directory is the canonical entry point for the MyZubster visual documentation layer maintained by Zorgax Visual Intelligence.

The goal is not decoration. The goal is to make architecture, contributor workflows, maturity, provenance, evidence and the GitHub-native metaverse model easier to understand without upgrading claims beyond their evidence.

## Open the hub

Serve `docs/visual/` with any static HTTP server and open `index.html`.

The hub is intentionally plain HTML/CSS/JavaScript so it can be hosted on GitHub Pages or integrated into `myzubster.com` without a mandatory framework or backend.

## Public visual asset layer

The binary PNG asset layer now lives in the dedicated public repository `MyZubster-Ecosystem/MyZubster-Visual`.

Current Zorgax pack publication:

- branch: `update/drive-visuals-2026-08-21`
- commit: `bd29f4df18c527493b026f48319040c180042367`
- reviewed asset: `assets/zorgax/ready-for-github/`
- illustrative assets: `assets/zorgax/concept-not-evidence/`

See [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md) for the system boundary between Drive archive, public binary assets and canonical evidence.

## PC Upload Pack integration — 2026-08-22

The Drive staging pack `PC-UPLOAD-PACK-2026-08-22` is treated as a working archive; GitHub remains the versioned source of truth.

The reviewed `READY-FOR-GITHUB` asset `001-myzubster-ecosystem-architecture-zorgax.png` has been integrated as a repository-native SVG package under `architecture/` and is also publicly versioned in `MyZubster-Visual`. The image is architecture documentation, not operational evidence.

All **11** narrative/AI PNGs found in `CONCEPT-NOT-EVIDENCE` are catalogued under [`concept-gallery/`](concept-gallery/) with filename, Drive archive ID, public GitHub asset path, category, evidence status and canonical source/path where available.

These PNGs remain explicitly **AI-generated / illustrative / NOT EVIDENCE** and must not be used to prove metrics, deployment, adoption, geography, contributor counts, partnerships, identity, settlement or system health.

The asset `external-git-metasploit-UNVERIFIED-CONCEPT.png` is specially classified as **UNVERIFIED EXTERNAL CANDIDATE / NO AFFILIATION**. Its presence in the visual archive does not establish integration, endorsement, authorization or partnership.

## Current packages

- **#001 — Ecosystem Architecture** — repository and integration boundaries; repository SVG + public/archive render.
- **#002 — Contributor → Evidence** — bounty, evidence, review and settlement separation.
- **#003 — GitHub-Native Metaverse** — repository → mission → contributor → evidence → verification → ecosystem change.
- **#004 — Maturity Map** — maturity vocabulary; individual component classifications remain evidence-dependent.
- **#005 — Public Repository Map** — searchable public repository inventory.
- **#006 — Contributor Journey** — discovery → mission → evidence → review → verified ecosystem change.
- **#007 — World State / Evidence Ledger** — explicit claim states capped by linked evidence.
- **#009 — Adoption Ladder** — discovery → interest → fork → contribution → integration → deployment → verified adoption.
- **Concept Image Archive** — all 11 AI/narrative PNGs from the PC Upload Pack, publicly versioned and catalogued without promoting them to evidence.

## Character Registry

The authoritative starting point for contributor characters is GitHub Issue [#617](https://github.com/MyZubster-Ecosystem/myzubster/issues/617).

Character states are evidence-bounded. `VERIFIED_CONTRIBUTOR` means a public contribution link exists; it does **not** mean KYC, legal identity verification, employment, partnership, payment, endorsement or ownership.

## Evidence guardrails

```text
Issue              != completed mission
PR opened          != accepted contribution
PR merged          != external payment
AI-generated image != evidence
Public asset       != factual proof
Roadmap item       != released feature
Indexing           != endorsement
Discovery          != adoption
Visual archive     != affiliation
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

1. first full interactive Zorgax Chronicle;
2. Character Registry view derived from Issue #617;
3. Gateway architecture package;
4. Marketplace/App visual package;
5. robotics/IoT visual package with explicit maturity labels.

## Governance

Visual packages should normally be introduced through a dedicated branch and **draft pull request**. Human review remains required before merge.

See also:

- [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md)
- [`../ZORGAX_SYSTEM.md`](../ZORGAX_SYSTEM.md)
- [`../ZORGAX_AUTOMATION.md`](../ZORGAX_AUTOMATION.md)
- [`../MYZUBSTER_METAVERSE.md`](../MYZUBSTER_METAVERSE.md)
- [`../../BOUNTIES.md`](../../BOUNTIES.md)

**MyZubster — build the world in public.**
