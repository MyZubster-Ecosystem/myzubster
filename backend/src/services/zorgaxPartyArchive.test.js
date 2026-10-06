const {
  archiveCapabilities,
  validateArchiveInput,
  publicArchiveView
} = require('./zorgaxPartyArchive');

describe('ZORGAX Party Archive handoff', () => {
  test('declares replay engine as not modeled while supporting bounded handoff', () => {
    expect(archiveCapabilities()).toMatchObject({
      lifecycle: 'handoff-supported',
      replayEngine: 'not-modeled',
      sourceDependency: 'MYZ-97',
      publicAssetsRequireApproval: true,
      mediaConsentRequired: true,
      liveCapabilitiesExpireOnArchive: true
    });
  });

  test('requires admin role and explicit confirmation', () => {
    expect(validateArchiveInput({
      actorRole: 'user',
      confirmed: true,
      visibility: 'public',
      assets: []
    })).toMatchObject({ valid: false, status: 403 });

    expect(validateArchiveInput({
      actorRole: 'admin',
      confirmed: false,
      visibility: 'public',
      assets: []
    })).toMatchObject({ valid: false, status: 409 });
  });

  test('rejects unsafe/non-http archive asset urls', () => {
    const result = validateArchiveInput({
      actorRole: 'admin',
      confirmed: true,
      visibility: 'public',
      assets: [{
        type: 'replay',
        title: 'Replay',
        url: 'javascript:alert(1)',
        approved: true,
        consentVerified: true
      }]
    });
    expect(result.valid).toBe(false);
  });

  test('public view surfaces only approved and consent-verified assets', () => {
    const view = publicArchiveView({
      archiveId: 'archive-1',
      state: 'archived',
      visibility: 'public',
      communityId: 'myzubster-metaverse',
      eventId: 'event-public-1',
      roomId: 'neon-plaza',
      liveCapabilitiesExpiredAt: new Date(),
      assets: [
        { type: 'replay', title: 'Approved', url: 'https://example.test/replay', approved: true, consentVerified: true },
        { type: 'highlight', title: 'No consent', url: 'https://example.test/no-consent', approved: true, consentVerified: false },
        { type: 'archive', title: 'Not approved', url: 'https://example.test/private', approved: false, consentVerified: true }
      ]
    }, false);

    expect(view.assets).toHaveLength(1);
    expect(view.assets[0].title).toBe('Approved');
    expect(view.replayEngine).toBe('not-modeled');
  });
});
