const axios = require('axios');
jest.mock('axios');

const {
  verifyIssue,
  verifyPullRequest,
  verifyCommit,
  verifyRelease,
  verifyContributionSource
} = require('../src/services/githubEcosystemVerificationService');

describe('GitHub contribution source verification', () => {
  afterEach(() => jest.clearAllMocks());

  test('verifies issue without treating pull requests as issues', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        id: 10,
        node_id: 'I_10',
        html_url: 'https://github.com/org/repo/issues/7',
        title: 'Research task',
        state: 'open',
        user: { login: 'researcher' }
      }
    });

    const result = await verifyIssue('org/repo', 7);
    expect(result).toMatchObject({
      kind: 'issue',
      sourceKey: 'org/repo#issue-7',
      repository: 'org/repo',
      number: 7,
      sourceState: 'open'
    });
  });

  test('verifies merged pull request', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        id: 20,
        node_id: 'PR_20',
        html_url: 'https://github.com/org/repo/pull/9',
        title: 'Implement pilot',
        state: 'closed',
        merged_at: '2026-09-21T10:00:00Z',
        merge_commit_sha: 'a'.repeat(40),
        user: { login: 'developer' }
      }
    });

    const result = await verifyPullRequest('org/repo', 9);
    expect(result.merged).toBe(true);
    expect(result.sourceKey).toBe('org/repo#pr-9');
  });

  test('verifies immutable commit SHA and timestamp', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        sha: 'b'.repeat(40),
        node_id: 'C_1',
        html_url: 'https://github.com/org/repo/commit/' + 'b'.repeat(40),
        author: { login: 'developer' },
        commit: {
          message: 'feat: implement evidence flow\n\nbody',
          committer: { date: '2026-09-21T10:00:00Z' }
        }
      }
    });

    const result = await verifyCommit('org/repo', 'b'.repeat(40));
    expect(result).toMatchObject({
      kind: 'commit',
      sha: 'b'.repeat(40),
      sourceState: 'exists',
      committedAt: '2026-09-21T10:00:00Z'
    });
  });

  test('routes release verification through contribution source dispatcher', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        id: 30,
        node_id: 'R_30',
        html_url: 'https://github.com/org/repo/releases/tag/v1.0.0',
        tag_name: 'v1.0.0',
        name: 'v1.0.0',
        draft: false,
        prerelease: false,
        author: { login: 'maintainer' }
      }
    });

    const result = await verifyContributionSource({
      kind: 'release',
      repository: 'org/repo',
      releaseTag: 'v1.0.0'
    });
    expect(result).toMatchObject({
      kind: 'release',
      releaseTag: 'v1.0.0',
      sourceState: 'published'
    });
  });

  test('rejects unsupported source types', async () => {
    await expect(verifyContributionSource({ kind: 'payment' })).rejects.toThrow('Tipo sorgente GitHub non supportato');
  });
});
