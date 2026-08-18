# MyZubster Bounty System

This is the canonical bounty contract for the MyZubster ecosystem. Repository-specific `BOUNTIES.md` files may narrow scope, but they must not weaken the verification, privacy or settlement requirements in this document.

## 1. Core principle

A bounty represents **verifiable work**, not an automatic payment promise.

A GitHub issue, assignment, pull request, merge, application reward record or maintainer approval is not by itself proof that an external payment occurred.

MyZubster separates:

1. work definition;
2. evidence submission;
3. review/verification;
4. reward accounting;
5. external settlement, when applicable.

## 2. Canonical work lifecycle

```text
PROPOSED
  -> VALIDATED
  -> APPROVED
  -> FUNDED          # only when a funding reservation is required
  -> ACTIVE
  -> SUBMITTED
  -> UNDER_REVIEW
  -> VERIFIED | REJECTED
  -> REWARD_RECORDED
  -> SETTLEMENT_PENDING | SETTLED/PAID
```

Repositories may expose friendlier labels such as `available`, `claimed` or `in progress`, but the underlying gates above remain authoritative.

## 3. Bounty definition

Every bounty should identify, where applicable:

- stable bounty/issue identifier;
- title and objective;
- category/repository;
- deliverable;
- acceptance criteria;
- evidence requirements;
- reward amount and asset/accounting unit;
- funding state/source when an external asset is promised;
- maximum winners or completion count;
- deadline/expiry;
- review mode and reviewer requirements;
- privacy/sensitivity classification;
- safety restrictions;
- settlement requirements.

For photo/evidence bounties the platform model can additionally express:

- minimum number of photos;
- caption requirement;
- original-file requirement;
- public/authorized-area requirement;
- prohibition on restricted areas;
- prohibition on sensitive details;
- consent/privacy rules;
- geolocation requirements and allowed precision.

## 4. Evidence and IPFS

When appropriate, public evidence can be content-addressed on IPFS.

A typical evidence record may contain:

```json
{
  "photoId": "...",
  "sha256": "...",
  "cid": "bafy...",
  "metadataCid": "bafy...",
  "bountyId": "..."
}
```

A CID proves the identity of content retrieved under that CID; it does not prove that the contribution satisfies a bounty. Review remains a separate step.

Public IPFS metadata must be sanitized. Never publish credentials, private user identifiers, local filesystem paths, confidential research, restricted-access information or unnecessary personal data.

## 5. Review

### Normal work

A single authorized review may be sufficient when the bounty explicitly uses normal/manual review.

### High-sensitivity work

High-sensitivity bounties require manual review and narrowly scoped evidence. Multiple-reviewer approval may be introduced for specific bounty types, but it must not be claimed as active unless the backend actually enforces distinct reviewer thresholds.

A reviewer must evaluate the evidence against the bounty's acceptance criteria, not merely the existence of a submission.

## 6. MYZ rewards

**Current truth:** MYZ in the core MyZubster platform is an internal reward/accounting ledger.

An approved MYZ reward can be represented as a platform credit such as:

```text
rewardType: photo_bounty
amount: 500
currency: MYZ
status: approved
```

This is not automatically an on-chain transaction and must not be described as one without independent chain evidence.

Public reward snapshots may be published to IPFS with user identities removed.

## 7. XMR and blockchain-token rewards

A bounty may declare an intended XMR or token component, including combinations with MYZ. This records the intended reward structure; it does not prove that the required treasury/payment rail is live or funded.

No silent conversion is allowed between assets.

For a blockchain-token component, identify at minimum:

- chain/network;
- contract/asset identifier when applicable;
- canonical/base-unit amount;
- destination address supplied for that settlement attempt;
- transaction ID/hash after submission;
- confirmation/status requirements.

For XMR or any other external rail, unavailable or unverified settlement remains `PENDING`, `UNSETTLED` or `FAILED` rather than being presented as `PAID`.

Never publish private keys, wallet seeds or wallet passwords.

## 8. Settlement lifecycle

External settlement is a separate state machine:

```text
PENDING
  -> RESERVED / ACCEPTED
  -> SUBMITTED
  -> CONFIRMED
  -> PAID
```

Failure/reconciliation states may include:

```text
FAILED
UNSETTLED
DISPUTED
CANCELLED
```

`PAID` requires independent verification appropriate to the payment rail.

At minimum, the verifier should check where applicable:

- expected recipient;
- asset identity;
- chain/network;
- token contract;
- canonical amount;
- transaction ID/hash;
- transaction status and required confirmations.

An adapter/provider response alone must not promote a payout to `PAID`.

## 9. Treasury and funding

For external assets, funding and settlement are separate:

```text
Funding source / treasury
        |
        v
reservation / allocation
        |
        v
bounty execution + verification
        |
        v
payment submission
        |
        v
independent verification
        |
        v
PAID
```

A reservation is not a payment. A submitted transaction is not a confirmed payment.

Treasury implementations must prevent duplicate/overspent allocations and preserve an auditable history of reservation, release, retry, cancellation and reconciliation.

## 10. Security bounty rules

Security work requires explicit authorization and responsible disclosure.

Not allowed by a normal bounty:

- destructive testing or denial of service;
- credential theft or persistence;
- testing third-party systems without authorization;
- unnecessary access/exfiltration of user data;
- public disclosure of an unpatched sensitive vulnerability.

Use the designated private reporting process for sensitive security findings.

## 11. Physical-world and photo bounty safety

A bounty must never reward or require:

- trespassing;
- entry into restricted laboratories, industrial or critical-infrastructure areas;
- bypassing barriers/access controls;
- photographing security systems or sensitive operational details;
- precise location disclosure where it creates a safety/security risk;
- confidential university/research material;
- weapons, explosives or hazardous-device construction;
- unsafe intervention on utilities, machinery or infrastructure.

Public/authorized observation from safe locations is the default.

## 12. Contributor workflow

```text
1. Read the issue and acceptance criteria.
2. Confirm the issue is active and unblocked.
3. Implement/collect only the authorized deliverable.
4. Submit the required evidence or PR.
5. Wait for review and required checks.
6. If verified, the reward is recorded according to the bounty definition.
7. Any external settlement proceeds through its own verification lifecycle.
```

Contributors should not post wallet secrets. A public destination address, when actually required for settlement, is not a substitute for payment verification.

## 13. Repository integration

Every first-party repository should contain a lightweight `BOUNTIES.md` that:

- states what work can be bountied in that repository;
- links back to this canonical document;
- points contributors to the repository's GitHub issues;
- states that issue/PR/merge does not prove payment;
- preserves the current MYZ/internal-ledger distinction.

## 14. Issue template

A good bounty issue follows this structure:

```markdown
# Bounty — <title>

## Objective
<What must be achieved?>

## Scope / deliverable
- ...

## Acceptance criteria
- [ ] ...

## Evidence
- tests / screenshots / CID / benchmark / report / PR

## Reward
- Asset/accounting unit: MYZ / XMR / TOKEN / none
- Amount: ...
- Funding state: PROPOSED / APPROVED / FUNDED

## Review
- Mode: normal / manual / multi-review (only if actually enforced)

## Safety & privacy
- No secrets or unnecessary personal data
- No unauthorized access or restricted-area collection

## Settlement
Merge or acceptance does not by itself prove external payment. `PAID` requires the applicable verified settlement evidence.
```

## Related architecture

See [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) for the repository map, IPFS layer and settlement/verifier boundaries.
