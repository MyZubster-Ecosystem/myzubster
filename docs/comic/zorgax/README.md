# 🧭 Zorgax Chronicle

> **Interactive, evidence-backed comics generated from real MyZubster events.**

Zorgax Chronicle is the visual storytelling layer of the MyZubster ecosystem.

It turns important, public and verifiable events — such as substantial pull requests, confirmed system failures and fixes, external editorial coverage, independent integrations, contributor activity and GitHub-native metaverse milestones — into interactive web comics that remain connected to their sources.

A Chronicle is not just an image.

It is a small static web application that combines narrative, evidence, provenance and GitHub history.

```text
REAL EVENT
   ↓
ZORGAX OBSERVES
   ↓
EVIDENCE IS VERIFIED
   ↓
STORY IS STRUCTURED
   ↓
CANVA + AI VISUALS
   ↓
HTML + CSS + JS
   ↓
GITHUB DRAFT PR
   ↓
HUMAN REVIEW
   ↓
GITHUB PAGES / MYZUBSTER.COM
```

---

## Why Zorgax Chronicle exists

MyZubster is designed around public construction, evidence and verifiable contribution.

The Chronicle layer makes that evolution easier to understand visually without turning unverified claims into facts.

The goal is to transform technical and ecosystem events into a public, inspectable history.

Examples:

```text
PR opened
   ↓
Contribution reviewed
   ↓
Tests pass
   ↓
Chronicle explains what changed
```

```text
External source mentions MyZubster
   ↓
Zorgax verifies source and context
   ↓
Chronicle records the event
```

```text
Independent integration appears
   ↓
Adoption Radar verifies evidence
   ↓
Chronicle documents the adoption level
```

---

# Chronicle categories

Each episode should be classified according to the type of event it represents.

## SYSTEM

Used for technical events such as:

- confirmed bugs;
- CI or deployment failures;
- regressions;
- dependency problems;
- important fixes;
- structural improvements;
- security/deprecation notices with demonstrated impact.

Example lifecycle:

```text
FAILURE
   ↓
DIAGNOSIS
   ↓
FIX
   ↓
TEST
   ↓
DRAFT PR
   ↓
VERIFIED STATUS
```

## EXTERNAL

Used when an important independent source discusses or analyzes MyZubster.

Examples:

- technology media;
- editorial newsletters;
- universities;
- independent technical blogs;
- community analysis;
- external public research.

Simple automated indexing alone is normally not sufficient.

## ADOPTION

Used when independent participants move beyond passive discovery.

The adoption ladder is:

```text
DISCOVERY
    ↓
INTEREST
    ↓
FORK
    ↓
CONTRIBUTION
    ↓
INTEGRATION
    ↓
DEPLOYMENT
    ↓
VERIFIED_ADOPTION
```

Chronicles should normally focus on `CONTRIBUTION` or stronger signals.

---

# How a Chronicle is created

## 1. Observe

Zorgax detects a potentially important event from public sources or authorized project systems.

Possible inputs include:

- GitHub pull requests;
- issues;
- commits;
- public CI/deployment results;
- public upstream notices;
- external articles;
- public repository activity;
- independent integrations;
- adoption signals;
- official LIFE programme developments when relevant.

## 2. Verify

The event must be supported by public evidence appropriate to the claim.

```text
CLAIM
  ↓
PUBLIC SOURCE
  ↓
CROSS-CHECK
  ↓
EVIDENCE LEVEL
```

A Chronicle must never upgrade a weak signal into a stronger claim.

For example:

```text
Fork exists
    ≠
Deployment exists
```

```text
PR merged
    ≠
External payment verified
```

```text
Article published
    ≠
Independent technical validation
```

## 3. Build the narrative

A typical Chronicle contains 4–8 panels plus a cover.

Recommended structure:

```text
1. EVENT
2. EVIDENCE
3. PROBLEM / OPPORTUNITY
4. CONTRIBUTION / RESPONSE
5. VERIFICATION
6. CURRENT STATUS
```

The final scene should clearly state:

```text
VERIFIED
vs
NOT YET VERIFIED
```

---

# Visual production

Zorgax uses two complementary visual engines.

## Canva

Canva is primarily used for:

- branding;
- cover design;
- typography;
- layout;
- infographic composition;
- visual consistency;
- editable design assets.

If an accessible MyZubster Brand Kit exists, it may be used after verification.

## AI-generated images

Image generation can be used for original narrative material such as:

- Zorgax scenes;
- robots;
- abstract digital environments;
- objects;
- fictional settings;
- atmospheric backgrounds;
- illustrative panels.

AI-generated imagery must never be presented as evidence of a real event.

When an AI image could be mistaken for documentary material, the interface should clearly identify it as a narrative illustration.

---

# Evidence vs narrative

Every visual asset should have a provenance classification.

Recommended types:

```text
evidence
official
canva-generated
ai-generated
third-party-public
```

Example `assets/manifest.json` entry:

```json
{
  "file": "panel-03.webp",
  "type": "ai-generated",
  "purpose": "narrative",
  "evidence": false,
  "panel": 3
}
```

Example evidence asset:

```json
{
  "file": "pr-603-evidence.webp",
  "type": "evidence",
  "purpose": "verification",
  "evidence": true,
  "panel": 2
}
```

This distinction is mandatory for Chronicle integrity.

---

# Interactive format

A Chronicle should be a static web application rather than only a PNG or PDF.

Minimum structure:

```text
index.html
styles.css
script.js
README.md
```

