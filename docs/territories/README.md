# Project ↔ Territory Graph v1

This directory implements the first machine-readable milestone from issue #1570.

## Purpose

Represent cross-border project relationships as evidence-backed graph edges without inferring nationality, residency, legal partnership, employment, ownership or payment obligations.

Canonical path:

`territory → project → contributor → competence → evidence → project → territory`

## Status rules

- `PROPOSED`: relationship described; bilateral technical participation not yet established.
- `ACTIVE`: both sides opted in and a bounded integration/test plan exists.
- `TESTED`: a frozen version/commit was executed with reproducible evidence and the test administrator/environment recorded.
- `VERIFIED`: stronger independent evidence exists beyond a single bounded test.

A self-report is not sufficient to promote an edge to `VERIFIED`.

## Location/privacy rule

Country/region and any optional city/area must come from explicit participant public opt-in. Never infer location or nationality from a name, email, language, IP address, profile image or username.

## Financial/organizational boundary

A graph edge does not establish:
- payment or bounty entitlement;
- employment;
- legal partnership;
- ownership transfer;
- residency or nationality.

Those remain separate processes/evidence classes.

## Files

- `project-territory-link.v1.schema.json` — canonical JSON Schema.
- `project-territory-link.template.json` — empty safe template.

## First real edge

Do not instantiate a real cross-border edge until both sides have explicitly opted in and there is public evidence supporting the proposed relationship. Link the resulting edge to its GitHub issue/PR/commit/test evidence and Contributor Passport records where applicable.
