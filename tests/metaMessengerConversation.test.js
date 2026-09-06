'use strict';

const { _test } = require('../src/routes/metaMessengerRoutes');

describe('Meta Messenger conversation quality', () => {
  test('removes common Markdown while preserving useful URLs', () => {
    const input = '**Marketplace**\n- [Apri](https://www.myzubster.com/marketplace)\n`Seller`';
    expect(_test.cleanMessengerText(input)).toBe('Marketplace\n• Apri: https://www.myzubster.com/marketplace\nSeller');
  });

  test('adds Messenger-specific language, brevity and routing instructions', () => {
    const prompt = _test.messengerPrompt('Voglio vendere');
    expect(prompt).toContain('same language');
    expect(prompt).toContain('https://www.myzubster.com/marketplace');
    expect(prompt).toContain('USER MESSAGE:\nVoglio vendere');
  });

  test('keeps a bounded per-sender conversation history', () => {
    const sender = `test-${Date.now()}-${Math.random()}`;
    _test.rememberTurn(sender, 'Ciao', 'Ciao!');
    _test.rememberTurn(sender, 'Voglio vendere', 'Apri il Marketplace.');
    expect(_test.getHistory(sender)).toEqual([
      { role: 'user', content: 'Ciao' },
      { role: 'assistant', content: 'Ciao!' },
      { role: 'user', content: 'Voglio vendere' },
      { role: 'assistant', content: 'Apri il Marketplace.' }
    ]);
  });
});
