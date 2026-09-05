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

async function upsertVerifiedAccount(provider, profile) {
  if (!PROVIDERS.has(provider)) throw new Error('Provider social non supportato');
  if (!profile?.id) throw new Error('Identità provider non verificata');
  const providerPath = `socialIdentities.${provider}.id`;
  let user = await User.findOne({ [providerPath]: String(profile.id) });
  if (!user && profile.email) user = await User.findOne({ email: String(profile.email).toLowerCase() });
  if (!user) {
    if (!profile.email) throw new Error('Il provider deve restituire una email verificata per creare un nuovo account');
    user = new User({
      username: await uniqueUsername(usernameBase(profile)),
      email: String(profile.email).toLowerCase(),
      password: crypto.randomBytes(32).toString('hex'),
      isVerified: true
    });
  }
  user.socialIdentities = user.socialIdentities || {};
  user.socialIdentities[provider] = { id: String(profile.id), email: profile.email || user.email, verifiedAt: new Date() };
  if (provider === 'github') user.github = { id: String(profile.id), login: profile.login, avatarUrl: profile.avatarUrl, profileUrl: profile.profileUrl, verifiedAt: new Date() };
  user.isVerified = true;
  user.lastLogin = new Date();
  await user.save();
  const character = await ensureCharacter(user, provider, profile);
  const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, jwtSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  return { user, character, token };
}

module.exports = { upsertVerifiedAccount };
