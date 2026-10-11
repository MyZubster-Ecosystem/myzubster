jest.mock('../src/services/knowledgeGraphService', () => ({
  getContributorKnowledgeGraph: jest.fn()
}));

const {
  getContributorKnowledgeGraph
} = require('../src/services/knowledgeGraphService');

const {
  getPublicKnowledgePassport
} = require('../src/services/publicPassportService');

describe('getPublicKnowledgePassport', () => {
  test('does not expose internal reviewer or ledger data', async () => {
    getContributorKnowledgeGraph.mockResolvedValue({
      nodes: [
        {
          id: 'knowledge-contribution:c1',
          type: 'KnowledgeContribution',
          label: 'Public contribution',
          properties: {
            contributionId: 'c1',
            category: 'fermentation',
            status: 'VERIFIED',
            reviewerId: 'internal-reviewer',
            reviewNotes: 'internal-only',
            ledgerReference: 'internal-ledger'
          }
        },
        {
          id: 'reward:r1',
          type: 'Reward',
          label: '10 MYZ',
          properties: {
            rewardId: 'r1',
            amount: 10,
            currency: 'MYZ',
            status: 'paid',
            reviewedBy: 'internal-reviewer',
            ledgerReference: 'internal-ledger',
            metadata: { internal: true }
          }
        }
      ],
      edges: []
    });

    const passport = await getPublicKnowledgePassport('alice');
    const output = JSON.stringify(passport);

    expect(passport.contributions[0]).toMatchObject({
      contributionId: 'c1',
      category: 'fermentation',
      status: 'VERIFIED'
    });
    expect(passport.rewards[0]).toMatchObject({
      rewardId: 'r1',
      amount: 10,
      currency: 'MYZ',
      status: 'paid'
    });

    for (const forbidden of [
      'internal-reviewer',
      'internal-only',
      'internal-ledger',
      'metadata'
    ]) {
      expect(output).not.toContain(forbidden);
    }
  });
});
