# Visual #011 — Gateway System

Evidence-first architecture view for `MyZubster-Ecosystem/MyZubsterGateway`.

## Canonical source

- `https://github.com/MyZubster-Ecosystem/MyZubsterGateway/blob/main/README.md`

## What the visual states

- the Gateway is the backend integration boundary between MyZubster core and external providers;
- documented API areas include health, auth, users, orders, payments, webhooks and registries;
- the repository describes itself as **MVP / active validation**;
- external settlement is deliberately separated from normal application state;
- a safe settlement lifecycle is documented as `PENDING → RESERVED/ACCEPTED → SUBMITTED → CONFIRMED → PAID`;
- independent verification is required before final payment claims.

## Guardrails

- application/database state is not external payment proof;
- a provider response alone cannot establish `PAID`;
- MYZ is described as an internal reward/accounting ledger and is not automatically an on-chain transaction;
- route/workflow existence does not prove production runtime health;
- deployment and settlement claims require separate runtime evidence.

## Provenance

`official-derived / documentation visual`

The HTML is original documentation code derived from the public Gateway README. It is not settlement evidence and does not assert that every described integration is production-ready.