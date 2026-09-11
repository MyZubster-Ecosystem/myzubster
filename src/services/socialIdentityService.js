const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MetaverseCharacter = require('../../backend/src/models/MetaverseCharacter');

const PROVIDERS = new Set(['google', 'github', 'facebook']);

function jwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non configurato');
  return process.env.JWT_SECRET;
}

function safeName(value) {
  const cleaned = String(value || 'Explorer').trim().replace(/[^a-zA-Z0-9 _-]+/g, '').replace(/\s+/g, ' ').slice(0, 30);
  return cleaned || 'Explorer';
}

function usernameBase(profile) {
  return safeName(profile.login || profile.name || String(profile.email || '').split('@')[0] || 'zubster')
    .toLowerCase().replace(/\s+/g, '-').slice(0, 24) || 'zubster';
}

function providerAccountEmail(provider, profile) {
  if (profile?.email) return String(profile.email).toLowerCase();
  if (provider !== 'facebook' || !profile?.id) return null;
  const digest = crypto.createHash('sha256').update(String(profile.id)).digest('hex').slice(0, 24);
  return `facebook-${digest}@identity.myzubster.invalid`;
}

async function uniqueUsername(base) {
  let candidate = base;
  let n = 1;
  while (await User.exists({ username: candidate })) candidate = `${base.slice(0, 25)}-${n++}`;
  return candidate;
}

async function ensureCharacter(user, provider, profile) {
  let character = await MetaverseCharacter.findOne({ accountUserId: user._id });
  const displayName = safeName(profile.name || profile.login || user.username);
  const providerIdentity = { provider, providerId: String(profile.id), verifiedAt: new Date() };
  if (!character) {
    character = new MetaverseCharacter({
      characterId: `account-${String(user._id)}`,
      displayName,
      characterName: displayName,
      archetype: 'explorer',
      identityStatus: 'account-linked',
      worldId: 'neon-plaza',
      createdFrom: provider === 'github' ? 'account-github' : 'account-social',
      accountUserId: user._id,
      identityProviders: [providerIdentity],
      lastSeenAt: new Date()
    });
  } else {
    character.identityStatus = 'account-linked';
    character.lastSeenAt = new Date();
    const providers = Array.isArray(character.identityProviders) ? character.identityProviders.filter(item => item.provider !== provider) : [];
    character.identityProviders = [...providers, providerIdentity];
  }
  if (provider === 'github') character.github = { id: String(profile.id), login: profile.login, profileUrl: profile.profileUrl || `https://github.com/${profile.login}`, verifiedAt: new Date() };
  await character.save();
  return character;
}

function normalizeGithubSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return undefined;
  const repos = Array.isArray(snapshot.repositories) ? snapshot.repositories.slice(0, 6).map(repo => ({
    name: String(repo.name || '').slice(0, 180),
    description: String(repo.description || '').slice(0, 500),
    language: String(repo.language || '').slice(0, 80),
    stars: Number(repo.stars || 0),
    forks: Number(repo.forks || 0),
    url: String(repo.url || '').slice(0, 500),
    updatedAt: repo.updatedAt || undefined
  })) : [];
  return {
    name: String(snapshot.name || '').slice(0, 180),
    bio: String(snapshot.bio || '').slice(0, 1000),
    company: String(snapshot.company || '').slice(0, 180),
    location: String(snapshot.location || '').slice(0, 180),
    blog: String(snapshot.blog || '').slice(0, 500),
    publicRepos: Number(snapshot.publicRepos || 0),
    followers: Number(snapshot.followers || 0),
    following: Number(snapshot.following || 0),
    repositories: repos,
    profileReadme: String(snapshot.profileReadme || '').slice(0, 12000),
    capturedAt: new Date()
  };
}

async function upsertVerifiedAccount(provider, profile) {
  if (!PROVIDERS.has(provider)) throw new Error('Provider social non supportato');
  if (!profile?.id) throw new Error('Identità provider non verificata');
  const providerPath = `socialIdentities.${provider}.id`;
  let user = await User.findOne({ [providerPath]: String(profile.id) });
  if (!user && profile.email) user = await User.findOne({ email: String(profile.email).toLowerCase() });
  if (!user) {
    const accountEmail = providerAccountEmail(provider, profile);
    if (!accountEmail) throw new Error('Il provider deve restituire una email verificata per creare un nuovo account');
    user = new User({
      username: await uniqueUsername(usernameBase(profile)),
      email: accountEmail,
      password: crypto.randomBytes(32).toString('hex'),
      isVerified: true
    });
  }
  user.socialIdentities = user.socialIdentities || {};
  const providerIdentity = { id: String(profile.id), verifiedAt: new Date() };
  if (profile.email) providerIdentity.email = String(profile.email).toLowerCase();
  user.socialIdentities[provider] = providerIdentity;
  if (provider === 'github') {
    const previousSnapshot = user.github?.publicSnapshot;
    user.github = {
      id: String(profile.id),
      login: profile.login,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      verifiedAt: new Date(),
      publicSnapshot: normalizeGithubSnapshot(profile.publicSnapshot) || previousSnapshot
    };
  }
  user.isVerified = true;
  user.lastLogin = new Date();
  await user.save();
  const character = await ensureCharacter(user, provider, profile);
  const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, jwtSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  return { user, character, token };
}

module.exports = { upsertVerifiedAccount, _test: { providerAccountEmail, normalizeGithubSnapshot } };
