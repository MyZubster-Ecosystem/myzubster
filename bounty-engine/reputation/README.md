# MyZubster Contributor Reputation v1

This layer derives contributor reputation from verifiable bounty activity. It does not assign reputation from self-declared profiles, social status, identity documents, token holdings or unverified claims.

## Principle

Reputation is evidence-derived and program-agnostic. Identity, comics and future bounty programs feed the same model.

A contributor profile may reference a GitHub login, MyZubster identifier or other public project identifier, but private personal data is not required.

## Reputation events

Only auditable workflow events count:

- `CLAIM_ACCEPTED` — a valid bounty claim was recorded;
- `SUBMISSION_ACCEPTED_FOR_REVIEW` — a reproducible submission entered review;
- `BOUNTY_VERIFIED` — a contribution was verified against acceptance criteria;
- `MYZ_RECORDED` — the verified reward was appended to the canonical MYZ ledger;
- `BOUNTY_REJECTED` — a submission was rejected;
- `SECURITY_DISCLOSURE_VALID` — an authorized security report was verified;
- `REVISION_COMPLETED` — a requested revision was successfully completed.

A GitHub star, follower count, wallet balance, tattoo/photo, identity assertion, PR opened or issue comment does not by itself create reputation.

## Public metrics

For each contributor the public registry can expose:

- claimed bounties;
- submitted bounties;
- verified bounties;
- rejected bounties;
- MYZ recorded from verified work;
- verified categories/programs;
- first/last verified contribution timestamps;
- evidence references.

## Score

`reputation.mjs` computes a simple transparent score from events. The score is a project coordination heuristic, not a financial, legal, employment or identity rating.

Default weights:

- claim accepted: +1
- submission accepted for review: +2
- verified bounty: +10
- MYZ recorded: +3
- valid security disclosure: +15
- revision completed: +4
- rejected bounty: -2

The raw event history remains more important than the aggregate score. Consumers should be able to recompute it locally.

## Anti-gaming rules

- No reputation can be minted by editing only `contributors.json`.
- Every scored event must include an evidence/source reference.
- Duplicate events for the same bounty and event type are rejected unless explicitly versioned.
- MYZ amount is reported separately; large MYZ rewards do not automatically multiply reputation.
- Maintainer/admin actions should not be scored as contributor work unless they satisfy a published bounty.

## Privacy

Use public/project identifiers only. Do not publish legal identity documents, private email addresses, phone numbers, government identifiers, private wallet keys, home addresses or unnecessary personal data in the reputation registry.