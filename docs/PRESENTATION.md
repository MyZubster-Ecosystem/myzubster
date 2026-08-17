# MyZubster — Presentation Brief

## One-line pitch
MyZubster is an auditable civic bounty platform that connects verifiable public-interest work to explicit multi-asset rewards, with Treasury controls and independent payment verification.

## What exists today
- Core MVP for missions, telemetry, dashboard and Gateway integration.
- Bounty lifecycle with explicit payment states.
- Multi-asset bounty model supporting MYZ, XMR and TOKEN reward components.
- Contributor-provided payment recipient model; no silent default wallet.
- Architectural separation between Market, Treasury, Bounty, Settlement/Gateway and Independent Verifier.
- Public bounty catalog covering municipal, utility, environmental, Urban Lab and government-oriented proposals.

## What is deliberately not claimed
- XMR is not presented as production-payable until its Treasury/payment rail is online and independently verified.
- Token payments are not presented as production-payable until the corresponding chain/asset rail and verifier are enabled.
- Public-sector or company bounty proposals do not imply approval, funding, procurement, or partnership by the named organization.
- A merged PR or closed issue is never itself proof of payment.

## Canonical flow

```text
Public problem / proposal
        ↓
Bounty definition
        ↓
Reward: MYZ / XMR / TOKEN
        ↓
Treasury allocation / reservation
        ↓
Contributor wallet capture
        ↓
Payment submission
        ↓
Independent verification
        ↓
CONFIRMED
        ↓
PAID
```

## Demo script
1. Create/open a bounty with an explicit reward asset.
2. Show acceptance criteria and verification requirements.
3. Show the contributor claim and destination-wallet capture.
4. Show Treasury allocation/reservation concept.
5. Show payment lifecycle: `PENDING → SUBMITTED → CONFIRMED → PAID`.
6. Show the verifier boundary: without an independent verifier, payment must fail closed before submission.
7. Show how XMR/TOKEN remain pending until their payment rails are enabled.
8. Show the public bounty catalog as a proposal layer, not as evidence of external sponsorship.

## Readiness gates

### Gate A — presentation-ready
- Architecture and boundaries documented.
- Bounty model supports multi-asset rewards.
- Public proposal catalog is organized.
- Security claims are conservative and explicit.

### Gate B — payment-ready
- Independent verifier configured and tested.
- Treasury accounting/reservation is production-safe and concurrency-safe.
- Real XMR/token adapters are enabled only after verification and reconciliation are validated.
- Full CI is green.
- Deployment configuration is verified.

### Gate C — production-ready
- Secrets/configuration reviewed.
- Monitoring, backup, rollback and incident procedures tested.
- Payment reconciliation and failure/retry behavior tested against the real provider/chain.
- External agreements/funding are documented before activating organizational bounties.

## Recommended presentation message

> MyZubster does not ask an organization to trust a black-box payment promise. It defines a verifiable bounty, reserves funds through a Treasury boundary, pays only to the contributor's declared wallet, and requires independent verification before a bounty can become `PAID`.

The current MVP is suitable for demonstrating this architecture and workflow. Production payment activation remains a separate validation gate.