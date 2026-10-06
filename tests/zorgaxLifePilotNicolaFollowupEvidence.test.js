'use strict';

const fs = require('fs');
const path = require('path');

describe('Nicola LIFE pilot follow-up evidence', () => {
  const evidence = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'life', 'nicola-validation-followup-2026-08-30.json'),
    'utf8'
  ));

  test('stores the follow-up as anonymous partial comparative evidence', () => {
    expect(evidence.scope).toBe('PARTIAL_COMPARATIVE_MIXED');
    expect(evidence.verdict).toBe('NEEDS_EVIDENCE');
    expect(evidence.rankingImpact).toBe('NONE');
    expect(evidence.privacy.storedPersonalNames).toBe(false);
  });

  test('records concrete problem and test-intent signals without forced candidate mapping', () => {
    expect(evidence.evidence).toHaveLength(3);
    expect(evidence.evidence[0].participant).toBe('Persona A');
    expect(evidence.evidence[0].wouldTest).toBe(true);
    expect(evidence.evidence[0].candidateMapping).toBeNull();
    expect(evidence.evidence[2].participant).toBe('Persone C-D');
    expect(evidence.evidence[2].groupedSource).toBe(true);
  });

  test('keeps the next evidence gate explicit', () => {
    expect(evidence.nextGate).toContain('quattro risposte separate e anonime');
    expect(evidence.gaps).toContain("Il ranking dei due candidati non deve essere modificato finché l'attribuzione non è esplicita.");
  });
});
