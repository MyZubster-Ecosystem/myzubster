'use strict';

const fs = require('fs');
const path = require('path');

describe('Nicola LIFE pilot validation seed', () => {
  const page = fs.readFileSync(
    path.join(__dirname, '..', 'frontend', 'src', 'pages', 'ZorgaxLifePilotPage.js'),
    'utf8'
  );

  test('uses Nicola’s two active product candidates', () => {
    expect(page).toContain("candidateId: 'kit-primo-prodotto-7-giorni'");
    expect(page).toContain("candidateId: 'project-planner-ai'");
    expect(page).toContain('<h2>Due idee da confrontare</h2>');
  });

  test('records preliminary feedback without assigning it to one candidate', () => {
    expect(page).toContain("scope: 'BOTH_CANDIDATES_UNATTRIBUTED'");
    expect(page).toContain("verdict: 'NEEDS_EVIDENCE'");
    expect(page).toContain("participant: 'Persona A'");
    expect(page).toContain("participant: 'Persona D'");
    expect(page).toContain("either candidate's evidence array");
  });

  test('keeps the comparative-response gate explicit', () => {
    expect(page).toContain('Raccogliere almeno quattro risposte anonime');
    expect(page).toContain('Nessuna preferenza esplicita tra le due idee.');
  });
});
