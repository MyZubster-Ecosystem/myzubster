const {
  buildPlanningContext,
  generatePermaculturePlan,
  rejectLocationLikeOutput
} = require('../src/services/permacultureAiService');

const site = {
  name: 'Private home garden',
  ownerId: 'owner-secret-123',
  siteType: 'urban',
  location: {
    lat: 44.0637353,
    lng: 12.5678873,
    address: 'Private street 1',
    city: 'Rimini',
    country: 'IT'
  },
  privateLocation: { ciphertext: 'encrypted-location' },
  profile: {
    areaSqm: 800,
    climateZone: 'mediterranean',
    soilTexture: 'clay',
    slope: 'gentle',
    waterSources: ['rainwater'],
    goals: ['food_production', 'biodiversity'],
    constraints: ['water_scarcity']
  }
};

describe('permaculture AI privacy contract', () => {
  test('planning context excludes identity and exact geolocation', () => {
    const context = buildPlanningContext(site);
    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain('owner-secret-123');
    expect(serialized).not.toContain('Private street 1');
    expect(serialized).not.toContain('44.0637353');
    expect(serialized).not.toContain('12.5678873');
    expect(context).toMatchObject({
      siteType: 'urban',
      sizeBand: 'medium',
      climateZone: 'mediterranean'
    });
  });

  test('rules mode creates a human-reviewable design', async () => {
    const now = new Date('2026-08-25T00:00:00.000Z');
    const plan = await generatePermaculturePlan(site, { mode: 'rules', now });
    expect(plan.provider).toBe('rules');
    expect(plan.humanReviewRequired).toBe(true);
    expect(plan.inputCommitment).toMatch(/^[a-f0-9]{64}$/);
    expect(plan.zones.some(zone => zone.zone === 5)).toBe(true);
    expect(plan.waterStrategy.join(' ')).toMatch(/acqua|pioggia/i);
  });

  test('Ollama receives only the privacy-safe structured context', async () => {
    let outboundBody;
    const fetchImpl = jest.fn(async (_url, options) => {
      outboundBody = options.body;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          message: {
            content: JSON.stringify({
              summary: 'Piano preliminare per sito urbano.',
              zones: [{
                zone: 1,
                purpose: 'Colture ad alta frequenza',
                elements: ['aromatiche', 'compost'],
                rationale: 'Riduce gli spostamenti quotidiani.'
              }],
              waterStrategy: ['Raccogliere acqua piovana.'],
              soilStrategy: ['Proteggere il suolo con pacciamatura.'],
              biodiversityStrategy: ['Inserire fioriture stagionali.'],
              risks: ['Richiede sopralluogo umano.']
            })
          }
        })
      };
    });

    const plan = await generatePermaculturePlan(site, {
      mode: 'ollama',
      fetchImpl,
      now: new Date('2026-08-25T00:00:00.000Z')
    });

    expect(plan.provider).toBe('ollama');
    expect(outboundBody).not.toContain('owner-secret-123');
    expect(outboundBody).not.toContain('Private street 1');
    expect(outboundBody).not.toContain('44.0637353');
    expect(outboundBody).not.toContain('12.5678873');
  });

  test('rejects location-like text invented by a model', () => {
    expect(() => rejectLocationLikeOutput({ summary: 'Coordinate: 44.0637353, 12.5678873' }))
      .toThrow('location-like output');
  });
});
