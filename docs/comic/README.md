# MyZubster "How It Works" Comic — Contributor Specification

This directory hosts the visual comic/guide explaining the MyZubster workflow.

## Required Assets

| File | Description | Specifications |
|------|-------------|----------------|
| `myzubster-how-it-works.png` | README-optimized version | PNG/WebP, ≤2 MB, legible on desktop & mobile (min 1200px width) |
| `myzubster-how-it-works-hires.png` | High-resolution version | PNG/WebP, print/social quality (≥3000px width) |
| `source/` | Editable source files **or** regeneration workflow | `.psd`, `.kra`, `.fig`, `.ai` **or** `prompt.md` + tool/version + seed |
| `ATTRIBUTION.md` | Author, license, tools, rights statement | See template below |

## Narrative Flow (7 Panels Minimum)

The comic must clearly depict this sequence:

1. **Osserva** — User/App captures real-world observation (photo, sensor, note)
2. **Documenta** — Observation structured into evidence (metadata, hash, IPFS)
3. **Collega** — Evidence linked to map/dataset/skill via Core MyZubster
4. **Collabora** — Others review, annotate, validate, or extend
5. **Verifica** — Verifier/gateway checks integrity, signatures, reproducibility
6. **Pubblica** — Validated evidence published to IPNS/gateway, discoverable
7. **Reward / Settlement** — MYZ ledger entry recorded; external settlement (XMR/other) separate & independently verified

## Visual Requirements

- **Architecture fidelity**: Show App/Web ↔ Core MyZubster ↔ IPFS/IPNS ↔ Gateway ↔ Verifier relationships
- **MYZ representation**: Internal reward/accounting ledger only — **not** automatic blockchain payment
- **External settlement**: Clearly separated, labeled "subject to independent verification"
- **Fact vs. fiction**: Real-world evidence and narrative elements visually distinguishable
- **No secrets**: No wallet addresses, private keys, local paths, personal data
- **Accessibility**: Legible at mobile width (≈375px), sufficient contrast

## ATTRIBUTION.md Template

```markdown
# Attribution & Rights

**Author**: <alias / legal name>
**GitHub**: @<handle>
**Workflow**: human-made | AI-assisted | mixed (specify tools: Midjourney v6, Stable Diffusion XL, Figma, Krita, etc.)
**License**: CC-BY-4.0 | CC0 | other (must allow repo inclusion & derivative docs)
**Rights statement**: "I confirm I own or have rights to all visual elements and grant MyZubster-Ecosystem perpetual, irrevocable right to use, modify, distribute in project docs, website, social."
**Date**: YYYY-MM-DD
**Regeneration notes**: <prompts, seeds, model versions, layer structure, or "N/A — fully hand-drawn">
```

## Acceptance Checklist (from Bounty #526)

- [ ] Original work; contributor holds/grants necessary rights
- [ ] Flow Osserva → Documenta → Collega → Collabora → Verifica → Pubblica → Reward/Settlement recognizable
- [ ] No fictional features presented as operational
- [ ] MYZ shown as internal ledger, not auto blockchain payment
- [ ] External settlement (XMR/token) separated & labeled "subject to independent verification"
- [ ] Real-world evidence vs. narrative visually distinct
- [ ] No secrets, personal data, wallet addresses, local paths
- [ ] Legible desktop & mobile
- [ ] Source/regeneration workflow documented
- [ ] PR with assets, README/docs updates, screenshots, checklist

## Contribution Process

1. Comment `CLAIM` on [issue #526](https://github.com/MyZubster-Ecosystem/myzubster/issues/526) with alias, workflow, ETA
2. Maintainer confirms no conflicting claim
3. Create branch/fork, produce assets per spec
4. Open PR with `Closes #526`
5. Attach renders/screenshots, completed checklist, regeneration notes

---

*This specification derives from [Bounty #526](https://github.com/MyZubster-Ecosystem/myzubster/issues/526). The bounty reward (300 MYZ proposed) follows the lifecycle in `BOUNTIES.md` and is not guaranteed by PR merge alone.*
