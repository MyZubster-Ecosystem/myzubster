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

function kefirDonorGithubLogins() {
  return envLoginSet('ZORGAX_KEFIR_DONOR_GITHUB_LOGINS');
}

function soundsystemOwnerGithubLogins() {
  return envLoginSet('ZORGAX_SOUNDSYSTEM_OWNER_GITHUB_LOGINS');
}

function sponsoredAccess({ plan, tier, source, startsAt, verification, communityRole = null }) {
  return {
    plan,
    tier,
    status: 'ACTIVE',
    active: true,
    source,
    startsAt: startsAt || null,
    expiresAt: null,
    sponsored: true,
    billingRequired: false,
    verification,
    communityRole
  };
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
    return sponsoredAccess({
      plan: 'institutional',
      tier: 'INSTITUTIONAL',
      source: 'INSTITUTIONAL_GITHUB',
      startsAt: user.github.verifiedAt,
      verification: 'github-allowlist'
    });
  }

  if (kefirDonorGithubLogins().has(githubLogin)) {
    return sponsoredAccess({
      plan: 'pro',
      tier: 'PRO',
      source: 'COMMUNITY_KEFIR_DONOR',
      startsAt: user.github.verifiedAt,
      verification: 'github-allowlist',
      communityRole: 'kefir-donor'
    });
  }

  if (soundsystemOwnerGithubLogins().has(githubLogin)) {
    return sponsoredAccess({
      plan: 'pro',
      tier: 'PRO',
      source: 'COMMUNITY_SOUNDSYSTEM_OWNER',
      startsAt: user.github.verifiedAt,
      verification: 'github-allowlist',
      communityRole: 'soundsystem-owner'
    });
  }

  if (!SPONSORED_GITHUB_LOGINS.has(githubLogin)) {
    return null;
  }

  return sponsoredAccess({
    plan: 'developer',
    tier: 'DEVELOPER',
    source: 'SPONSORED_PILOT',
    startsAt: user.github.verifiedAt,
    verification: 'github-allowlist'
  });
}

module.exports = {
  SPONSORED_GITHUB_LOGINS,
  institutionalGithubLogins,
  kefirDonorGithubLogins,
  soundsystemOwnerGithubLogins,
  getSponsoredAccess
};
