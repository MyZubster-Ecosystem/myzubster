'use strict';

const { calculateRevenueSplit, DEFAULT_ASSETS } = require('../src/services/revenueSplitCalculator');

const baseline = Object.freeze({
  grossMinorUnits: '10000', asset: 'EUR', platformFeeBps: 1000,
  treasuryFeeShareBps: 5000, policyVersion: 'illustrative-pilot-v1', settlementStatus: 'VERIFIED',
});
const split = (changes = {}, assets) => calculateRevenueSplit({ ...baseline, ...changes }, assets);

describe('revenue split calculator', () => {
  test('allocates the illustrative EUR 100 sale without double-counting the fee', () => {
    const result = split();
    expect(result.creatorMinorUnits).toBe('9000');
    expect(result.platformFeeMinorUnits).toBe('1000');
    expect(result.treasuryAllocationMinorUnits).toBe('500');
    expect(result.projectRevenueMinorUnits).toBe('500');
    expect(result.policyVersion).toBe(baseline.policyVersion);
    expect(result.decimals).toBe(2);
  });

  test('zero fee leaves all proceeds with the creator', () => {
    const result = split({ platformFeeBps: 0 });
    expect(result.creatorMinorUnits).toBe('10000');
    expect(result.platformFeeMinorUnits).toBe('0');
    expect(result.treasuryAllocationMinorUnits).toBe('0');
    expect(result.projectRevenueMinorUnits).toBe('0');
  });

  test('zero treasury share leaves the full fee as project revenue', () => {
    const result = split({ treasuryFeeShareBps: 0 });
    expect(result.treasuryAllocationMinorUnits).toBe('0');
    expect(result.projectRevenueMinorUnits).toBe('1000');
  });

  test('floors each stage and exposes its exact fractional remainder', () => {
    const result = split({ grossMinorUnits: '101', platformFeeBps: 3333, treasuryFeeShareBps: 5000 });
    expect(result.creatorMinorUnits).toBe('68');
    expect(result.platformFeeMinorUnits).toBe('33');
    expect(result.treasuryAllocationMinorUnits).toBe('16');
    expect(result.projectRevenueMinorUnits).toBe('17');
    expect(result.rounding).toEqual({ rule: 'FLOOR_DEDUCTIONS_REMAINDER_TO_SOURCE',
      denominator: '10000', platformFeeRemainderNumerator: '6633', treasuryRemainderNumerator: '5000' });
  });

  test('zero-value sale produces zero allocations', () => {
    const result = split({ grossMinorUnits: 0 });
    for (const key of ['creatorMinorUnits', 'platformFeeMinorUnits', 'treasuryAllocationMinorUnits', 'projectRevenueMinorUnits']) {
      expect(result[key]).toBe('0');
    }
  });

  test('EUR 100.50 at 5% fee and 10% of the fee uses cent precision', () => {
    const result = split({ grossMinorUnits: '10050', platformFeeBps: 500, treasuryFeeShareBps: 1000 });
    expect(result.creatorMinorUnits).toBe('9548');
    expect(result.platformFeeMinorUnits).toBe('502');
    expect(result.treasuryAllocationMinorUnits).toBe('50');
    expect(result.projectRevenueMinorUnits).toBe('452');
  });

  test.each(['-1', '-0', '', '01', '1.5', '1e5', ' 1', -1, -1n, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, null, undefined, true, {}])(
    'rejects inexact or negative gross amount %p', (grossMinorUnits) => {
      expect(() => split({ grossMinorUnits })).toThrow(/exact integer/);
    });

  test.each(['platformFeeBps', 'treasuryFeeShareBps'])('validates the entire basis-point range for %s', (name) => {
    for (const value of [-1, 10001, 0.5, NaN, Infinity, '1000', undefined, null]) {
      expect(() => split({ [name]: value })).toThrow(/basis points/);
    }
    expect(() => split({ [name]: 10000 })).not.toThrow();
  });

  test.each([undefined, '', 'DOGE', '__proto__', 'toString', 'eur', null])('rejects missing/unsupported asset %p', (asset) => {
    expect(() => split({ asset })).toThrow(/supported identifier/);
  });

  test('supports a caller-defined asset without assuming an exchange rate', () => {
    expect(split({ asset: 'CUSTOM' }, { CUSTOM: 6 }).decimals).toBe(6);
    for (const decimals of [-1, 31, 1.5, '2', null]) {
      expect(() => split({ asset: 'CUSTOM' }, { CUSTOM: decimals })).toThrow(/decimals/);
    }
  });

  test.each(['FAILED', 'PENDING', 'UNVERIFIED', 'PAID', '', undefined, null])('does not allocate an unverified settlement %p', (settlementStatus) => {
    expect(() => split({ settlementStatus })).toThrow(/VERIFIED/);
  });

  test('a calculation can never advertise treasury funding or payment', () => {
    const result = split({ fundsAvailable: true, bountyStatus: 'FUNDED', paid: true });
    expect(result.calculationOnly).toBe(true);
    expect(result.fundsAvailable).toBe(false);
    expect(result).not.toHaveProperty('bountyStatus');
    expect(result).not.toHaveProperty('paid');
  });

  test('does not mutate its input or the configured asset registry', () => {
    const assets = Object.freeze({ EUR: 2 });
    split({}, assets);
    expect(calculateRevenueSplit(baseline, assets)).toEqual(split({}, assets));
    expect(DEFAULT_ASSETS.EUR).toBe(2);
  });

  test.each([null, undefined, [], 'input'])('requires an input object %p', (input) => {
    expect(() => calculateRevenueSplit(input)).toThrow(/input/);
  });

  test.each(['', ' ', undefined, 1])('requires a non-empty policy version %p', (policyVersion) => {
    expect(() => split({ policyVersion })).toThrow(/policyVersion/);
  });

  test('reconciles exact allocations for small, boundary, and very large values', () => {
    const amounts = [0n, 1n, 2n, 99n, 101n, 10000n, BigInt(Number.MAX_SAFE_INTEGER), 10n ** 40n + 37n];
    const rates = [0, 1, 3333, 5000, 9999, 10000];
    for (const gross of amounts) for (const platformFeeBps of rates) for (const treasuryFeeShareBps of rates) {
      const result = split({ grossMinorUnits: gross, platformFeeBps, treasuryFeeShareBps });
      const creator = BigInt(result.creatorMinorUnits);
      const treasury = BigInt(result.treasuryAllocationMinorUnits);
      const project = BigInt(result.projectRevenueMinorUnits);
      expect(creator + treasury + project).toBe(gross);
      expect(treasury + project).toBe(BigInt(result.platformFeeMinorUnits));
      expect(creator >= 0n && treasury >= 0n && project >= 0n).toBe(true);
      expect(BigInt(result.platformFeeMinorUnits) * 10000n <= gross * BigInt(platformFeeBps)).toBe(true);
      expect(treasury * 10000n <= BigInt(result.platformFeeMinorUnits) * BigInt(treasuryFeeShareBps)).toBe(true);
      expect(() => JSON.stringify(result)).not.toThrow();
    }
  });
});
