# MyZubster Bounty System

Status: Operational specification
Date: 2026-08-23

This directory defines the operational bounty workflow for MyZubster. MYZ is the internal reward/accounting unit used for verified contributions under the adopted policies in `docs/MYZ_ADS_BOUNTY.md`.

## Core lifecycle

`OPEN -> CLAIMED -> SUBMITTED -> UNDER_REVIEW -> APPROVED | REJECTED -> RECORDED`

No MYZ is awarded from a claim alone. A bounty is rewarded only after evidence is submitted and reviewed.

## Bounty record

Each bounty lives as a YAML file under `bounties/open/` and should contain:

```yaml
id: MYZ-BOUNTY-001
title: Example bounty
status: open
category: marketing
created_at: 2026-08-23
owner: MyZubster
reward:
  amount: 10
  unit: MYZ
objective: Describe the verifiable outcome.
deliverables:
  - Public artifact or contribution
evidence_required:
  - Public URL or artifact reference
  - Screenshot or analytics when relevant
acceptance_criteria:
  - Deliverable exists and matches the brief
  - Evidence is reviewable
  - No prohibited manipulation or duplicate claim
verifier: maintainer-review
```

## Categories

Bounties may cover marketing, documentation, development, testing, design, environmental/community evidence, research, translation, outreach or other reviewed contribution types.

A bounty must not promise capabilities, partnerships, financial value or outcomes that are not supported by current evidence.

## Claiming

A contributor claims a bounty by opening a GitHub issue or pull request referencing the bounty ID. A claim should identify the contributor and planned deliverable. Claiming reserves work only when the bounty owner explicitly acknowledges the claim.

## Submission

A submission must include:

- bounty ID;
- contributor identifier;
- artifact, PR, commit or public URL;
- completion date;
- required evidence;
- disclosure of relevant AI-generated or concept material;
- requested MYZ amount when the bounty allows a range.

Do not commit credentials, private keys, wallet seeds, unnecessary personal information or private lead/contact data as evidence.

## Verification

The verifier checks:

1. the bounty was open/eligible when the work was performed;
2. deliverables satisfy the acceptance criteria;
3. evidence is authentic and sufficient;
4. the same evidence has not already been rewarded unless stacking is explicitly allowed;
5. traffic/engagement is not known or suspected to be artificial;
6. concept material is not represented as operational evidence;
7. the final MYZ amount follows the active bounty terms.

## Reward record

After approval, create or append a sanitized record under `bounties/ledger/` containing at minimum:

```yaml
bounty_id: MYZ-BOUNTY-001
contributor: github-user
status: approved
approved_at: 2026-08-23
reward:
  amount: 10
  unit: MYZ
evidence:
  - https://example.org/public-proof
verifier: maintainer-review
notes: Deliverable accepted.
```

The ledger records an internal MYZ reward decision. It is not evidence of fiat payment, cash redemption, market price or investment return.

## Anti-abuse

Reject or revoke rewards for fabricated evidence, bots/click farms, purchased engagement, duplicate submissions, spam, impersonation, invented metrics, misleading claims, secret leakage or other material violations of the bounty terms.

## Changes

Bounty terms may be changed prospectively before work is accepted. Changes should not retroactively reduce an already approved reward except in cases of fraud, duplication or material evidence error.

## Related policies

- `docs/MYZ_ADS_BOUNTY.md` — adopted advertising/marketing reward policy.
- `docs/marketing/README.md` — marketing campaign workflow.
