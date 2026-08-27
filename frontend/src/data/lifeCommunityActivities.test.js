import {
  LIFE_COMMUNITY_ACTIVITY_CATEGORIES,
  LIFE_COMMUNITY_ACTIVITY_RULES,
} from './lifeCommunityActivities';

describe('LIFE community activity categories', () => {
  test('include musica e sport', () => {
    const ids = LIFE_COMMUNITY_ACTIVITY_CATEGORIES.map(({ id }) => id);
    expect(ids).toContain('music-performing-arts');
    expect(ids).toContain('sport-movement-outdoor');
  });

  test('use unique, complete category records', () => {
    const ids = LIFE_COMMUNITY_ACTIVITY_CATEGORIES.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);

    LIFE_COMMUNITY_ACTIVITY_CATEGORIES.forEach((category) => {
      expect(category).toEqual(expect.objectContaining({
        id: expect.any(String),
        icon: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        evidence: expect.any(String),
      }));
    });
  });

  test('publish evidence rules with the taxonomy', () => {
    expect(LIFE_COMMUNITY_ACTIVITY_RULES.length).toBeGreaterThanOrEqual(4);
  });
});
