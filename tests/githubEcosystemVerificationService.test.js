const axios = require('axios');
jest.mock('axios');

const {
  cleanLogin,
  cleanRepository,
  verifyUser,
  verifyRepository,
  verifyGitHubLinks
} = require('../src/services/githubEcosystemVerificationService');

describe('github ecosystem verification service', () => {
  afterEach(() => jest.clearAllMocks());

  test('normalizes GitHub login and repository references', () => {
    expect(cleanLogin('Example-User')).toBe('Example-User');
    expect(cleanRepository('ExampleOrg/example-repo')).toBe('ExampleOrg/example-repo');
    expect(() => cleanLogin('bad login')).toThrow();
    expect(() => cleanRepository('not-a-repository')).toThrow();
  });

  test('verifies a GitHub user against the public API', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        login: 'example-user',
        id: 123,
        html_url: 'https://github.com/example-user'
      }
    });

    await expect(verifyUser('example-user')).resolves.toEqual({
      login: 'example-user',
      githubUserId: 123,
      profileUrl: 'https://github.com/example-user'
    });
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.github.com/users/example-user',
      expect.objectContaining({ timeout: 10000 })
    );
  });

  test('verifies repository canonical ID, owner, URL and visibility', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        full_name: 'example-org/example-repo',
        id: 456,
        html_url: 'https://github.com/example-org/example-repo',
        owner: { login: 'example-org' },
        visibility: 'public',
        private: false
      }
    });

    await expect(verifyRepository('example-org/example-repo')).resolves.toEqual({
      fullName: 'example-org/example-repo',
      githubRepositoryId: 456,
      htmlUrl: 'https://github.com/example-org/example-repo',
      owner: 'example-org',
      visibility: 'public'
    });
  });

  test('rejects private repositories from the public actor registry', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { login: 'dev', id: 1, html_url: 'https://github.com/dev' } })
      .mockResolvedValueOnce({ data: { full_name: 'dev/private-repo', id: 2, html_url: 'https://github.com/dev/private-repo', owner: { login: 'dev' }, visibility: 'private', private: true } });

    await expect(verifyGitHubLinks({
      login: 'dev',
      repositories: ['dev/private-repo']
    })).rejects.toThrow('Solo repository GitHub pubblici');
  });

  test('verifies identity and every requested repository', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { login: 'dev', id: 1, html_url: 'https://github.com/dev' } })
      .mockResolvedValueOnce({ data: { full_name: 'dev/one', id: 2, html_url: 'https://github.com/dev/one', owner: { login: 'dev' }, visibility: 'public' } })
      .mockResolvedValueOnce({ data: { full_name: 'org/two', id: 3, html_url: 'https://github.com/org/two', owner: { login: 'org' }, visibility: 'public' } });

    const result = await verifyGitHubLinks({ login: 'dev', repositories: ['dev/one', 'org/two'] });
    expect(result.identity.login).toBe('dev');
    expect(result.verifiedRepositories.map(repo => repo.fullName)).toEqual(['dev/one', 'org/two']);
  });
});
