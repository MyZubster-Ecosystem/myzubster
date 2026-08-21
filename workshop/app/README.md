# MyZubster Workshop Mini-App v1

This mini-app turns the static workshop prototype into an operational local workflow for service events and technical bounty handoff.

## Scope

The app can:

- create and persist service events locally;
- record diagnostic checks and technician observations;
- associate a service event with a technical bounty;
- create a bounty claim package;
- create a submission package from a completed service event;
- record an explicit local review decision;
- generate a MYZ ledger-entry proposal only after a bounty is VERIFIED;
- export all artifacts as JSON for later ingestion into the canonical Bounty Engine / MYZ Ledger.

The app cannot:

- publish to GitHub by itself;
- claim that a repair is verified without a reviewer decision;
- create a canonical MYZ ledger entry without ingestion into the canonical ledger;
- represent `MYZ_RECORDED` as fiat or blockchain settlement;
- replace a technician or manufacturer service manual.

## Lifecycle

`SERVICE_EVENT -> BOUNTY_CLAIM -> SUBMISSION -> REVIEW -> VERIFIED -> MYZ_LEDGER_PROPOSAL`

The canonical Bounty Engine lifecycle remains:

`OPEN -> CLAIMED -> SUBMITTED -> UNDER_REVIEW -> VERIFIED/REJECTED -> MYZ_RECORDED`

## Running

Open `index.html` in a modern browser. All state is stored in browser `localStorage` under the `myzubster-workshop-miniapp-v1` key.

For a production deployment, replace the local storage adapter with authenticated API endpoints and require signed reviewer actions before ledger ingestion.