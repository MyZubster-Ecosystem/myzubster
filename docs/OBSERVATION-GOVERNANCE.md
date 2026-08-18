# MyZubster Observation Governance

## Purpose

MyZubster observations connect real-world media, structured metadata, Git history and optional bounty/payment references. The goal is to make observations inspectable and reproducible without publishing wallet secrets or unnecessary private information.

## Canonical flow

Capture or Drive import → VPS staging → validation → classification → public media path → metadata record → Git commit → public archive → optional bounty link → verification.

## Media hierarchy

Use a predictable hierarchy:

`public/media/{city}/{category}/{subject}/{filename}`

Examples:

- `public/media/rimini/sky/clouds/rimini-sky-clouds-001.jpg`
- `public/media/rimini/landmarks/fontana-della-pigna/fontana-della-pigna-001.jpg`
- `public/media/rimini/civic/comune-di-rimini/comune-di-rimini-001.jpg`

Project architecture media must remain separate under `public/media/ecosystem/`.

## Naming rules

Use lowercase kebab-case. Prefer stable subject names and numeric sequence suffixes. Avoid spaces, timestamps as the only identifier, personal secrets, wallet addresses in filenames, and opaque camera names when a descriptive name is available.

## Observation registry

Public observation metadata lives in `data/observations.json`.

Each observation should contain:

- `observation_id`
- `title`
- `description`
- `city`
- `country`
- optional `latitude` and `longitude`
- optional `captured_at`
- `imported_at`
- `media_path`
- `sha256`
- `category`
- `tags`
- `source`
- `status`
- optional `bounty_id`
- optional `monero_txid`
- optional `repository_commit`

Unknown values should be `null`. Do not invent coordinates, capture times, transaction IDs or hashes.

## Integrity

Every published media file should eventually have a SHA-256 digest. The digest proves which exact file version is referenced by an observation record. A changed file must produce a new digest and should be reviewed before the observation remains `VERIFIED`.

## Lifecycle

`STAGED` means the file has arrived but is not yet validated.

`VALIDATED` means filename, file type, basic metadata and destination have been checked.

`PUBLISHED` means the file and observation record are publicly reachable and committed.

`BOUNTY_LINKED` means a real bounty or payment reference has been explicitly associated with the observation.

`VERIFIED` means integrity and provenance checks have been completed, including SHA-256 and relevant repository references.

## Monero and payment safety

The observation registry may store a public transaction reference when there is a real relationship between an observation and a bounty/payment.

Never store any of the following in Git, JSON, public HTML, issue text or photo metadata:

- wallet mnemonic seed
- private spend key
- private view key
- wallet password
- RPC authentication secrets

A transaction must not be linked to a photo merely because timestamps are close. The association should be based on explicit project evidence.

## Privacy

Do not publish exact GPS coordinates when they reveal a private residence, private garden, sensitive personal location or another person’s private information unless publication is intentional and appropriate. Personal photographs should be reviewed before being made public.

## Definition of done for a photo

A new public observation is complete when:

- the media file is valid and opens correctly;
- the filename follows the naming convention;
- the media lives in the correct canonical directory;
- an observation record exists;
- SHA-256 is recorded or explicitly pending;
- the public media URL returns HTTP 200;
- the file is committed to Git;
- no secret material is present;
- any bounty or Monero transaction link is evidence-based and optional.

## Repository responsibilities

- `public/media/` stores public assets.
- `data/observations.json` stores observation records.
- `data/ecosystem.json` stores software ecosystem/dashboard data.
- `public/photos.html` is the photo archive entry point.
- `public/observation.html` renders individual observation records.
- this document defines the governance rules.

## Roadmap

### Phase 1 — Standardize archive

Normalize paths, filenames and categories. Remove misplaced duplicates and calculate SHA-256 digests.

### Phase 2 — Observation registry

Populate `data/observations.json` for existing and new photographs.

### Phase 3 — Observation detail pages

Provide a public detail view for each observation with media, metadata, integrity state and repository references.

### Phase 4 — Bounty and transaction references

Allow explicit associations between observations, MyZubster bounty records and public Monero transaction references without storing wallet secrets.

### Phase 5 — Verification and API

Add validation tooling and an API for observation lookup, integrity checks and status filters.

### Phase 6 — Geographic and timeline explorer

Build map and timeline views over verified observations while respecting privacy rules.
