# Zorgax Visual #005 — Public Repository Map

Interactive, static HTML/CSS/JavaScript map of the public repositories currently surfaced for the `MyZubster-Ecosystem` organization.

## Purpose

Make the ecosystem navigable without turning repository existence into a maturity claim.

The map supports:

- text search;
- group filters;
- direct links to public repositories;
- explicit evidence guardrails;
- mobile-first static hosting.

## Public-only scope

The inventory in `repositories.json` intentionally contains only repositories identified as **public** by the connected GitHub inventory on 2026-08-22. Private repository names and metadata are excluded from this public visual package.

## Evidence rules

```text
repository exists != production-ready product
active branch      != validated deployment
issue / PR         != completed mission
merge              != external payment
```

The `role` field is a concise navigation label inferred conservatively from repository naming and canonical ecosystem documentation. It should not be treated as an implementation or maturity guarantee.

## Files

- `index.html` — interactive map shell
- `styles.css` — cyberpunk MyZubster/Zorgax presentation
- `script.js` — search/filter/render logic
- `repositories.json` — public repository inventory

## Preview

Serve the repository statically and open:

`docs/visual/repository-map/index.html`

A static server is preferred because the page loads `repositories.json` with `fetch()`.

## Provenance

Source inventory: connected GitHub repository search for `MyZubster-Ecosystem`, captured 2026-08-22.

Canonical context: `docs/ECOSYSTEM.md`, `docs/MYZUBSTER_METAVERSE.md`, and the MyZubster GitHub Visual Hub.
