# MyZubster Treasury Policy

This document defines the canonical funding and treasury rules for the MyZubster ecosystem.

## 1. Core principle

MyZubster bounties and project obligations are designed to be **ecosystem-funded, not personally funded**.

No founder, maintainer or contributor is personally required to finance MyZubster bounties from salary, savings, employment income, benefits or unrelated private assets.

A private employment relationship, salary or employment benefit remains separate from MyZubster and must not be represented as project treasury, bounty collateral, guaranteed backing or a payment promise unless a separate documented contribution is explicitly made to the project and recorded under this policy.

## 2. Separation of funds

```text
PERSONAL INCOME / SALARY / SAVINGS
            |
            X   no automatic transfer or obligation
            |
            v
      MYZUBSTER TREASURY
```

Project accounting and personal accounting must remain separate.

A personal contribution can become project funding only when all of the following are true:

1. it is voluntary;
2. it is explicitly designated to MyZubster;
3. the amount/asset and purpose are recorded;
4. the applicable governance/accounting process accepts it;
5. it is not presented as recurring or guaranteed unless a binding project-level arrangement actually exists.

## 3. MYZ during the pre-marketplace phase

MYZ is currently an **internal reward/accounting unit**.

A MYZ reward records verified contribution value inside the MyZubster ledger. It does not automatically represent:

- fiat money;
- XMR or another cryptocurrency;
- an on-chain token;
- a debt owed by a founder;
- guaranteed redemption;
- interest or guaranteed yield.

MYZ rewards follow the canonical ledger rules in [`myz/LEDGER.md`](myz/LEDGER.md).

## 4. Ecosystem funding sources

An external bounty or project payment may be declared `FUNDED` only when a real funding source has been reserved and can be audited.

Permitted ecosystem sources may include:

- MyZubster App / Marketplace fees or revenues after those rails are actually live;
- project treasury balances;
- grants and public funding;
- sponsorships;
- donations explicitly made to MyZubster;
- commercial project revenue;
- licensing/service revenue where legally applicable;
- other documented ecosystem income approved under the applicable governance policy.

A source must not be counted before it actually exists.

## 5. Funding states

```text
PROPOSED
  -> APPROVED
  -> RESERVED
  -> FUNDED
  -> COMMITTED
  -> RELEASED / SETTLED
```

Suggested meanings:

- `PROPOSED` — intended allocation only; no funds reserved.
- `APPROVED` — governance/maintainer approval exists; still not necessarily funded.
- `RESERVED` — a specific treasury amount is set aside.
- `FUNDED` — the reserved source is available and verifiable.
- `COMMITTED` — tied to a verified obligation awaiting settlement.
- `RELEASED` — reservation removed/cancelled/reconciled.
- `SETTLED` — external payment completed and independently verified.

`FUNDED` must never be inferred solely from a GitHub issue, label, PR, merge, provider response or historical article.

## 6. Bounty funding rule

The bounty lifecycle remains:

```text
PROPOSED
  -> VALIDATED
  -> APPROVED
  -> FUNDED          # only when external funding is required and actually reserved
  -> ACTIVE
  -> SUBMITTED
  -> UNDER_REVIEW
  -> VERIFIED | REJECTED
  -> REWARD_RECORDED
  -> SETTLEMENT_PENDING | SETTLED/PAID
```

Internal MYZ accounting and external settlement are separate.

A bounty may be active with a proposed MYZ reward while an external payment rail remains unavailable. In that case the issue must not imply that fiat/XMR payment is guaranteed.

## 7. Reservation and overspending controls

Treasury implementations must prevent double allocation and overspending.

At minimum each external reservation should record:

```json
{
  "reservation_id": "TR-000001",
  "source": "ecosystem-treasury",
  "asset": "XMR",
  "amount": "0.10",
  "purpose": "bounty:<id>",
  "status": "RESERVED",
  "created_at": "...",
  "approved_by": ["..."],
  "evidence": []
}
```

The system should preserve append-only history for reserve, release, cancellation, retry, reconciliation and settlement operations.

## 8. App / Marketplace revenue policy

Until App / Marketplace revenue rails are implemented, reviewed and auditable, no marketplace income should be assumed.

When real revenue exists, a separate versioned revenue-allocation policy should define allocation categories such as:

- operating/infrastructure costs;
- ecosystem treasury;
- bounty reserve;
- contributor rewards;
- maintenance and development;
- compliance, accounting and legal costs;
- contingency/reserve funds;
- other approved project purposes.

Any founder/maintainer allocation must be explicit, separately accounted for and legally/tax reviewed where applicable. It is **not** an automatic entitlement created by bounty activity and must not be described as guaranteed interest.

## 9. Grants, sponsorships and donations

Grant, sponsor or donor funds must preserve their restrictions.

Restricted funding may only be used for the purpose for which it was provided. The treasury record should identify the source, restrictions, approved use and remaining balance.

No institutional name, grant or sponsor may be represented as funding MyZubster until there is verifiable documentation supporting that claim.

## 10. External settlement

External settlement is separate from internal accounting:

```text
PENDING
  -> RESERVED / ACCEPTED
  -> SUBMITTED
  -> CONFIRMED
  -> PAID
```

`PAID` requires independent verification appropriate to the payment rail.

For blockchain settlement this may include asset identity, network, amount, destination, transaction identifier and confirmation status.

Never publish private keys, seed phrases, passwords or unnecessary financial/personal data.

## 11. Public transparency

MyZubster should progressively expose sanitized treasury status such as:

- total internal MYZ rewards recorded;
- external funds proposed;
- external funds reserved/funded;
- settlement pending;
- settled/paid amounts;
- released/cancelled reservations;
- funding source categories.

Public reporting must avoid unnecessary personal data and must distinguish accounting records from independently verified payments.

## 12. Governance changes

Treasury rules should be versioned. Material changes to funding sources, allocation rules, conversion/redemption mechanisms or external payment obligations should be documented before they are presented as active.

A future MYZ exchange, redemption or on-chain migration requires its own explicit implementation, governance, legal/compliance review and verifiable settlement layer. No exchange rate is implied by this document.

## Related documents

- [`BOUNTIES.md`](BOUNTIES.md) — canonical bounty lifecycle and settlement rules
- [`myz/LEDGER.md`](myz/LEDGER.md) — MYZ internal accounting model
- [`REWARDS_LEDGER.md`](REWARDS_LEDGER.md) — public reward/settlement status
- [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) — ecosystem architecture and boundaries
