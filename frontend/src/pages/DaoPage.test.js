import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import DaoPage from './DaoPage';

const overview = {
  ok: true,
  schemaVersion: '1.0.0',
  network: {
    id: 'myzubster-dao-v1',
    canonicalRepository: 'https://github.com/MyZubster-Ecosystem/myzubster',
    ledgerPath: 'frontend/src/data/daoGovernance.json'
  },
  summary: {
    proposalCount: 1,
    openProposalCount: 1,
    admittedMemberCount: 0,
    chamberCount: 2,
    integrityValid: true
  },
  proposals: [{
    id: 'MIP-001',
    version: 1,
    state: 'OPEN',
    title: 'Ratifica del programma bounty per entità e visual',
    description: 'La proposta adotta il programma bounty con ratifica umana.',
    digest: `sha256:${'a'.repeat(64)}`,
    opensAt: '2026-08-24T00:00:00.000Z',
    closesAt: '2026-09-07T23:59:59.000Z',
    approvalThresholdBps: 6000,
    target: { type: 'bounty-program', id: 'MYZ-ENTITY-COMPLETION-001', url: '/entity-bounties' },
    tally: {
      chambers: [
        { id: 'community', label: 'Comunità', quorum: 3, for: 0, against: 0, abstain: 0, participation: 0, approvalBps: 0 },
        { id: 'stewards', label: 'Steward', quorum: 2, for: 0, against: 0, abstain: 0, participation: 0, approvalBps: 0 }
      ]
    }
  }]
};

describe('DaoPage', () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => overview });
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

  test('shows the bootstrap boundary, two chambers and the bounty target', async () => {
    await act(async () => {
      root.render(<DaoPage />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Decisioni pubbliche');
    expect(container.textContent).toContain('La DAO non può ancora ratificare decisioni');
    expect(container.textContent).toContain('Comunità');
    expect(container.textContent).toContain('Steward');
    expect(container.textContent).toContain('MYZ-ENTITY-COMPLETION-001');
    expect(container.textContent).toContain('Zorgax è consultivo');
    expect(container.textContent).toContain('Ledger integro');
  });

  test('offers local signing but never automatic execution', async () => {
    await act(async () => {
      root.render(<DaoPage />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Firma e verifica scheda');
    expect(container.textContent).toContain('Nessuna esecuzione automatica');
    expect(container.textContent).toContain('Crea identità DAO');
  });
});
