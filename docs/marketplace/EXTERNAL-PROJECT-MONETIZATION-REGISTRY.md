# External Project Monetization Registry

## Scope

This registry records readiness and provenance for independently owned projects.
It is not authority to sell, collect money, retain fees, create payouts, or
represent external work as MyZubster-owned.

## States

`TESTED` or `PARTIAL` → `COMMERCIALIZABLE` → `LISTED` → `PAYMENT_READY` → `REVENUE_ACTIVE`

- `TESTED`: reproducible bounded technical evidence exists.
- `PARTIAL`: some evidence exists but a required checkpoint is incomplete.
- `COMMERCIALIZABLE`: explicit owner opt-in and defined offer/deliverable.
- `LISTED`: approved Marketplace listing.
- `PAYMENT_READY`: eligible paid order, payout request, or payment capability request triggered required payment onboarding.
- `REVENUE_ACTIVE`: verifiable payment and settlement/payout evidence exists.

## Safeguards

1. External projects remain owner-controlled.
2. `COMMERCIALIZABLE` requires explicit commercial opt-in from that owner.
3. A listing must disclose seller, offer, deliverable, price/rule, terms and evidence boundaries.
4. `SELLER_FREE` requires neither card/bank data nor a recurring fee during basic onboarding; the 2% commission target applies only to eligible paid Marketplace transactions and must be disclosed in advance.
5. No state proves employment, endorsement, identity verification, licensing, legal compliance, production deployment or security certification.

## Records

### N4K48 / Nicola — Independent Node / API Integration

| Field | Value |
| --- | --- |
| Project | https://github.com/nicolaususnicola-lgtm/myzubster-mvp |
| Readiness | `TESTED` |
| Evidence merge | `0c00836a96b36d7c64de098dd26d39ac5ddaf98a` |
| Contributor anchor | #1460 — `ee8c15d4b26824b75345c2eebc62ac034058b84a` |
| Owner opt-in / listing / payment / revenue | `NOT_RECORDED` / `NOT_LISTED` / `NOT_PAYMENT_READY` / `NO_REVENUE_EVIDENCE` |

### Shweta-singh24 / MyZubsterGateway — Security / Policy Verification

| Field | Value |
| --- | --- |
| Project | https://github.com/Shweta-singh24/MyZubsterGateway |
| Pinned commit | `82461433e0c5bfee9aa369b4a71e9331261cf803` |
| Readiness | `TESTED` |
| Source PR | #1385 — `CLOSED_UNMERGED` |
| Evidence merge | #1575 — `dc4fb1e3c403f6e554c2402ec9fb4c5dfd93e593` |
| Result | 14/14 policy PASS; 5/5 syntax PASS; 6/6 wiring true |
| Owner opt-in / listing / payment / revenue | `NOT_RECORDED` / `NOT_LISTED` / `NOT_PAYMENT_READY` / `NO_REVENUE_EVIDENCE` |

This is pinned-checkpoint evidence only; it does not prove upstream merge, deployment, legal compliance or certification.

### khongten124 / Open Period Care — Research / Knowledge Integration

| Field | Value |
| --- | --- |
| Project | https://github.com/khongten124/myzubster |
| Pinned commit | `17cf7ca0a941d10e184771e574683785c1dbc8bf` |
| Readiness | `PARTIAL` |
| Completed evidence | Source files verified; Knowledge Card states parsed |
| Blocking checkpoint | Zorgax smoke was ungrounded (`503`); no indexed source matched and no crawl was performed |
| Owner opt-in / listing / payment / revenue | `NOT_RECORDED` / `NOT_LISTED` / `NOT_PAYMENT_READY` / `NO_REVENUE_EVIDENCE` |

This record cannot advance until retrieval completes and the owner opts in.

## Advancement evidence

| Transition | Required evidence |
| --- | --- |
| `TESTED`/`PARTIAL` → `COMMERCIALIZABLE` | Owner opt-in; offer owner, deliverable, scope, price/rule, boundaries and terms |
| `COMMERCIALIZABLE` → `LISTED` | Approved accurate listing |
| `LISTED` → `PAYMENT_READY` | Eligible paid order/payout/payment-capability request; onboarding accepted |
| `PAYMENT_READY` → `REVENUE_ACTIVE` | Verifiable payment and settlement/payout evidence |

## Related policy

- `docs/marketplace/FREE-SELLER-POLICY.md`
- `docs/marketplace/PAYMENTS-ROADMAP.md`
