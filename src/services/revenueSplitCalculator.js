'use strict';

const BASIS_POINTS = 10000n;
const DEFAULT_ASSETS = Object.freeze({ EUR: 2, USD: 2, BTC: 8, ETH: 18, XMR: 12, MYZ: 0 });

function amountInMinorUnits(value) {
  if (typeof value === 'bigint' && value >= 0n) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) return BigInt(value);
  throw new TypeError('grossMinorUnits must be a non-negative exact integer');
}

function rateInBasisPoints(value, name) {
  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    throw new RangeError(`${name} must be an integer between 0 and 10000 basis points`);
  }
  return BigInt(value);
}

/** Pure allocation only. This function neither verifies receipts nor makes funds available. */
function calculateRevenueSplit(input, supportedAssets = DEFAULT_ASSETS) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('revenue split input is required');
  }
  const { asset, policyVersion, settlementStatus, platformFeeBps, treasuryFeeShareBps } = input;
  if (!supportedAssets || typeof supportedAssets !== 'object' || Array.isArray(supportedAssets) ||
      typeof asset !== 'string' || !Object.prototype.hasOwnProperty.call(supportedAssets, asset)) {
    throw new TypeError('asset must be an explicitly supported identifier');
  }
  const decimals = supportedAssets[asset];
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 30) {
    throw new RangeError('asset decimals must be an integer between 0 and 30');
  }
  if (typeof policyVersion !== 'string' || !policyVersion.trim()) {
    throw new TypeError('policyVersion is required');
  }
  if (settlementStatus !== 'VERIFIED') {
    throw new TypeError('only already VERIFIED settlements may be allocated');
  }
  const gross = amountInMinorUnits(input.grossMinorUnits);
  const feeRate = rateInBasisPoints(platformFeeBps, 'platformFeeBps');
  const treasuryRate = rateInBasisPoints(treasuryFeeShareBps, 'treasuryFeeShareBps');
  const feeNumerator = gross * feeRate;
  const fee = feeNumerator / BASIS_POINTS;
  const treasuryNumerator = fee * treasuryRate;
  const treasury = treasuryNumerator / BASIS_POINTS;

  // Floor each deduction; keep the indivisible remainder with its source owner.
  // Creator + treasury + project reconcile to gross. Fee is an intermediate subtotal.
  return {
    asset,
    decimals,
    policyVersion,
    grossMinorUnits: gross.toString(),
    creatorMinorUnits: (gross - fee).toString(),
    platformFeeMinorUnits: fee.toString(),
    treasuryAllocationMinorUnits: treasury.toString(),
    projectRevenueMinorUnits: (fee - treasury).toString(),
    platformFeeBps,
    treasuryFeeShareBps,
    rounding: {
      rule: 'FLOOR_DEDUCTIONS_REMAINDER_TO_SOURCE',
      denominator: BASIS_POINTS.toString(),
      platformFeeRemainderNumerator: (feeNumerator % BASIS_POINTS).toString(),
      treasuryRemainderNumerator: (treasuryNumerator % BASIS_POINTS).toString(),
    },
    calculationOnly: true,
    fundsAvailable: false,
  };
}

module.exports = { calculateRevenueSplit, DEFAULT_ASSETS };
