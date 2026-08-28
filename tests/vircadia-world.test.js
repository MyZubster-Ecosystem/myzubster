'use strict';

const fixtures = require('../fixtures/metaverse/vircadia-world-observations.json');
const {
  getVircadiaWorldAdapter,
  sanitizeMetadata,
  toVircadiaEntityDraft,
} = require('../src/integrations/metaverse/vircadia-world');

describe('Vircadia World adapter', () => {
  test('keeps the integration explicitly experimental and external', () => {
    const adapter = getVircadiaWorldAdapter();

    expect(adapter.id).toBe('vircadia-world');
    expect(adapter.status).toBe('experimental');
    expect(adapter.authMode).toBe('external');
    expect(adapter.partnershipClaim).toBe(false);
    expect(adapter.upstreamValidated).toBe(false);
    expect(adapter.upstreamCommit).toBe(
      '9f185373ac89fb5834fda238fa83f51d1d6851a9',
    );
  });

  test('maps safe public observations into stable entity drafts', () => {
    const drafts = fixtures.map((observation) =>
      toVircadiaEntityDraft(observation, { syncGroup: 'myzubster-vircadia-demo' }),
    );

    expect(drafts).toHaveLength(3);
    expect(drafts[0]).toMatchObject({
      sourceId: 'rimini-place-001',
      entityName: 'myz-rimini-place-001',
      syncGroup: 'myzubster-vircadia-demo',
      display: {
        title: 'Rimini public place demo',
        kind: 'place',
      },
      provenance: {
        source: 'MyZubster',
        public: true,
        verified: false,
      },
    });
  });

  test('rejects non-public observations', () => {
    expect(() =>
      toVircadiaEntityDraft({
        id: 'private-1',
        title: 'Private record',
        kind: 'place',
        public: false,
        position: { x: 0, y: 0, z: 0 },
      }),
    ).toThrow('explicitly public/sanitized');
  });

  test('rejects malformed coordinates', () => {
    expect(() =>
      toVircadiaEntityDraft({
        id: 'bad-position',
        title: 'Bad position',
        kind: 'place',
        public: true,
        position: { x: 0, y: '1', z: 0 },
      }),
    ).toThrow('finite x/y/z');
  });

  test('drops obvious secret-bearing metadata keys', () => {
    expect(
      sanitizeMetadata({
        demo: true,
        token: 'do-not-export',
        password: 'do-not-export',
        secret: 'do-not-export',
      }),
    ).toEqual({ demo: true });
  });
});
