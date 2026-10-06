# MyZubster Economics

## Objective

Turn MyZubster from a technology-rich ecosystem into a measurable marketplace business with recurring revenue, controlled unit economics, and evidence of real adoption.

The immediate commercial priority is the Seller Membership introduced at **€9.90/month**.

## Revenue model

### 1. Seller Membership — current priority

- Price: **€9.90/month per active seller**
- Revenue type: recurring subscription revenue
- Primary KPI: Monthly Recurring Revenue (MRR)
- Secondary KPIs: paid sellers, seller conversion, churn, retention

Formula:

`MRR = active paid sellers × €9.90`

`ARR = MRR × 12`

### 2. Marketplace transaction revenue — future/optional

Potential marketplace take-rate or transaction fee should only be activated after real GMV and seller behavior are measured. Do not optimize transaction monetization before marketplace liquidity exists.

Formula:

`Transaction revenue = GMV × take rate`

### 3. Future revenue layers

Possible later revenue streams include premium seller tools, promoted listings, AI services, enterprise integrations, identity/trust services, and other ecosystem services. These are not part of the base-case economics until validated by paying customers.

## Seller Membership scenarios

| Paid sellers | MRR | ARR |
| ---: | ---: | ---: |
| 10 | €99 | €1,188 |
| 25 | €247.50 | €2,970 |
| 50 | €495 | €5,940 |
| 100 | €990 | €11,880 |
| 250 | €2,475 | €29,700 |
| 500 | €4,950 | €59,400 |
| 1,000 | €9,900 | €118,800 |

These scenarios represent gross subscription revenue before payment fees, taxes, infrastructure, support, acquisition costs, refunds, and other operating expenses.

## Core business KPIs

### Revenue

- Paid sellers
- MRR
- ARR
- New MRR
- Expansion MRR
- Churned MRR
- Net Revenue Retention when expansion products exist

### Marketplace

- Active buyers
- Active sellers
- Listings published
- Orders created
- Completed orders
- Gross Merchandise Value (GMV)
- Buyer-to-order conversion
- Seller activation rate
- Time to first listing
- Time to first order

### Retention

- Seller monthly churn
- Seller 30/60/90-day retention
- Buyer 30/60/90-day retention
- WAU / MAU

## Funnel

The initial seller funnel should be measured as:

`registered user → seller intent → checkout started → payment verified → seller activated → first listing → first order → retained seller`

Every transition should have an analytics event so commercial bottlenecks can be identified quantitatively.

## Seller conversion

Seller conversion should be reported against at least two denominators:

`paid seller conversion = paid sellers / users showing seller intent`

`registered-to-paid seller conversion = paid sellers / eligible registered users`

Do not treat account creation as commercial adoption.

## Churn

Monthly seller churn:

`seller churn = sellers lost during month / sellers active at start of month`

Example sensitivity for 100 paid sellers:

- 2% monthly churn → approximately 2 sellers must be replaced each month just to maintain the seller base.
- 5% monthly churn → approximately 5 sellers must be replaced each month.
- 10% monthly churn → approximately 10 sellers must be replaced each month.

The operating target should initially be evidence-driven rather than assumed. Establish a baseline from the first cohorts, then set a retention target.

## Customer acquisition cost (CAC)

CAC must be measured separately for sellers and buyers.

`Seller CAC = seller acquisition spend / new paid sellers`

For the €9.90/month membership, acquisition should initially favor low-cost founder-led outreach, partnerships, communities, referrals, and narrowly targeted pilots. Paid acquisition should not scale until retention and payback are demonstrated.

## Lifetime value (LTV)

A simple subscription-only approximation is:

`Seller LTV ≈ monthly contribution margin per seller / monthly seller churn`

Use contribution margin rather than gross subscription price once payment processing, infrastructure, support, refunds, and other variable costs are known.

The LTV:CAC ratio must not be presented as validated until both churn and acquisition cost come from real cohorts.

## Break-even

