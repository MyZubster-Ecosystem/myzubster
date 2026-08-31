'use strict';

const fs = require('fs');
const path = require('path');

describe('Nicola Project Planner MVP v1', () => {
  const page = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'nicola-project-planner.html'),
    'utf8'
  );
  const vercel = fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8');

  test('is explicitly the human-selected Project Planner candidate', () => {
    expect(page).toContain("candidateId:'project-planner-ai'");
    expect(page).toContain('Project Planner per lavorare con AI/Zorgax');
    expect(page).toContain('Avvia i 7 giorni');
  });

  test('contains seven bounded daily validation steps and final decision', () => {
    expect(page).toContain("{day:1,title:'Definisci il risultato'");
    expect(page).toContain("{day:7,title:'Valutazione finale'");
    expect(page).toContain('GO / CHANGE / STOP');
    expect(page).toContain('Lo riutilizzeresti?');
  });

  test('stores participant evidence locally and exports only on explicit action', () => {
    expect(page).toContain("const STORAGE_KEY='myzubster.nicola.project-planner-mvp-v1'");
    expect(page).toContain('localStorage.setItem');
    expect(page).toContain('Esporta evidenze JSON');
    expect(page).not.toContain('fetch(');
  });

  test('keeps sensitive automation outside MVP scope', () => {
    expect(page).toContain('non invia email');
    expect(page).toContain('non effettua pagamenti o acquisti');
    expect(page).toContain('non pubblica prodotti');
    expect(page).toContain('non esegue merge automatici');
    expect(page).toContain('non prova vendite, reddito, clienti');
  });

  test('is explicitly routed by Vercel instead of falling through to the SPA', () => {
    expect(vercel).toContain('public/nicola-project-planner.html');
    expect(vercel).toContain('/nicola-project-planner/?');
  });
});
