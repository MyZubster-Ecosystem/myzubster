'use strict';

const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'MyZubster-Ecosystem-Registry/1.0'
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

function cleanLogin(value) {
  const login = String(value || '').trim();
  if (!/^[A-Za-z0-9-]{1,100}$/.test(login)) throw new Error('GitHub login non valido');
  return login;
}

function cleanRepository(value) {
  const fullName = String(value || '').trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) {
    throw new Error('Repository GitHub non valido');
  }
  return fullName;
}

async function verifyUser(login) {
  const normalized = cleanLogin(login);
  const response = await axios.get(`${GITHUB_API}/users/${encodeURIComponent(normalized)}`, {
    headers: githubHeaders(),
    timeout: 10000
  });
  const user = response.data || {};
  return {
    login: user.login,
    githubUserId: user.id,
    profileUrl: user.html_url
  };
}

async function verifyRepository(repository) {
  const normalized = cleanRepository(repository);
  const response = await axios.get(`${GITHUB_API}/repos/${normalized}`, {
    headers: githubHeaders(),
    timeout: 10000
  });
  const repo = response.data || {};
  return {
    fullName: repo.full_name,
    githubRepositoryId: repo.id,
    htmlUrl: repo.html_url,
    owner: repo.owner?.login || '',
    visibility: repo.visibility || (repo.private ? 'private' : 'public')
  };
}


function cleanPositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error(`${label} non valido`);
  return number;
}

function cleanSha(value) {
  const sha = String(value || '').trim();
  if (!/^[a-f0-9]{7,40}$/i.test(sha)) throw new Error('Commit SHA non valido');
  return sha;
}

async function verifyIssue(repository, issueNumber) {
  const normalized = cleanRepository(repository);
  const number = cleanPositiveInteger(issueNumber, 'Numero issue');
  const response = await axios.get(`${GITHUB_API}/repos/${normalized}/issues/${number}`, {
    headers: githubHeaders(),
    timeout: 10000
  });
  const issue = response.data || {};
  if (issue.pull_request) throw new Error('La sorgente indicata è una pull request, non una issue');
  return {
    kind: 'issue',
    sourceKey: `${normalized}#issue-${number}`,
    repository: normalized,
    number,
    sha: '',
    releaseTag: '',
    githubId: issue.id,
    nodeId: issue.node_id || '',
    url: issue.html_url,
    title: issue.title || `Issue #${number}`,
    author: issue.user?.login || '',
    sourceState: issue.state || '',
    merged: false
  };
}

async function verifyPullRequest(repository, pullNumber) {
  const normalized = cleanRepository(repository);
  const number = cleanPositiveInteger(pullNumber, 'Numero pull request');
  const response = await axios.get(`${GITHUB_API}/repos/${normalized}/pulls/${number}`, {
    headers: githubHeaders(),
    timeout: 10000
  });
  const pull = response.data || {};
  return {
    kind: 'pull_request',
    sourceKey: `${normalized}#pr-${number}`,
    repository: normalized,
    number,
    sha: pull.merge_commit_sha || '',
    releaseTag: '',
    githubId: pull.id,
    nodeId: pull.node_id || '',
    url: pull.html_url,
    title: pull.title || `Pull request #${number}`,
    author: pull.user?.login || '',
    sourceState: pull.state || '',
    merged: Boolean(pull.merged_at)
  };
}

async function verifyCommit(repository, commitSha) {
  const normalized = cleanRepository(repository);
  const sha = cleanSha(commitSha);
  const response = await axios.get(`${GITHUB_API}/repos/${normalized}/commits/${sha}`, {
    headers: githubHeaders(),
    timeout: 10000
  });
  const commit = response.data || {};
  return {
    kind: 'commit',
    sourceKey: `${normalized}@${commit.sha || sha}`,
    repository: normalized,
    number: null,
    sha: commit.sha || sha,
    releaseTag: '',
    githubId: null,
    nodeId: commit.node_id || '',
    url: commit.html_url,
    title: String(commit.commit?.message || '').split('\n')[0].slice(0, 300),
    author: commit.author?.login || commit.commit?.author?.name || '',
    sourceState: 'exists',
    merged: false,
    committedAt: commit.commit?.committer?.date || commit.commit?.author?.date || null
  };
}

async function verifyRelease(repository, tag) {
  const normalized = cleanRepository(repository);
  const releaseTag = String(tag || '').trim();
  if (!releaseTag || releaseTag.length > 200) throw new Error('Release tag non valido');
  const response = await axios.get(`${GITHUB_API}/repos/${normalized}/releases/tags/${encodeURIComponent(releaseTag)}`, {
    headers: githubHeaders(),
    timeout: 10000
  });
  const release = response.data || {};
  return {
    kind: 'release',
    sourceKey: `${normalized}#release-${release.tag_name || releaseTag}`,
    repository: normalized,
    number: null,
    sha: '',
    releaseTag: release.tag_name || releaseTag,
    githubId: release.id,
    nodeId: release.node_id || '',
    url: release.html_url,
    title: release.name || release.tag_name || releaseTag,
    author: release.author?.login || '',
    sourceState: release.draft ? 'draft' : release.prerelease ? 'prerelease' : 'published',
    merged: false
  };
}

async function verifyContributionSource(input = {}) {
  switch (input.kind) {
    case 'issue':
      return verifyIssue(input.repository, input.number);
    case 'pull_request':
      return verifyPullRequest(input.repository, input.number);
    case 'commit':
      return verifyCommit(input.repository, input.sha);
    case 'release':
      return verifyRelease(input.repository, input.releaseTag);
    default:
      throw new Error('Tipo sorgente GitHub non supportato');
  }
}

async function verifyGitHubLinks({ login, repositories = [] }) {
  const identity = await verifyUser(login);
  const verifiedRepositories = [];
  for (const repository of repositories) {
    const verified = await verifyRepository(repository);
    if (verified.visibility !== 'public') {
      throw new Error('Solo repository GitHub pubblici possono essere collegati al registro pubblico');
    }
    verifiedRepositories.push(verified);
  }
  return { identity, verifiedRepositories };
}

module.exports = {
  cleanLogin,
  cleanRepository,
  verifyUser,
  verifyRepository,
  verifyGitHubLinks,
  verifyIssue,
  verifyPullRequest,
  verifyCommit,
  verifyRelease,
  verifyContributionSource
};
