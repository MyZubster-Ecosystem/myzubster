# Zorgax Character Onboarding Automation

Zorgax can automatically propose an optional MyZubster character when a contributor publicly enters the contribution flow through a `CLAIM` comment or a pull request.

## Goal

Turn contributor activity into an opt-in GitHub-native character workflow without treating a GitHub account as legal identity and without registering a character without consent.

## Flow

```text
CLAIM or PR
   ↓
Zorgax posts CHARACTER DRAFT
   ↓
Contributor chooses
   ├─ ACCEPT CHARACTER
   ├─ SKIP CHARACTER
   └─ no response
   ↓
Only ACCEPT CHARACTER
   ↓
Character Registry #617
   ↓
status: PROPOSED
   ↓
optional customization PR / visual / lore
   ↓
review + evidence
```

## What is generated

The first draft uses only public GitHub contribution data:

- GitHub alias;
- source issue or PR;
- contribution title as a provisional role;
- `PROPOSED` status;
- explicit provenance link.

It does not infer a legal name, location, employer, private identity, payment status or external affiliation.

## Consent rule

A character is never registered from a CLAIM or PR alone.

The contributor must reply exactly:

```text
ACCEPT CHARACTER
```

The automation then posts a proposal to Character Registry issue #617 and records the source comment that provided consent.

A contributor may instead write `SKIP CHARACTER` or simply ignore the proposal.

## Evidence boundary

```text
GitHub alias          != legal identity
CLAIM                 != completed work
PR opened             != accepted contribution
Character PROPOSED    != verified contributor
PR merged             != payment
Visual character      != real-world evidence
Registry entry        != employment or partnership
```

Status upgrades must remain evidence-bounded and reviewed.

## Security model

The workflow uses GitHub-hosted `actions/github-script` and does not check out or execute contributor code. The `pull_request_target` trigger is used only to post metadata-derived comments. No PR-controlled script or repository content is executed with write permissions.

Permissions are limited to:

- `contents: read`;
- `issues: write`;
- `pull-requests: write`.

## Workflow file

`.github/workflows/zorgax-character-onboarding.yml`

## Canonical registry

https://github.com/MyZubster-Ecosystem/myzubster/issues/617

## Principle

> **Zorgax may propose a character automatically. Only the contributor may opt in to becoming one.**
