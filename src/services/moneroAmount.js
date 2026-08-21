'use strict';

const ATOMIC_SCALE = 12;

function xmrToAtomicString(value) {
  const text = String(value ?? '').trim();
  const match = text.match(/^([0-9]+)(?:\.([0-9]{1,12}))?$/);
  if (!match) throw new Error('XMR amount must be a non-negative decimal with at most 12 fractional digits');
  const whole = match[1].replace(/^0+(?=\d)/, '') || '0';
  const fraction = (match[2] || '').padEnd(ATOMIC_SCALE, '0');
  const atomic = BigInt(whole) * 10n ** 12n + BigInt(fraction || '0');
  if (atomic <= 0n) throw new Error('XMR amount must be positive');
  return atomic.toString();
}

function xmrToAtomicSafeNumber(value) {
  const atomic = BigInt(xmrToAtomicString(value));
  if (atomic > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('XMR amount exceeds the safe integer range for monero-wallet-rpc JSON transport');
  }
  return Number(atomic);
}

module.exports = { ATOMIC_SCALE, xmrToAtomicSafeNumber, xmrToAtomicString };
