# LIFE × MyZubster DAO — advisory governance lane

## Purpose

The LIFE governance lane lets future LIFE project participants contribute technical, scientific, MRV, replication and community input to MyZubster governance without confusing that participation with legal project governance.

This lane is **advisory and non-binding by default**.

## Roles

### LIFE Observer
May observe public DAO activity, follow evidence and contribute scoped comments or feedback after explicit opt-in.

### LIFE Advisor
May provide scoped technical/scientific recommendations and participate in advisory discussions after explicit opt-in.

Both roles have:

- binding DAO voting power: **0**;
- treasury authority: **none**;
- payment authority: **none**;
- authority over LIFE budget/co-financing: **none**;
- authority to modify a Grant Agreement or Consortium Agreement: **none**;
- authority to represent an external organization: **none unless separately documented by that organization**.

## Allowed advisory scopes

- pilot technical design;
- KPI / MRV methodology;
- evidence quality;
- data governance;
- replication and transferability;
- community/stakeholder feedback.

## Excluded scopes

The LIFE advisory lane cannot authorize:

- treasury transfers or payment execution;
- LIFE project budget or co-financing commitments;
- Grant Agreement changes;
- Consortium Agreement changes;
- legal commitments or signatures;
- claims of EU funding, endorsement, partnership or consortium membership without separate evidence.

## Consent-first enrollment

A person or organization must not be added to the public LIFE DAO participant registry unless all of the following are satisfied:

1. explicit opt-in to DAO participation;
2. explicit permission for the chosen public display name/organization name;
3. a bounded role and advisory scope are agreed;
4. the consent source/reference is reviewed by a maintainer;
5. the registry change is reviewed as a normal repository change.

A participant can later withdraw; withdrawal must remove the identity from active advisory participation without rewriting historical public evidence.

## Public registry

The registry lives at:

`config/dao/life-participants.json`

It intentionally starts with **no named participants**. Current project counterparties or private correspondence must not be converted into public DAO membership without explicit consent.

## API

- `GET /api/dao/life/status`
- `GET /api/dao/life/policy`
- `GET /api/dao/life/participants`

Registered LIFE Observer/Advisor identities are blocked from binding `/api/dao/vote` and `/api/dao/delegate` operations.

## Governance boundary

The intended model is:

`LIFE legal/project governance → remains with the formal consortium and applicable agreements`

`MyZubster DAO LIFE lane → transparent advisory participation and evidence-backed discussion`

A future decision to grant any LIFE participant binding DAO power would require a separate governance proposal, explicit consent, legal/consortium compatibility review and a code/policy change. It must never happen implicitly through this registry.
