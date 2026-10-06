'use strict';

const {
  canonicalPayload,
  canonicalJson,
  sha256
} = require('../scripts/verify-handover-commitment');

const nicola = {
  handoverId: '6aab8faca70ce84f926d0b41',
  listingId: '6aa9ee1b821964be0b43ff6e',
  method: 'HAND_DELIVERY',
  state: 'RECORDED',
  handedOverAt: '2026-09-17T07:28:24.874Z',
  receivedAt: '2026-09-17T07:45:03.261Z',
  recordedAt: '2026-09-17T07:46:09.606Z'
};

describe('handover commitment verifier', () => {
  test('reproduces the confirmed Nicola v1 commitment', () => {
    const commitment = sha256(canonicalJson(canonicalPayload(nicola)));
    expect(commitment).toBe('ba9973f08ce86d16a3611c3cccbb9cc2cc779b9ea1cb6fd87a2e5864e557b6b9');
  });

  test('changes the commitment when committed evidence changes', () => {
    const original = sha256(canonicalJson(canonicalPayload(nicola)));
    const changed = sha256(canonicalJson(canonicalPayload({ ...nicola, state: 'RECEIVED' })));
    expect(changed).not.toBe(original);
  });
});
