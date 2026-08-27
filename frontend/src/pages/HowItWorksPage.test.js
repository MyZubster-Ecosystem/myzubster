import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import HowItWorksPage from './HowItWorksPage';

describe('HowItWorksPage', () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  });

  test('explains the site workflow and evidence boundaries', () => {
    act(() => {
      root.render(<HowItWorksPage />);
    });

    expect(container.querySelector('h1').textContent).toMatch(/dal dato reale a un risultato verificabile/i);
    expect(container.textContent).toMatch(/16 entità AI/i);
    expect(container.textContent).toMatch(/MYZ rappresenta contabilità interna/i);
    expect(container.textContent).toMatch(/Una PR non prova un deploy/i);

    const entitiesLink = Array.from(container.querySelectorAll('a'))
      .find(anchor => anchor.textContent.includes('Parla con le 16 entità'));
    expect(entitiesLink).toBeTruthy();
    expect(entitiesLink.getAttribute('href')).toBe('/entities');
  });
});
