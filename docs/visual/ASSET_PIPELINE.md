# Zorgax Visual Asset Pipeline

This document defines the public visual-asset layer used by the MyZubster Visual Hub.

## Current flow

```text
Google Drive working archive
        ↓
PC-UPLOAD-PACK review
        ↓
classification
  ├─ READY-FOR-GITHUB
  └─ CONCEPT-NOT-EVIDENCE
        ↓
MyZubster-Ecosystem/MyZubster-Visual
        ↓
versioned public binary assets
        ↓
MyZubster Visual Hub
        ↓
GitHub Pages / myzubster.com integration
```

## Repository responsibilities

### `MyZubster-Ecosystem/MyZubster-Visual`

Public binary-asset repository for visual material that needs Git versioning and stable public paths.

Current Zorgax import:

- branch: `update/drive-visuals-2026-08-21`
- commit: `bd29f4df18c527493b026f48319040c180042367`
- ready assets: `assets/zorgax/ready-for-github/`
- concept assets: `assets/zorgax/concept-not-evidence/`

### `MyZubster-Ecosystem/myzubster`

Canonical documentation/evidence layer. It contains the Visual Hub, manifests, evidence guardrails, world-state views and canonical source links.

## Truth boundary

```text
PUBLIC ON GITHUB != EVIDENCE
AI IMAGE         != REAL EVENT
DRIVE ARCHIVE    != PROOF
VISUAL CATALOG   != ENDORSEMENT
```

A visual can be publicly versioned while remaining illustrative.

## Asset classes

### READY-FOR-GITHUB

An asset has passed a basic publication review for repository use. This does not automatically make every statement inside the asset evidence. Canonical documentation remains authoritative.

### CONCEPT-NOT-EVIDENCE

AI-generated or narrative material intended for storytelling, Chronicle covers, visual explanation or experimentation. Every public use must preserve a visible `AI-generated / illustrative / not evidence` label.

### UNVERIFIED EXTERNAL CANDIDATE

Visuals mentioning external tools/projects without verified affiliation. These require explicit `NO AFFILIATION` language until a public relationship/integration is independently established.

## Publication requirements

Before a visual is surfaced in the Visual Hub or site:

1. confirm its public GitHub path;
2. preserve the evidence classification;
3. link canonical documentation/evidence where available;
4. ensure no secret, token, private key or unnecessary personal data is present;
5. remove or qualify unsupported metrics, geography, system-health and adoption claims;
6. do not imply an external partnership from logos/names alone;
7. keep human review before merge/release.

## Current integration

The Visual Hub concept gallery reads `docs/visual/concept-gallery/manifest.json`, which maps each Drive archive item to its public `MyZubster-Visual` path and canonical evidence source.

The browser gallery can therefore show the public PNG while keeping the evidence source separate and inspectable.

## System principle

> **Version the visual. Preserve the provenance. Never upgrade the claim beyond its evidence.**
