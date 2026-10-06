# Demo 1 — Zorgax → Marketplace

This is the shortest public demonstration of the MyZubster value chain for a new user.

## Goal

Understand MyZubster in under five minutes by moving from conversational guidance in Zorgax to one concrete community Marketplace use case.

```text
OPEN MYZUBSTER
      ↓
TALK TO ZORGAX
      ↓
ASK FOR A CONCRETE NEXT STEP
      ↓
OPEN COMMUNITY MARKETPLACE
      ↓
EXPLORE A REAL CIRCULAR-ECONOMY USE CASE
      ↓
CONTRIBUTE / GIVE FEEDBACK / PICK AN ISSUE
```

## 1. Start with Zorgax

Open:

https://www.myzubster.com/zorgax

Try a concrete request such as:

> I am new to MyZubster. Show me one real circular-economy use case I can understand and try now.

Zorgax is an assistance and routing layer. It should explain available public functionality and guide the user toward a next step without inventing adoption, partnerships, payments, identities or measurements.

## 2. Continue to the Community Marketplace

Open the Marketplace from MyZubster and explore the community exchange flow.

A useful canonical example is **kefir culture donation**. The implementation includes a dedicated `kefir_culture_donation` category. This community category is donation-only: paid currencies are intentionally rejected, and the listing flow requires the existing food-safety acknowledgement.

The detailed implementation/evidence boundary is documented here:

- [`docs/marketplace/SEEDS-KEFIR-EXCHANGE.md`](marketplace/SEEDS-KEFIR-EXCHANGE.md)
- [`public/community-marketplace.html`](../public/community-marketplace.html)

## 3. What the demo proves

If the public path is reachable and the user can move from Zorgax guidance to the Marketplace use case, the demo shows that MyZubster can connect:

- a conversational entry point;
- guidance toward a real use case;
- a structured community Marketplace flow;
- documented rules and evidence boundaries;
- a clear next action for the user.

It does **not** by itself prove adoption, commercial demand, partnership, external payment, successful fulfillment or verified real-world impact.

## 4. Contributor CTA

After trying the demo:

1. Star the repository if you want to follow the project.
2. Open an issue if the path is confusing or broken.
3. Pick a `good first issue` / `help wanted` item if you want to contribute.
4. When reporting a problem, include the exact step, expected result and observed result — never credentials, tokens or personal data.

Repository:

https://github.com/MyZubster-Ecosystem/myzubster

Issues:

https://github.com/MyZubster-Ecosystem/myzubster/issues

## 5. Measurement

Where privacy-safe funnel tracking is already available, measure only aggregate transition signals such as:

```text
zorgax_opened
      ↓
marketplace_opened
      ↓
meaningful_marketplace_action
      ↓
issue_or_contribution_started
```

A GitHub clone, page view, button click or API request is not automatically a unique human, successful local run, customer, contributor or completed pilot. Keep those metrics separate.

---

Linear: MYZ-158 — Demo 1: Zorgax + Marketplace end-to-end
