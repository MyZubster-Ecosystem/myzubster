import test from 'node:test';
import assert from 'node:assert/strict';
import policy from '../src/services/freeSellerPolicy.js';

const quote = (input) => policy.calculateAtomicPlatformQuote(input);

test('quotes 0.25 XMR with an exact 2% fee before external costs', () => {
  const result = quote({
    unitAmountAtomic: '250000000000',
    exchangeType: 'PAID'
  });
  assert.deepEqual(result, {
    status: 'QUOTE_ONLY',
    grossAtomic: '250000000000',
    platformFeeAtomic: '5000000000',
    sellerNetAtomic: '245000000000',
    networkCostsAtomic: null,
    processorCostsAtomic: null
  });
});

test('applies the fee to the aggregate quantity, not to rounded unit fees', () => {
  assert.deepEqual(quote({ unitAmountAtomic: '25', quantity: '2', exchangeType: 'PAID' }), {
    status: 'QUOTE_ONLY',
    grossAtomic: '50',
    platformFeeAtomic: '1',
    sellerNetAtomic: '49',
    networkCostsAtomic: null,
    processorCostsAtomic: null
  });
});

test('multiplies multiple XMR units without mixing up per-unit and total fees', () => {
  assert.deepEqual(quote({ unitAmountAtomic: 250000000000n, quantity: 3, exchangeType: 'PAID' }), {
    status: 'QUOTE_ONLY',
    grossAtomic: '750000000000',
    platformFeeAtomic: '15000000000',
    sellerNetAtomic: '735000000000',
    networkCostsAtomic: null,
    processorCostsAtomic: null
  });
});

test('preserves exact values above the safe Number range', () => {
  assert.deepEqual(quote({ unitAmountAtomic: '9007199254741000', quantity: 3n, exchangeType: 'PAID' }), {
    status: 'QUOTE_ONLY',
    grossAtomic: '27021597764223000',
    platformFeeAtomic: '540431955284460',
    sellerNetAtomic: '26481165808938540',
    networkCostsAtomic: null,
    processorCostsAtomic: null
  });
});

test('preserves a quantity supplied as an integer string above the safe Number range', () => {
  const result = quote({ unitAmountAtomic: 50n, quantity: '9007199254740993', exchangeType: 'PAID' });
  assert.equal(result.grossAtomic, '450359962737049650');
  assert.equal(result.platformFeeAtomic, '9007199254740993');
  assert.equal(result.sellerNetAtomic, '441352763482308657');
});

test('accepts safe integer Numbers without accepting fractional atomic amounts', () => {
  const result = quote({ unitAmountAtomic: 100, quantity: 2, exchangeType: 'PAID' });
  assert.equal(result.grossAtomic, '200');
  assert.equal(result.platformFeeAtomic, '4');
  assert.equal(result.sellerNetAtomic, '196');
});

test('quotes zero without inventing a minimum commission or external cost', () => {
  assert.deepEqual(quote({ unitAmountAtomic: '0', exchangeType: 'PAID' }), {
    status: 'QUOTE_ONLY',
    grossAtomic: '0',
    platformFeeAtomic: '0',
    sellerNetAtomic: '0',
    networkCostsAtomic: null,
    processorCostsAtomic: null
  });
});

test('refuses non-integral fees instead of silently rounding up or down', () => {
  for (const amount of ['1', '49', '51', '99', '9007199254740993']) {
    assert.throws(
      () => quote({ unitAmountAtomic: amount, exchangeType: 'PAID' }),
      { code: 'ROUNDING_POLICY_REQUIRED' },
      `amount ${amount}`
    );
  }
  assert.throws(
    () => quote({ unitAmountAtomic: '25', quantity: 3, exchangeType: 'PAID' }),
    { code: 'ROUNDING_POLICY_REQUIRED' }
  );
});

for (const exchangeType of ['FREE', 'BARTER']) {
  test(`${exchangeType} has no fee even when a paid fee would require rounding`, () => {
    assert.deepEqual(quote({ unitAmountAtomic: '1', quantity: 3, exchangeType }), {
      status: 'QUOTE_ONLY',
      grossAtomic: '3',
      platformFeeAtomic: '0',
      sellerNetAtomic: '3',
      networkCostsAtomic: null,
      processorCostsAtomic: null
    });
  });
}

test('rejects malformed, negative, fractional and unsafe numeric amounts without coercion', () => {
  const invalid = [
    undefined, null, true, false, '', ' ', ' 50', '50 ', '+50', '-0', '-50',
    '050', '50.0', '0.5', '5e1', '0x32', '0b110010', '50\n', '５0',
    -1, -1n, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1,
    {}, [], [50], { toString: () => '50' }, Object(50)
  ];
  for (const unitAmountAtomic of invalid) {
    assert.throws(() => quote({ unitAmountAtomic, exchangeType: 'PAID' }), TypeError);
  }
});

test('requires a positive integer quantity, also for free and barter quotes', () => {
  const invalid = [
    0, 0n, '0', -1, -1n, '-1', 0.5, '1.5', null, true, '', ' ', '+1',
    '01', '1e0', '0x1', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, {}, [], [1]
  ];
  for (const exchangeType of ['PAID', 'FREE', 'BARTER']) {
    for (const quantity of invalid) {
      assert.throws(() => quote({ unitAmountAtomic: '50', quantity, exchangeType }), TypeError);
    }
  }
});

test('validates amounts for exempt exchanges instead of silently ignoring invalid inputs', () => {
  for (const exchangeType of ['FREE', 'BARTER']) {
    assert.throws(() => quote({ unitAmountAtomic: '-1', exchangeType }), TypeError);
    assert.throws(() => quote({ unitAmountAtomic: Number.MAX_SAFE_INTEGER + 1, exchangeType }), TypeError);
  }
});

test('requires an explicit recognized exchange type instead of defaulting to paid or free', () => {
  for (const exchangeType of [undefined, null, '', 'paid', 'FREE ', 'OTHER', 0, true, {}, ['FREE']]) {
    assert.throws(() => quote({ unitAmountAtomic: '50', exchangeType }), TypeError);
  }
});

test('rejects missing or malformed quote input', () => {
  for (const input of [undefined, null, 0, '50', true, []]) {
    assert.throws(() => quote(input), TypeError);
  }
});

test('returns serializable quote data without mutating caller inputs', () => {
  const input = Object.freeze({ unitAmountAtomic: 50n, quantity: 2n, exchangeType: 'PAID' });
  const result = quote(input);
  assert.deepEqual(result, {
    status: 'QUOTE_ONLY',
    grossAtomic: '100',
    platformFeeAtomic: '2',
    sellerNetAtomic: '98',
    networkCostsAtomic: null,
    processorCostsAtomic: null
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  assert.equal(input.unitAmountAtomic, 50n);
  assert.equal(input.quantity, 2n);
});

test('preserves the existing cents-number commission API', () => {
  assert.equal(policy.calculatePlatformCommission(100), 2);
  assert.equal(policy.calculatePlatformCommission(9.9), 0.2);
  assert.equal(policy.calculatePlatformCommission(0), 0);
  assert.equal(policy.calculatePlatformCommission('9.9'), 0.2);
  assert.throws(() => policy.calculatePlatformCommission(-1), TypeError);
  assert.throws(() => policy.calculatePlatformCommission(Infinity), TypeError);
});