Operational break-even should be calculated from actual monthly fixed costs and contribution margin.

`break-even paid sellers = monthly fixed costs / monthly contribution margin per paid seller`

Example only: if total fixed operating costs were €1,000/month and the contribution margin were €9 per seller/month, break-even would require approximately 112 paid sellers. This is an illustration, not a current MyZubster cost estimate.

## Cost model to instrument

Track at minimum:

- Hosting and compute
- Database and storage
- AI/API usage
- Email/notification infrastructure
- Payment processing fees
- Monitoring and observability
- Support cost
- Refunds/chargebacks
- Legal/compliance costs
- Sales and marketing spend

Costs should be split into fixed and variable components wherever possible.

## Contribution margin

`Contribution margin per seller = net seller revenue - variable cost attributable to that seller`

Track this monthly. Infrastructure efficiency should be evaluated per active user, per paid seller, and per completed order rather than only as a total cloud bill.

## Commercial validation milestones

### P0 — Revenue works end to end

- Real checkout is available.
- Payment success is verified server-side.
- Seller access activates only after verified payment.
- Subscription renewal, expiration, cancellation, and failed-payment states are handled.
- Payment and entitlement changes have an audit trail.
- At least one genuine external seller completes the full paid flow.

### P1 — Economics become measurable

- Seller funnel analytics are live.
- MRR and paid seller count are calculated from authoritative payment/entitlement data.
- Variable infrastructure and payment costs are tracked.
- First seller cohort retention is measured.
- Seller CAC is measured for any acquisition spend.

### P2 — Marketplace validation

- 5–10 sellers participate in one focused vertical pilot.
- Listings and orders are generated by real external users.
- GMV and marketplace conversion are measured.
- Pilot feedback identifies the highest-value workflow to improve.

### P3 — Scale decision

Scale acquisition only when there is evidence that sellers activate, publish listings, transact, and retain at acceptable economics.

## Initial operating scorecard

Review weekly during the pilot:

| Metric | Current | Target / decision rule |
| --- | --- | --- |
| Paid sellers | TBD | First 5, then 10 |
| MRR | TBD | First €49.50, then €99 |
| Seller payment success rate | TBD | Establish baseline; investigate every failure during pilot |
| Paid seller → first listing | TBD | Improve weekly |
| Seller 30-day retention | TBD | Establish first cohort baseline |
| Active buyers | TBD | Grow alongside seller supply |
| Completed orders | TBD | Evidence of marketplace liquidity |
| GMV | TBD | Measure, do not assume |
| Seller CAC | TBD | Keep below validated contribution LTV |
| Monthly variable infrastructure cost | TBD | Track per seller/user/order |

## Decision principles

1. **Revenue before breadth.** Complete the paid seller loop before adding major ecosystem surfaces.
2. **Evidence before projections.** Label forecasts as scenarios; use real cohorts for business claims.
3. **Liquidity before take-rate optimization.** First prove buyers and sellers transact.
4. **Retention before paid growth.** Do not buy growth into an unvalidated retention curve.
5. **One vertical before many.** A focused pilot creates clearer learning than broad undifferentiated launch.
6. **Production reliability is part of economics.** Failed payments, outages, support load, and manual operations directly reduce margin.

## Next implementation priorities

1. Integrate a real subscription checkout for Seller Membership.
2. Verify payment through provider webhooks and make webhook processing idempotent.
3. Persist subscription status and entitlement lifecycle.
4. Handle renewal, cancellation, expiration, and failed payments automatically.
5. Instrument the seller funnel and recurring-revenue KPIs.
6. Harden the Marketplace production path with monitoring, backups, rate limiting, and end-to-end tests.
7. Recruit the first 5–10 sellers in one vertical and record actual conversion, retention, GMV, CAC, and support cost.

---

**Status:** Economics framework established. Financial values other than the €9.90 Seller Membership price and explicitly labeled scenarios must be replaced with observed production data as it becomes available.
