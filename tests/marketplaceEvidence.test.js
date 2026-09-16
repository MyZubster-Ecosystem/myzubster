const { buildMarketplaceEvidence, hashMarketplaceEvidence, verifyMarketplaceEvidence } = require('../src/services/marketplaceEvidenceService');

describe('Marketplace immutable evidence', () => {
  const order = {
    _id: '66aa00000000000000000001',
    listingId: '66aa00000000000000000002',
    buyerId: '66aa00000000000000000003',
    sellerId: '66aa00000000000000000004',
    quantity: 1,
    status: 'COMPLETED',
    snapshot: { title: 'Circular item', price: 9.9, currency: 'EUR', exchangeMode: 'sale' },
    acceptedAt: new Date('2026-09-16T08:00:00.000Z'),
    completedAt: new Date('2026-09-16T08:30:00.000Z'),
    createdAt: new Date('2026-09-16T07:30:00.000Z')
  };

  test('produces a deterministic SHA-256 evidence hash', () => {
    const payload = buildMarketplaceEvidence(order);
    const first = hashMarketplaceEvidence(payload);
    const second = hashMarketplaceEvidence(JSON.parse(JSON.stringify(payload)));
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
    expect(verifyMarketplaceEvidence(payload, first)).toBe(true);
  });

  test('detects a modified Marketplace record', () => {
    const payload = buildMarketplaceEvidence(order);
    const hash = hashMarketplaceEvidence(payload);
    const modified = { ...payload, quantity: 2 };
    expect(verifyMarketplaceEvidence(modified, hash)).toBe(false);
  });
});
