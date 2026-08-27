# External Contributor Traction

Status: `EARLY_EXTERNAL_CONTRIBUTION`

This document defines the canonical, evidence-first funnel used to track whether MyZubster is developing repeatable open-source contributor traction.

## Funnel

`DISCOVERED -> CLAIMED -> PR_OPENED -> REVIEWED -> CHANGES_ADDRESSED -> APPROVED -> MERGED -> MYZ_VERIFIED -> MYZ_RECORDED -> RETURNING_CONTRIBUTOR`

These states are deliberately separate. A comment, claim, pull request, merge, internal MYZ accounting record, and external settlement are not interchangeable evidence.

## Core metrics

Track at least:

- unique external contributors;
- contributors with an explicit task/bounty claim;
- external PRs opened;
- external PRs reaching substantive review;
- external PRs merged;
- contributors who return with a second meaningful contribution;
- verified MYZ rewards;
- MYZ rewards actually recorded in the canonical internal ledger;
- median time from PR open to first substantive review;
- median time from requested changes to contributor response.

## Evidence rules

Count a contributor only from public GitHub evidence. Do not infer legal identity, employer, affiliation, location, payment status, or partnership from a username.

`MERGED` proves code/docs entered the repository history. It does not prove adoption, production deployment, funding, MYZ recording, fiat settlement, or on-chain settlement.

`MYZ_VERIFIED` means the contribution and stated reward eligibility have passed the applicable review criteria.

`MYZ_RECORDED` requires the canonical internal reward ledger/registry to contain the corresponding record. It still does not prove external payment.

## Current evidence-backed examples

### @Aming9303

- ID-BNT-0003 / Issue #566: contribution implemented through PR #602.
- PR #602 underwent substantive security/cryptographic review, changes were addressed, final review was approved, and the PR was merged.
- The associated 2,500 MYZ bounty can be treated as contribution-verified, while registry/ledger bookkeeping must be separately updated before claiming `MYZ_RECORDED`.
- PR #635 demonstrates a subsequent contribution cycle, including requested changes, a targeted lockfile fix, passing CI/security checks, and re-review approval.

This is evidence of a **returning external contributor**.

### @abylyn-xx02

- Publicly opted into a contributor alias on Gateway Issue #1380.
- Publicly stated that work is in progress and a PR will be submitted.

Current state: `CLAIMED / WORK_IN_PROGRESS`; do not count as `PR_OPENED` or `MERGED` until corresponding public evidence exists.

## Traction thresholds

Use conservative language:

- `EARLY_EXTERNAL_CONTRIBUTION`: at least one external contribution reaches merge or equivalent accepted state.
- `REPEATABLE_EXTERNAL_CONTRIBUTION`: at least three distinct external contributors complete accepted contributions and at least one contributor returns.
- `EARLY_COMMUNITY_TRACTION`: repeatable contribution persists across multiple weeks with multiple returning contributors and no single contributor dominates all external activity.
- `COMMUNITY_TRACTION`: sustained multi-contributor flow with measurable review throughput, repeat contribution, and contributor-originated tasks/integrations.

These labels are internal maturity descriptions, not claims of market adoption.

## Review priority

Concrete external contributor work should receive high review priority. Fast review does not mean relaxed review. Security, provenance, evidence, legal boundary, and reward-state checks remain mandatory.

## Reporting cadence

A recurring contributor report should surface only meaningful state changes such as:

- a new external contributor appears;
- a claim becomes a PR;
- a PR receives substantive review;
- requested changes are addressed;
- an external PR is approved or merged;
- a contributor returns with another contribution;
- MYZ state changes from verified to recorded;
- a material inconsistency appears between issue/PR state and registry/ledger state.

No notification is needed when none of these states changes.
