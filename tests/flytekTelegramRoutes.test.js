'use strict';

const { _test } = require('../src/routes/flytekTelegramRoutes');

describe('Flytek Telegram webhook contract', () => {
  test('normalizes Telegram commands with bot suffixes', () => {
    expect(_test.normalizeCommand('/events@FlytekBot now')).toBe('/events');
    expect(_test.normalizeCommand('/ORGANIZE')).toBe('/organize');
  });

  test('exposes the expected community commands', () => {
    ['/start','/help','/rules','/events','/lineup','/crew','/welfare','/organize'].forEach(command => {
      expect(_test.commandText(command)).toEqual(expect.any(String));
      expect(_test.commandText(command).length).toBeGreaterThan(10);
    });
  });

  test('keeps the organizer flow within lawful boundaries', () => {
    const text = _test.commandText('/organize');
    expect(text).toContain('autorizzato');
    expect(text).toContain('non aiuta a bypassare permessi');
  });

  test('publishes explicit privacy and welfare rules', () => {
    expect(_test.RULES.join(' ')).toContain('privacy');
    expect(_test.RULES.join(' ')).toContain('Welfare');
  });
});
