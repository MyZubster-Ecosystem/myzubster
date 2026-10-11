const {
  createBotPassportInput,
  publicBotPassport
} = require('../src/services/botPassportService');

const HASH = 'a'.repeat(64);

describe('bot passport privacy boundary', () => {
  test('rejects secret-bearing input', () => {
    expect(() => createBotPassportInput({
      name: 'Review bot',
      softwareVersion: '1.0.0',
      releaseHash: HASH,
      apiKey: 'must-not-be-stored'
    })).toThrow(/forbidden field/i);
  });

  test('rejects unknown fields rather than silently ignoring them', () => {
    expect(() => createBotPassportInput({
      name: 'Review bot',
      softwareVersion: '1.0.0',
      releaseHash: HASH,
      clientSecret: 'must-not-be-accepted'
    })).toThrow(/unsupported field/i);
  });

  test('projects only explicit public fields', () => {
    const result = publicBotPassport({
      botId: 'bot-1',
      name: 'Review bot',
      softwareVersion: '1.0.0',
      releaseHash: HASH,
      capabilities: ['evidence_import'],
      status: 'ACTIVE',
      ownerId: 'private-owner',
      token: 'private-token',
      revocationReason: 'private-reason'
    });

    expect(result).toEqual({
      botId: 'bot-1',
      name: 'Review bot',
      softwareVersion: '1.0.0',
      releaseHash: HASH,
      capabilities: ['evidence_import'],
      status: 'ACTIVE'
    });
  });

  test('accepts only credential-free HTTPS repository URLs', () => {
    expect(createBotPassportInput({
      name: 'Review bot',
      softwareVersion: '1.0.0',
      releaseHash: HASH,
      repositoryUrl: 'https://github.com/my-org/my-bot'
    }).repositoryUrl).toBe('https://github.com/my-org/my-bot');

    expect(() => createBotPassportInput({
      name: 'Review bot',
      softwareVersion: '1.0.0',
      releaseHash: HASH,
      repositoryUrl: 'https://token@example.com/private'
    })).toThrow(/credential-free HTTPS/i);
  });
});
