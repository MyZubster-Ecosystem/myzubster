const {
  deriveLifecycle,
  deriveRewardAssets,
  parseRewardDeclarations,
  deriveReviewMode,
  deriveSensitivity,
  extractClosingIssueNumbers,
  issueToDocument
} = require('../src/services/githubBountySyncService');

describe('github bounty sync helpers', () => {
  test('derives lifecycle from canonical status labels', () => {
    expect(deriveLifecycle(['status:proposed'], 'open')).toBe('proposed');
    expect(deriveLifecycle(['status:verified'], 'open')).toBe('verified');
    expect(deriveLifecycle(['settlement:pending'], 'closed')).toBe('settlement_pending');
    expect(deriveLifecycle([], 'closed')).toBe('closed');
  });

  test('derives reward assets only from canonical reward labels', () => {
    expect(deriveRewardAssets(['reward:myz', 'reward:xmr'])).toEqual(['MYZ', 'XMR']);
    expect(deriveRewardAssets(['bounty', 'payments'])).toEqual([]);
  });

  test('parses reward amounts as declarations, not payment proof', () => {
    expect(parseRewardDeclarations('Reward: 2,500 MYZ and 0.08 XMR', [
      'reward:myz',
      'reward:xmr'
    ])).toEqual([
      { asset: 'MYZ', amount: '2500', raw: '2,500 MYZ' },
      { asset: 'XMR', amount: '0.08', raw: '0.08 XMR' }
    ]);
  });

  test('keeps label-declared assets even when no amount is present', () => {
    expect(parseRewardDeclarations('Community bounty', ['reward:token'])).toEqual([
      { asset: 'TOKEN', amount: null, raw: 'declared-by-label' }
    ]);
  });

  test('derives review and sensitivity labels', () => {
    expect(deriveReviewMode(['review:multi'])).toBe('multi');
    expect(deriveReviewMode(['review:manual'])).toBe('manual');
    expect(deriveSensitivity(['sensitivity:high'])).toBe('high');
    expect(deriveSensitivity([])).toBe('normal');
  });

  test('extracts GitHub closing references from pull request body', () => {
    expect(extractClosingIssueNumbers('Fixes #12\nResolves #44\nCloses #12')).toEqual([12, 44]);
  });

  test('builds a repository-qualified source key', () => {
    const doc = issueToDocument({
      id: 100,
      node_id: 'I_100',
      number: 7,
      title: 'Bounty test',
      body: 'Reward 500 MYZ',
      state: 'open',
      html_url: 'https://github.com/MyZubster-Ecosystem/example/issues/7',
      labels: [
        { name: 'type:bounty' },
        { name: 'reward:myz' },
        { name: 'status:active' },
        { name: 'evidence:required' }
      ],
      assignees: [{ login: 'contributor' }],
      user: { login: 'author' },
      created_at: '2026-08-18T10:00:00Z',
      updated_at: '2026-08-18T11:00:00Z'
    }, 'MyZubster-Ecosystem/example');

    expect(doc.sourceKey).toBe('MyZubster-Ecosystem/example#7');
    expect(doc.tracked).toBe(true);
    expect(doc.lifecycleStatus).toBe('active');
    expect(doc.rewardAssets).toEqual(['MYZ']);
    expect(doc.claimedBy).toBe('contributor');
    expect(doc.evidenceRequired).toBe(true);
  });
});
