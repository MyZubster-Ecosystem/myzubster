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

async function verifyGitHubLinks({ login, repositories = [] }) {
  const identity = await verifyUser(login);
  const verifiedRepositories = [];
  for (const repository of repositories) {
    verifiedRepositories.push(await verifyRepository(repository));
  }
  return { identity, verifiedRepositories };
}

module.exports = {
  cleanLogin,
  cleanRepository,
  verifyUser,
  verifyRepository,
  verifyGitHubLinks
};
