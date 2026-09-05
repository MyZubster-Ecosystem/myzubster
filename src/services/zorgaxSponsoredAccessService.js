'use strict';

const User = require('../models/User');

// Sponsored pilot access is deliberately bound to a verified, account-linked
// public GitHub identity. It does not create a payment, subscription, credit,
// or settlement record and can be revoked by removing the login from this list.
const SPONSORED_GITHUB_LOGINS = Object.freeze(new Set([
  'nicolaususnicola-lgtm'
]));

async function getSponsoredAccess(ownerId, { UserModel = User } = {}) {
  const normalizedOwnerId = String(ownerId || '').trim();
  if (!normalizedOwnerId) throw new Error('ownerId is required');

  const user = await UserModel.findById(normalizedOwnerId)
    .select('github.login github.id github.verifiedAt')
    .lean();

  const githubLogin = String(user?.github?.login || '').trim().toLowerCase();
  if (!githubLogin || !user?.github?.id || !SPONSORED_GITHUB_LOGINS.has(githubLogin)) {
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
    billingRequired: false
  };
}

module.exports = {
  SPONSORED_GITHUB_LOGINS,
  getSponsoredAccess
};
