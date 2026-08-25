const { publicSite } = require('../src/controllers/permacultureController');

describe('permaculture public API contract', () => {
  test('private site projection hides owner, ciphertext and coordinates', () => {
    const result = publicSite({
      siteId: 'site-001',
      ownerId: 'owner-secret-123',
      name: 'Permaculture site',
      location: {
        lat: 44.0637353,
        lng: 12.5678873,
        address: 'Private street 1',
        country: 'IT',
        visibility: 'private'
      },
      privateLocation: { ciphertext: 'encrypted-location' },
      profile: { areaSqm: 500, climateZone: 'mediterranean' },
      aiPlans: [],
      visionAnalyses: [{
        imageSha256: 'a'.repeat(64),
        observations: [{ evidence: 'Private greenhouse beside the house' }]
      }],
      nft: { state: 'none', onChain: false }
    });
    const serialized = JSON.stringify(result);
    expect(result.ownerId).toBeUndefined();
    expect(result.privateLocation).toBeUndefined();
    expect(result.visionAnalyses).toBeUndefined();
    expect(result.location).toEqual({ visibility: 'private', precision: 'hidden', country: 'IT' });
    expect(serialized).not.toContain('44.0637353');
    expect(serialized).not.toContain('Private street 1');
    expect(serialized).not.toContain('Private greenhouse');
  });
});