Recommended additional files:

```text
story.json
sources.json
assets/manifest.json
assets/
```

The application should work on static hosting without requiring a backend.

Core interactions should include:

- previous/next panel navigation;
- current-panel progress indicator;
- keyboard navigation;
- accessible labels;
- per-panel `Evidence` drawer;
- source links;
- final `Verified / Not yet verified` summary;
- responsive mobile/desktop layout.

Optional features can include:

- timeline mode;
- scene index;
- filtering by event type;
- evidence/source mode;
- reduced-motion support;
- deep links to individual panels.

---

# Evidence drawer

Each relevant scene may expose the evidence behind it.

Example:

```text
PANEL 3 / 6

A contributor proposed a fix.

[ VIEW EVIDENCE ]
```

Evidence view:

```text
Source: GitHub PR #603
Status: OPEN
Tests: 5 reported
Merge: NOT VERIFIED
Evidence level: HIGH for PR existence

[ Open source ]
```

The evidence drawer should explain exactly what the source proves and what it does not prove.

---

# Repository structure

Each episode should live in its own directory.

```text
docs/
└── comic/
    └── zorgax/
        ├── README.md
        └── YYYY-MM-DD-event-slug/
            ├── index.html
            ├── styles.css
            ├── script.js
            ├── story.json
            ├── sources.json
            ├── README.md
            └── assets/
                ├── manifest.json
                ├── cover.webp
                ├── panel-01.webp
                └── ...
```

This keeps episodes portable, versionable and independently reviewable.

---

# GitHub publication workflow

Zorgax must not publish directly to `main` or `master`.

Expected flow:

```text
Chronicle generated
       ↓
branch:
zorgax/chronicle-<date>-<slug>
       ↓
files added
       ↓
checks
       ↓
commit
       ↓
DRAFT PULL REQUEST
       ↓
HUMAN REVIEW
       ↓
merge decision
```

The pull request should document:

- event represented;
- public sources;
- evidence level;
- Chronicle category;
- files created;
- Canva assets;
- AI-generated assets;
- provenance manifest;
- unverified claims intentionally excluded;
- rights/license notes;
- preview instructions.

No automatic merge.

---

# myzubster.com integration

The same Chronicle package should be reusable on MyZubster's public website.

Suggested routes, when compatible with the site's actual architecture:

```text
/chronicle
/chronicle/<slug>
```

or:

```text
/comic/zorgax
/comic/zorgax/<slug>
```

The repository version remains the canonical inspectable source.

Conceptually:

```text
GitHub source
     ↕
Zorgax Chronicle
     ↕
GitHub Pages
     ↕
myzubster.com
```

If the website uses a separate repository, the integration should be proposed through a separate draft PR linked to the Chronicle PR.

No direct production deployment should be required for Chronicle generation.

---

# The feedback loop

The most important idea is that the Chronicle can become part of the GitHub-native metaverse loop itself.

```text
REAL EVENT
   ↓
CHRONICLE
   ↓
READER
   ↓
GITHUB SOURCE
   ↓
ISSUE / CONTRIBUTION
   ↓
NEW VERIFIED EVENT
   ↓
NEW CHRONICLE
```

This creates a public history where participation can generate new world events.

```text
STORY
  ↓
PARTICIPATION
  ↓
CONTRIBUTION
  ↓
EVIDENCE
  ↓
NEW STORY
```

---

# Zorgax's role

Within the Chronicle system, Zorgax can act as:

```text
OBSERVER
   ↓
VERIFIER
   ↓
CLASSIFIER
   ↓
STORY EDITOR
   ↓
VISUAL ORCHESTRATOR
   ↓
ARCHIVIST
```

Zorgax is not the final authority.

Human governance remains part of the publishing process:

```text
ZORGAX
   ↓
DRAFT
   ↓
GITHUB PR
   ↓
HUMAN REVIEW
   ↓
MERGE / REJECT / REVISE
```

---

# Safety and integrity rules

A Chronicle must not:

- expose credentials, keys, secrets or wallet seeds;
- use private logs as public narrative material;
- publish unnecessary personal information;
- infer partnerships from ordinary technical interaction;
- describe a fork as adoption without stronger evidence;
- describe a PR as a completed deployment;
- describe MYZ as external settlement by default;
- describe a merge as proof of payment;
- use AI-generated images as documentary evidence;
- use biometric features to identify people;
- claim unreleased roadmap features as production-ready.

---

# Relationship with MyZubster

Zorgax Chronicle is one component of the broader MyZubster architecture.

See also:

- [`../../MYZUBSTER_METAVERSE.md`](../../MYZUBSTER_METAVERSE.md)
- [`../../ZORGAX_AUTOMATION.md`](../../ZORGAX_AUTOMATION.md)
- [`../../ZORGAX_SYSTEM.md`](../../ZORGAX_SYSTEM.md)

Together they describe the broader model:

```text
GITHUB
  ↓
CONTRIBUTION
  ↓
EVIDENCE
  ↓
ZORGAX
  ↓
CHRONICLE
  ↓
PUBLIC WORLD
  ↓
NEW PARTICIPATION
```

---

# Core principle

> **Tell the story only as strongly as the evidence allows.**

```text
OBSERVE
  ↓
VERIFY
  ↓
VISUALIZE
  ↓
PUBLISH AS DRAFT
  ↓
REVIEW
  ↓
BUILD THE PUBLIC HISTORY
```

**Zorgax Chronicle — the verifiable visual history of MyZubster.**
