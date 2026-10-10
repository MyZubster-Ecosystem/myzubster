# MyZubster Ecosystem — Authoritative Execution Map

_Last consolidated: 17 Aug 2026 · Tracks GitHub issue #477_

This document is the single authoritative execution map for the MyZubster
ecosystem. It exists to keep product claims aligned with the actual state of
this repository. Where a claim below is marked **PROPOSED** or **PENDING**,
it must not be presented as shipped, funded, or institutionally adopted.

---

## 1. Product identity

MyZubster is an **open-source software ecosystem in development and
validation**. The ecosystem includes:

- Space Station core
- Gateway
- Marketplace / payment components
- Apps
- Robotics
- Escrow / payment infrastructure
- Telemetry
- Auditability
- Bounty workflows

The **civic / municipal layer** is a *proposed application track* built on
these capabilities. It is **not** evidence of existing institutional
adoption.

---

## 2. Core execution priority

The current technical priority order is:

1. **CI / security stabilization** — #374–#378, #454–#455
2. **Space Station vertical slice** — #382–#393
3. **Pilot core / workflow / auditability** — #372
4. **AI orchestration and controlled automation** — #406
5. **One real pilot with measurable KPIs** — #370, #403
6. **Payment / bounty production gates** — #451–#453 — *before* any real
   multi-asset settlement

---

## 3. Multi-asset bounty model

The ecosystem documents explicit reward choices (reference: #410):

- `MYZ`
- `XMR`
- `TOKEN`
- Combinations of the above assets

### Rules

- **No silent asset conversion.** A bounty is paid in the asset the
  contributor selected.
- The contributor wallet is captured **for the selected asset at settlement**.
- `XMR` may be selected before the XMR rail is live, but such rewards remain
  `XMR_PENDING` until the rail is operational.
- `TOKEN` rewards remain **non-payable** until their chain / asset rail is
  enabled and verified.
- **No `PAID` status without independent verification.**

---

## 4. Treasury and verification gates

- **#452** requires a multi-asset Treasury source-of-truth with reservation,
  concurrency protection, reconciliation, and an audit trail.
- **#453** requires independent verification of recipient, network,
  asset/contract, canonical amount, and transaction status.
- **#451** blocks payment-flow shortcuts until the verifier / security
  boundaries are closed.

> Therefore, bounty **definitions** must not be interpreted as evidence of
> funds already held.

---

## 5. Civic / institutional network

The current **proposed** framework includes:

| Track | Issues |
| --- | --- |
| Comune | #462–#471 |
| Orti San Francesco | #472 |
| Comune → Urban Lab | #473 |
| Comune / Urban Lab / Hera | #474 |
| Comune / Anthea / Urban Lab | #475 |
| Singapore TOKEN track | #476 |
| Urban Lab bounty track | #438–#440 |
| Hera | #426–#429 |
| Anthea | #430–#433 |
| Futura Ambiente Rimini | #434–#437 |
| Government | #441–#450 |
| Universities | #456–#461 |

All institutional issues are **PROPOSED** unless a separate, verifiable
agreement / approval exists.

---

## 6. International / Singapore track

#476 is a **proposed** international token use-case track. It must **not**
imply investment, partnership, regulatory approval, or token reserves in
Singapore. Any real asset claim requires verifiable wallet / contract /
ownership evidence and applicable compliance review.

---

## 7. Robotics

Robotics remains a **development track**, including:

- Poppy Ergo Jr integration — #402
- Urban Lab robotics pilot proposal

Simulated environments should be used before physical deployment, with
safety controls and auditability.

---

## Status legend

- **PROPOSED** — planned track; no verifiable adoption, funds, or approval.
- **PENDING** (`XMR_PENDING`, etc.) — selectable but not yet payable.
- **GATED** — blocked by production/security gates (#451–#453).

> Nothing in this document constitutes evidence of held funds, institutional
> partnership, regulatory approval, or settled payments.
