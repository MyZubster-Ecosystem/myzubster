const request = require('supertest');
const app = require('../index');
const { moderationCapabilities } = require('../services/zorgaxPartyModeration');

describe('ZORGAX Party Mode moderation surface', () => {
  test('publishes bounded moderation capabilities without permanent-ban authority', async () => {
    const response = await request(app)
      .get('/api/zorgax/party-capabilities')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.moderation).toMatchObject({
      autonomousPermanentBan: false,
      blockMuteEnforcement: 'not-yet-enforced',
      spamDetection: 'not-modeled',
      retention: {
        reportsDays: 30,
        auditDays: 30
      }
    });
    expect(response.body.moderation.moderatorActions).toEqual([
      'mark-reviewed',
      'escalate',
      'dismiss'
    ]);
    expect(response.body.moderation.moderatorActions).not.toContain('ban');
  });

  test('requires authentication before accepting a Party Mode report', async () => {
    const response = await request(app)
      .post('/api/zorgax/party-reports')
      .send({
        targetType: 'user',
        targetId: 'public-character-id',
        reason: 'spam',
        details: 'Repeated unsolicited messages'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('requires authentication for moderation summary and actions', async () => {
    await request(app)
      .get('/api/zorgax/party-moderation-summary')
      .expect(401);

    await request(app)
      .post('/api/zorgax/party-moderation-action')
      .send({ reportId: 'report-id', action: 'dismiss' })
      .expect(401);
  });

  test('keeps material enforcement outside the ZORGAX moderation action set', () => {
    const capabilities = moderationCapabilities();
    expect(capabilities.autonomousPermanentBan).toBe(false);
    expect(capabilities.blockMuteEnforcement).toBe('not-yet-enforced');
    expect(capabilities.moderatorActions).toEqual(expect.arrayContaining([
      'mark-reviewed',
      'escalate',
      'dismiss'
    ]));
    expect(capabilities.moderatorActions).not.toEqual(expect.arrayContaining([
      'ban',
      'suspend',
      'mute'
    ]));
  });
});
