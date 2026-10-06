'use strict';

const fs = require('fs');
const path = require('path');

describe('Flytek raver community bot contract', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../services/ai-automation/src/telegram/flytekCommunityBot.js'),
    'utf8'
  );

  test('offers core community commands', () => {
    for (const command of ['/events', '/lineup', '/crew', '/welfare', '/organize', '/rules']) {
      expect(source).toContain(command);
    }
  });

  test('keeps party organization bounded to lawful and authorized events', () => {
    expect(source).toContain('party autorizzato');
    expect(source).toContain('autorizzazione dello spazio');
    expect(source).toContain('permessi, capienza, rumore, sicurezza');
    expect(source).toContain('non aiuta a bypassare permessi, controlli o accessi non autorizzati');
  });

  test('covers welfare and consent-aware cultural archiving', () => {
    expect(source).toContain('acqua potabile');
    expect(source).toContain('accessibilità');
    expect(source).toContain('archivia flyer, lineup e contributi con consenso');
  });
});
