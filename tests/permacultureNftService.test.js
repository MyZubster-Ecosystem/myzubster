const {
  buildPermacultureNftMetadata,
  simulatePermacultureNft
} = require('../src/services/permacultureNftService');

const site = {
  siteId: 'site-privacy-001',
  name: 'Private garden at Private street 1',
  ownerId: 'owner-secret-123',
  siteType: 'urban',
  profile: {
    areaSqm: 843,
    climateZone: 'mediterranean',
    soilTexture: 'loam',
    goals: ['biodiversity', 'food_production']
  },
  location: {
    lat: 44.0637353,
    lng: 12.5678873,
    address: 'Private street 1',
    city: 'Rimini',
    country: 'IT',
    visibility: 'public'
  },
  privateLocation: {
    ciphertext: 'encrypted-exact-location',
    authTag: 'authentication-tag'
  },
  aiPlans: [{
    schemaVersion: 'permaculture-plan-v1',
    inputCommitment: 'a'.repeat(64),
    zones: [{ zone: 1, purpose: 'Daily care', elements: ['herbs'], rationale: 'Frequent visits' }],
    waterStrategy: ['Rainwater'],
    soilStrategy: ['Mulch'],
    biodiversityStrategy: ['Flowers'],
    risks: ['Human review']
  }]
};

describe('permaculture NFT safety', () => {
  test('metadata contains commitments but no exact location or owner', () => {
    const result = buildPermacultureNftMetadata(site);
    const serialized = JSON.stringify(result.metadata);
    expect(result.metadataHash).toMatch(/^[a-f0-9]{64}$/);
    expect(serialized).not.toContain('owner-secret-123');
    expect(serialized).not.toContain('Private street 1');
    expect(serialized).not.toContain('44.0637353');
    expect(serialized).not.toContain('12.5678873');
    expect(result.metadata.properties.location.commitment).toMatch(/^[a-f0-9]{64}$/);
    expect(result.metadata.properties.commitments.design).toMatch(/^[a-f0-9]{64}$/);
  });

  test('simulation is explicit and never claims an on-chain mint', () => {
    const simulation = simulatePermacultureNft('b'.repeat(64), { mode: 'simulation' });
    expect(simulation).toMatchObject({ state: 'simulated', onChain: false, metadataHash: 'b'.repeat(64) });
    expect(simulation.transactionHash).toBeNull();
  });

  test('NFT runtime fails closed by default', () => {
    expect(() => simulatePermacultureNft('b'.repeat(64), { mode: 'disabled' }))
      .toThrow('On-chain NFT runtime is not configured');
  });
});
