const {
  detectImageMime,
  resolveOllamaUrl,
  validateVisionOutput,
  analyzePermacultureImage
} = require('../src/services/permacultureVisionService');

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const site = {
  siteId: 'site-private-vision-001',
  name: 'Secret garden at Private street 1',
  ownerId: 'owner-secret-123',
  siteType: 'urban',
  profile: {
    areaSqm: 320,
    climateZone: 'mediterranean',
    soilTexture: 'loam',
    slope: 'gentle',
    waterSources: ['rainwater'],
    goals: ['food_production', 'biodiversity'],
    constraints: ['water_scarcity']
  },
  location: {
    lat: 44.0637353,
    lng: 12.5678873,
    address: 'Private street 1'
  }
};

function modelOutput() {
  return {
    observations: [{
      category: 'soil',
      label: 'Copertura organica',
      evidence: 'Una copertura vegetale secca è visibile tra le colture.',
      confidence: 0.88
    }],
    permacultureSignals: [{
      principle: 'no_waste',
      evidence: 'Residui vegetali sembrano riutilizzati come pacciamatura.',
      confidence: 0.74
    }],
    missingEvidence: ['Non è visibile il percorso dell’acqua durante la pioggia.'],
    recommendations: [{
      priority: 'high',
      action: 'Osservare infiltrazione e ristagni durante la prossima pioggia.',
      reason: 'Una singola foto non mostra il comportamento idrico nel tempo.',
      confidence: 0.93,
      timeframe: 'observe_first'
    }],
    cautions: ['Verificare sul posto prima di modificare drenaggio o pendenze.'],
    overallAssessment: {
      classification: 'partial_signals',
      confidence: 0.78,
      explanation: 'Sono visibili alcune pratiche compatibili, ma il sistema completo non è osservabile.'
    }
  };
}

describe('permaculture photo analysis', () => {
  test('detects supported image signatures and rejects mismatches', () => {
    expect(detectImageMime(jpeg)).toBe('image/jpeg');
    expect(detectImageMime(Buffer.from('not-an-image'))).toBeNull();
  });

  test('sends image bytes and only privacy-safe planning context to local Ollama', async () => {
    const fetchImpl = jest.fn(async (_url, request) => ({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: JSON.stringify(modelOutput()) } }),
      request
    }));
    const result = await analyzePermacultureImage(jpeg, 'image/jpeg', site, {
      fetchImpl,
      ollamaUrl: 'http://127.0.0.1:11434',
      model: 'qwen2.5vl:3b',
      now: new Date('2026-08-25T00:00:00.000Z')
    });

    const request = fetchImpl.mock.calls[0][1];
    const payload = JSON.parse(request.body);
    const serializedText = payload.messages.map(message => message.content).join(' ');
    expect(payload.messages[1].images).toEqual([jpeg.toString('base64')]);
    expect(serializedText).not.toContain('owner-secret-123');
    expect(serializedText).not.toContain('Private street 1');
    expect(serializedText).not.toContain('44.0637353');
    expect(serializedText).not.toContain('12.5678873');
    expect(result.imageSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.overallAssessment.classification).toBe('partial_signals');
    expect(result.humanReviewRequired).toBe(true);
  });

  test('blocks remote image endpoints unless explicitly opted in', () => {
    expect(() => resolveOllamaUrl({ ollamaUrl: 'https://vision.example.org' }))
      .toThrow('restricted to a local Ollama endpoint');
    expect(resolveOllamaUrl({ ollamaUrl: 'https://vision.example.org/', allowRemote: true }))
      .toBe('https://vision.example.org');
  });

  test('rejects location hallucinations before persistence', () => {
    const unsafe = modelOutput();
    unsafe.observations[0].evidence = 'Coordinate GPS: 44.0637353, 12.5678873';
    expect(() => validateVisionOutput(unsafe, {
      model: 'test-model',
      imageSha256: 'a'.repeat(64),
      mimeType: 'image/jpeg'
    })).toThrow('sensitive location or identity data');
  });
});
