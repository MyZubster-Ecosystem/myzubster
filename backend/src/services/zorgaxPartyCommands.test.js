const {
  publicAllowlist,
  validateCommandRequest
} = require('./zorgaxPartyCommands');

describe('ZORGAX Party Mode capability gateway', () => {
  test('publishes an explicit bounded allowlist', () => {
    expect(publicAllowlist()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        command: 'request_session_status',
        confirmationRequired: false,
        mutates: false
      }),
      expect.objectContaining({
        command: 'publish_notice',
        confirmationRequired: true,
        mutates: true,
        minimumRole: 'admin'
      })
    ]));
  });

  test('rejects commands outside the allowlist', () => {
    for (const command of [
      'send_money',
      'share_secret_location',
      'command_robot',
      'run_arbitrary_tool'
    ]) {
      const result = validateCommandRequest({
        command,
        actorUserId: 'user-1',
        actorRole: 'admin',
        confirmed: true,
        idempotencyKey: 'key-1',
        payload: {}
      });
      expect(result.valid).toBe(false);
      expect(result.status).toBe(400);
    }
  });

  test('requires server-authenticated actor and sufficient role', () => {
    expect(validateCommandRequest({
      command: 'request_session_status',
      actorUserId: null,
      actorRole: 'user',
      idempotencyKey: 'key-1'
    })).toMatchObject({ valid: false, status: 401 });

    expect(validateCommandRequest({
      command: 'publish_notice',
      actorUserId: 'user-1',
      actorRole: 'user',
      confirmed: true,
      idempotencyKey: 'key-2',
      payload: { text: 'hello' }
    })).toMatchObject({ valid: false, status: 403 });
  });

  test('requires explicit confirmation for consequential commands', () => {
    const result = validateCommandRequest({
      command: 'publish_notice',
      actorUserId: 'admin-1',
      actorRole: 'admin',
      confirmed: false,
      idempotencyKey: 'key-3',
      payload: { text: 'approved notice' }
    });
    expect(result).toMatchObject({ valid: false, status: 409 });
  });

  test('requires idempotency key and sanitizes notice input contract', () => {
    expect(validateCommandRequest({
      command: 'publish_notice',
      actorUserId: 'admin-1',
      actorRole: 'admin',
      confirmed: true,
      idempotencyKey: '',
      payload: { text: 'approved notice' }
    })).toMatchObject({ valid: false, status: 400 });

    expect(validateCommandRequest({
      command: 'publish_notice',
      actorUserId: 'admin-1',
      actorRole: 'admin',
      confirmed: true,
      idempotencyKey: 'key-4',
      payload: { text: '<script></script>' }
    })).toMatchObject({ valid: true });
  });
});
