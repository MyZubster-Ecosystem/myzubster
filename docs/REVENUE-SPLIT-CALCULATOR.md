# Revenue split calculator

`src/services/revenueSplitCalculator.js` implements the calculation-only component requested in [#1463](https://github.com/MyZubster-Ecosystem/myzubster/issues/1463), following the proposed primary-sale scenario in [#1462](https://github.com/MyZubster-Ecosystem/myzubster/issues/1462). It does not mint, transfer, sign, execute payouts, or update treasury/bounty records.

```js
const { calculateRevenueSplit } = require('../src/services/revenueSplitCalculator');

const allocation = calculateRevenueSplit({
  grossMinorUnits: '10000', // EUR 100.00, already settled upstream
  asset: 'EUR',
  platformFeeBps: 1000, // illustrative 10%, not an active commercial policy
  treasuryFeeShareBps: 5000, // illustrative 50% OF THE PLATFORM FEE
  policyVersion: 'illustrative-pilot-v1',
  settlementStatus: 'VERIFIED',
});
```

This yields creator `9000`, platform gross fee `1000`, treasury allocation `500`, and remaining project revenue `500`, all in EUR minor units. The creator receives EUR 90.00; the two parts of the fee are EUR 5.00 each. The platform fee is a subtotal: do not add it again to the three final allocations.

## Exact arithmetic and rounding

- Gross amounts are non-negative integer minor units, supplied as a canonical decimal string, a BigInt, or a safe integer Number. Fractional Numbers, unsafe Numbers, signs, exponent strings, and whitespace are rejected. Convert human decimal amounts to exact minor units before calling; do not multiply a binary floating-point amount inside this calculator.
- Both rates are required integer basis points from 0 through 10000. No commercial fee or treasury share is assumed. Treasury share applies only to the platform fee, so the creator deduction can never exceed gross.
- The platform fee is `floor(gross * platformFeeBps / 10000)`.
- The treasury allocation is `floor(platformFee * treasuryFeeShareBps / 10000)`.
- The creator retains the first-stage indivisible remainder. Remaining project revenue retains the second-stage remainder. Thus `creator + treasury + project == gross` and `treasury + project == platformFee` exactly.
- Returned amounts are decimal strings, including amounts larger than Number's exact range; results can be serialized to JSON. Each rounding remainder is recorded as an exact numerator over the returned denominator `10000`.

For gross `101`, fee `3333` bps, and treasury share `5000` bps: fee is `33`, creator `68`, treasury `16`, and project `17`. The discarded fractions are `6633/10000` and `5000/10000` minor units respectively.

## Asset and settlement boundaries

The default identifier/exponent registry supports EUR (2), USD (2), BTC (8), ETH (18), XMR (12), and internal MYZ (0). A caller may pass an explicit second-argument registry, for example `{ CUSTOM: 6 }`. Identifiers must match an own registry entry, and exponents must be integers from 0 through 30. No conversion rate or equivalence between assets is implied. Chain-specific token identifiers must be explicitly configured; use the registered identifier consistently.

`settlementStatus: 'VERIFIED'` is an input contract for an upstream verifier, **not verification performed by this function**. Failed, pending, missing, and other statuses are rejected. Never set this input from an untrusted client's claim of payment. This component cannot establish a real receipt, creator consent, rights, commercial terms, or settlement finality.

Even for an upstream-verified receipt, the result always says `calculationOnly: true` and `fundsAvailable: false`. It is not an available balance, a reservation, or a FUNDED/PAID bounty transition. A separate audited ledger/treasury process must verify and record allocations according to [TREASURY.md](../TREASURY.md) and [BOUNTIES.md](../BOUNTIES.md). Input fields requesting available funds or paid states are not propagated.

## Tests

```sh
npm test -- --runInBand tests/revenueSplitCalculator.test.js
```

The Jest suite checks the illustrative split, zero fee, zero treasury share, zero gross, fractional remainders, invalid amount/rate/asset/policy inputs, failed/unverified receipts, immutable inputs, JSON-safe large values, and exact reconciliation across 288 combinations of amounts and rates. Existing payment and treasury services are untouched.

Local verification used Node 24.19.0 and the repository Jest configuration: 61 tests passed across the calculator, existing unit-economics, and payment-lifecycle suites. Due to an interrupted full npm installation and four unavailable non-Windows Hardhat packages, the test runner used an external scratch environment containing exact Jest/Babel versions and dependencies from the repository lockfile. No repository dependency/configuration was changed. Full repository CI remains to be verified.
