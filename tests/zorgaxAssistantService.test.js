const { previewData, digestPreview, dataIntent, inferCategory } = require('../src/services/zorgaxAssistantService');

describe('Zorgax general assistant data contract', () => {
  test('detects explicit data-entry intent without writing anything', () => {
    expect(dataIntent('salva umidità terreno 42%')).toBe(true);
    expect(dataIntent('qual è il meteo?')).toBe(false);
  });

  test('creates a deterministic confirmation digest', () => {
    const result = previewData('umidità terreno 42%');
    expect(result.persistent_write_performed).toBe(false);
    expect(result.confirmation).toBe(`CONFERMA ${result.digest.slice(0, 8)}`);
    expect(digestPreview(result.preview)).toBe(result.digest);
  });

  test('classifies common MyZubster data domains', () => {
    expect(inferCategory('temperatura e umidità del suolo')).toBe('environment');
    expect(inferCategory('robot con sensore e motore')).toBe('robotics');
    expect(inferCategory('competenza saldatura')).toBe('skills');
  });
});
