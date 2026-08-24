import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AgentsPage from './AgentsPage';

describe('AgentsPage bounty experience', () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.history.replaceState({}, '', '/entity-bounties');
    global.fetch = jest.fn().mockRejectedValue(new Error('offline test'));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  });

  test('renders completion milestones and both bounty tracks offline', async () => {
    await act(async () => {
      root.render(<AgentsPage initialPanel="bounties" />);
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Completiamo Zorgax');
    expect(container.textContent).toContain('Completamento operativo');
    expect(container.textContent).toContain('Visual identity kit');
    expect(container.textContent).toContain('250 MYZ');
    expect(container.textContent).toContain('150 MYZ');
    expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('42');
    expect(container.querySelectorAll('.entity-milestone')).toHaveLength(6);
  });

  test('switches entity and returns to the conversation panel', async () => {
    await act(async () => {
      root.render(<AgentsPage initialPanel="bounties" />);
      await Promise.resolve();
    });

    const circula = Array.from(container.querySelectorAll('.entity-card'))
      .find(button => button.textContent.includes('Circula'));
    await act(async () => {
      circula.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Completiamo Circula');

    const conversation = Array.from(container.querySelectorAll('[role="tab"]'))
      .find(button => button.textContent.includes('Conversazione'));
    await act(async () => {
      conversation.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Come posso aiutarti?');
  });
});
