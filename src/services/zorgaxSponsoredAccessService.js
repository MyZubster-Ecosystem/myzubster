'use strict';

const User = require('../models/User');

// Sponsored access is deliberately bound to a verified, account-linked
// public GitHub identity. It does not create a payment, subscription, credit,
// or settlement record and can be revoked by removing the login from an allowlist.
const SPONSORED_GITHUB_LOGINS = Object.freeze(new Set([
  'nicolaususnicola-lgtm'
]));

function envLoginSet(name) {
  return new Set(
    String(process.env[name] || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function institutionalGithubLogins() {
  return envLoginSet('ZORGAX_INSTITUTIONAL_GITHUB_LOGINS');
}

async function getSponsoredAccess(ownerId, { UserModel = User } = {}) {
  const normalizedOwnerId = String(ownerId || '').trim();
  if (!normalizedOwnerId) throw new Error('ownerId is required');

  const user = await UserModel.findById(normalizedOwnerId)
    .select('github.login github.id github.verifiedAt')
    .lean();

  const githubLogin = String(user?.github?.login || '').trim().toLowerCase();
  const githubVerified = Boolean(githubLogin && user?.github?.id);
  if (!githubVerified) return null;

  if (institutionalGithubLogins().has(githubLogin)) {
    return {
      plan: 'institutional',
      tier: 'INSTITUTIONAL',
      status: 'ACTIVE',
      active: true,
      source: 'INSTITUTIONAL_GITHUB',
      startsAt: user.github.verifiedAt || null,
      expiresAt: null,
      sponsored: true,
      billingRequired: false,
      verification: 'github-allowlist'
    };
  }

  if (!SPONSORED_GITHUB_LOGINS.has(githubLogin)) {
    return null;
  }

  return {
    plan: 'developer',
    tier: 'DEVELOPER',
    status: 'ACTIVE',
    active: true,
    source: 'SPONSORED_PILOT',
    startsAt: user.github.verifiedAt || null,
    expiresAt: null,
    sponsored: true,
    billingRequired: false,
    verification: 'github-allowlist'
  };
}

module.exports = {
  SPONSORED_GITHUB_LOGINS,
  institutionalGithubLogins,
  getSponsoredAccess
};
