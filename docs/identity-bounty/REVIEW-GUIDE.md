# Identity Genesis Bounty — Human Review Guide

The reviewer is deciding whether a submission satisfies the **MyZubster Identity Genesis Bounty**, not whether the participant has proven a government/legal identity.

## Approve when

A submission should normally be approved when all of the following are true:

1. The public display name or pseudonym is usable and not obviously abusive or deceptive.
2. The character has a valid name and supported archetype.
3. The bio and visual reference, if present, are public-safe.
4. The participant accepted every required checklist item.
5. The submission does not contain passwords, tokens, seed phrases, private keys, identity documents, or other sensitive material.
6. The submission does not claim that MyZubster has verified legal identity when it has not.
7. There is no obvious impersonation, spam, automated duplication, or bounty abuse.

## Request changes when

Use `changes_requested` when the submission can reasonably be fixed, for example:

- an unclear or inappropriate character name;
- a bio that exposes unnecessary personal information;
- an invalid or unsafe public visual reference;
- wording that incorrectly presents an unverified MYZ-ID as verified;
- incomplete public profile information.

Give concise notes that explain exactly what must change.

## Reject when

Use `rejected` when the submission is clearly abusive or unsuitable, including:

- deliberate impersonation;
- repeated spam or duplicate-account abuse;
- attempts to submit private secrets or identity documents after warning;
- malicious links or payloads;
- fraudulent claims about verification;
- content that cannot be made compliant through ordinary edits.

## Reviewer authentication

Reviewer routes require:

```text
X-MyZ-Review-Token: <configured review token>
```

The server must have:

```bash
IDENTITY_BOUNTY_REVIEW_TOKEN=<secret>
```

Optionally identify the reviewer with:

```text
X-MyZ-Reviewer: reviewer-name-or-internal-id
```

Do not place the review token in source code, Git history, screenshots, logs, issue comments, or public documentation.

## Reward semantics

An approval transitions the submission to:

```text
reward_recorded
```

and creates an internal reference such as:

```text
MYZ-IDB-...
```

This means an internal MYZ reward/accounting record was created by the prototype. It does **not** mean an XMR transfer, external token payment, bank payment, or guaranteed monetary value.

## Future production controls

Before a high-volume public reward program, add:

- authenticated MyZubster accounts;
- role-based reviewer authorization;
- audit log of review changes;
- moderator block/report workflow;
- account-level rate limits;
- duplicate and Sybil-abuse controls;
- integration with the canonical MYZ ledger/service;
- cryptographic challenge/signature for verified identity states;
- appeal and revocation procedures.
