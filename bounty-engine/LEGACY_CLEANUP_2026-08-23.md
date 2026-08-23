# Legacy bounty cleanup — 2026-08-23

This audit note records the first cleanup pass that aligns legacy MyZubster bounty/reward issues with the canonical ecosystem-funded model in `BOUNTIES.md` and `TREASURY.md`.

## Canonical classifications

- `MYZ` — internal MyZubster reward/accounting unit.
- `EXTERNAL_UNFUNDED` — an external XMR/fiat/token amount may be historically/provisionally stated, but no verified ecosystem treasury reservation is linked.
- `FUNDED` — only when an auditable ecosystem funding reservation exists. This cleanup pass does not classify any legacy XMR issue as FUNDED without such evidence.
- `HISTORICAL` — legacy table/test/product-design reference that must not be treated as a current payout promise.
- `FREE` — community contribution with no external reward committed.

## Updated in this pass

| Repository | Issue | Classification | Legacy external reference |
|---|---:|---|---:|
| MyZubster-Robot | #31 | MYZ | previous 0.12 XMR reference retained as unfunded history; 2,500 MYZ internal reward |
| MyZubsterGateway | #144 | EXTERNAL_UNFUNDED | 0.08 XMR |
| MyZubsterGateway | #215 | EXTERNAL_UNFUNDED / TEST | 0.05 XMR |
| MyZubster-Photos | #3 | EXTERNAL_UNFUNDED | 0.50 XMR proposed target |
| myzubster | #489 | MYZ primary / EXTERNAL_UNFUNDED by default | removed automatic MYZ↔XMR equivalent rule |
| myzubster | #490 | MYZ primary / ecosystem-funded governance | removed automatic conversion/payout assumptions |
| MyZubsterGateway | #57 | EXTERNAL_UNFUNDED | 0.06 XMR |
| MyZubsterGateway | #58 | EXTERNAL_UNFUNDED | 0.003 XMR |
| MyZubster-Robot | #93 | EXTERNAL_UNFUNDED | 0.10 XMR |
| MyZubster-App | #18 | EXTERNAL_UNFUNDED | 0.003 XMR |
| MyZubster-App | #19 | EXTERNAL_UNFUNDED | 0.003 XMR |
| myzubster | #182 | EXTERNAL_UNFUNDED | 0.06 XMR |
| myzubster | #216 | HISTORICAL | 0.001/0.002 XMR table references |
| myzubster | #63 | EXTERNAL_UNFUNDED | 0.08 XMR |
| myzubster | #530 | funding clarification | personal income removed as assumed bounty source |

## Rules applied

1. No personal salary, savings, employment income or unrelated private assets are treated as default project treasury.
2. No legacy XMR amount is automatically converted into MYZ.
3. No MYZ amount is automatically converted into XMR.
4. External settlement may become `FUNDED` only after a real MyZubster ecosystem funding source is reserved and recorded.
5. `PAID` requires independently verified settlement evidence.
6. Issue assignment, PR, merge, closure or internal MYZ ledger entry is not proof of external payment.
7. Historical amounts are preserved as history where useful, but are explicitly labeled so external indexers/contributors do not interpret them as guaranteed payouts.

## Already aligned / no destructive rewrite needed

Many newer civic, university, government, pilot and robotics issues already state that MYZ/XMR/TOKEN rewards require verified funding or are only proposed. These should continue to inherit the canonical `BOUNTIES.md` and `TREASURY.md` rules.

## Follow-up

Future cleanup passes should prioritize any open issue that:

- contains a numeric XMR/fiat/token reward without `funding_state`;
- says `paid`, `payout`, `equivalent`, or `convert` without verifiable settlement/funding evidence;
- asks contributors to provide wallets before settlement is actually needed;
- uses labels/descriptions that imply an external bounty is funded when the issue body says otherwise;
- depends on a personal/founder payment promise.

The source of truth remains:

- `BOUNTIES.md`
- `TREASURY.md`
- `myz/LEDGER.md`
