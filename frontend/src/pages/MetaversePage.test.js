import { LANDMARKS, sanitizeVisitedLandmarks } from './MetaversePage';

describe('Neon Plaza mission progress', () => {
  test('keeps only known landmark ids and removes duplicates', () => {
    expect(sanitizeVisitedLandmarks(['identity', 'identity', 'unknown', null, 'marketplace']))
      .toEqual(['identity', 'marketplace']);
  });

  test('accepts every configured landmark', () => {
    const ids = LANDMARKS.map((landmark) => landmark.id);
    expect(sanitizeVisitedLandmarks(ids)).toEqual(ids);
  });

  test('rejects malformed stored progress', () => {
    expect(sanitizeVisitedLandmarks(null)).toEqual([]);
    expect(sanitizeVisitedLandmarks({ identity: true })).toEqual([]);
  });

  test('declares a stable set of server-supported landmark identifiers', () => {
    expect(LANDMARKS.map((landmark) => landmark.id)).toEqual([
      'identity', 'marketplace', 'projects', 'visual', 'zorgax', 'creator'
    ]);
  });
});
