# XMR Seller pilot: partial offline quote fixtures

Status: **QUOTE_ONLY — arithmetic fixtures, not verified production settlement**.
This is a bounded contribution to [issue #1667](https://github.com/MyZubster-Ecosystem/myzubster/issues/1667), not completion of that issue or its full offline acceptance checkpoint.

## Implemented here

`calculateAtomicPlatformQuote` in `src/services/freeSellerPolicy.js` is a pure,
additive integer-atomic-unit calculator. It does not call any payment, wallet,
network, database, or order-state code. The existing cents-number
`calculatePlatformCommission` API is unchanged.

```js
const { calculateAtomicPlatformQuote } = require('./src/services/freeSellerPolicy');

calculateAtomicPlatformQuote({
  unitAmountAtomic: '250000000000', // arbitrary test-only 0.25 XMR, 12 decimals
  quantity: 1,
  exchangeType: 'PAID'
});
// {
//   status: 'QUOTE_ONLY',
//   grossAtomic: '250000000000',
//   platformFeeAtomic: '5000000000',
//   sellerNetAtomic: '245000000000',
//   networkCostsAtomic: null,
//   processorCostsAtomic: null
// }
```

This is 0.250000000000 XMR gross, 0.005000000000 XMR disclosed platform fee,
and 0.245000000000 XMR seller net **before network or processor costs**. The
two external-cost fields are separately `null` because costs are unknown, not
assumed zero. The function does not perform decimal-to-atomic conversion or
assert support for any payment rail.

### Input and arithmetic contract

- `unitAmountAtomic` is a non-negative integer. Accepted representations are
  `bigint`, safe integer `number`, or canonical unsigned decimal string (`0` or
  digits starting with 1–9). No decimal fractions, exponents, signs, padding,
  whitespace, unsafe Numbers, or coercible objects are accepted.
- `quantity` has the same representations but must be positive; omitted or
  `undefined` quantity defaults to 1. Zero, negative and fractional quantities
  are rejected. Large values must be passed as strings or BigInts, not Numbers.
- `exchangeType` must explicitly be `PAID`, `FREE`, or `BARTER`. This arithmetic
  classification is not proof of eligibility, agreement, receipt, or payment.
- Gross is `unitAmountAtomic * quantity`. The PAID platform fee is exactly
  `gross * 2 / 100`, calculated on the aggregate amount, not rounded per unit.
- **No rounding direction is chosen.** If the PAID fee is not an integer
  atomic amount, the function throws with `error.code === 'ROUNDING_POLICY_REQUIRED'`.
  Thus 1, 49, and 51 atomic units have no quote; 50 yields fee 1 and net 49;
  two units of 25 also yield gross 50, fee 1, net 49. Zero yields fee zero.
- FREE/BARTER always have fee zero, including amounts that would require
  rounding if PAID. Supplied gross is retained as arithmetic input; these
  results do not authorize billing, imply a monetary barter payment, or turn
  a free account into a paid account. Invalid amounts/quantities still fail.
- All returned amounts are decimal integer strings, safe to serialize as
  JSON without losing precision. Seller net is gross minus platform fee only,
  not an assertion of money the seller actually receives.

### Resource boundary

This offline helper has no application-level digit or quantity-size cap.
Parsing, multiplication and decimal serialization are synchronous; very large
strings or BigInts can consume substantial CPU and memory. Use bounded local
fixtures only. Before any external/untrusted caller is introduced, separately
review and enforce input-length, quantity and output-size budgets at the
caller boundary. Exact arithmetic is not a resource-safety guarantee.

The platform's 2% transaction commission is **not** the separate founder
allocation of 2% of realized ecosystem profit.

## Evidence and remaining work

Run the isolated real-helper fixtures with Node 24:

```sh
node --test test/atomicPlatformQuote.test.mjs
```

The new `.mjs` file is also included in the native-test list executed after
Jest by `npm test`. The tests cover the maintainer's XMR example, zero and tiny
amounts, quantities, integer precision, exclusions, validation, JSON output,
and the existing commission API. They test arithmetic, not mocked transactions.

**Not implemented or verified here:** human seller opt-in, public listing
creation/editing, refund or cancellation allocation, payment-proof validation,
missing/duplicate/replayed transaction evidence handling, platform-fee receipt,
reconciliation, fee collection, or settlement. There is no transaction fixture
presented as a financial transaction or proof that money moved.

Non-integral rounding policy and partial/full refund allocation remain for
maintainer decisions and matching tests. A full checkout with dependencies is
needed for the repository-wide suite and CI; isolated fixture results must not
be described as a full-suite or full-issue pass.

XMR payment execution remains unavailable/test-only under the
[multicurrency specification](../MARKETPLACE-MULTICURRENCY-XMR-BTC-ETH.md), not
enabled by this helper. No caller is wired into checkout, wallet or payment
flows. Verified settlement and actual platform receipt, privacy-safe proof and
replay protection, security/compliance review, consenting operators, and
separate maintainer approval remain prerequisites to any later integration,
merge, deployment, or real transaction. No wallets, secrets or funds are used.
