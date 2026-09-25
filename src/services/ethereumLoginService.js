'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verifyMessage } = require('ethers');
const User = require('../models/User');
const EthereumLoginChallenge = require('../models/EthereumLoginChallenge');
const MetaverseCharacter = require('../../backend/src/models/MetaverseCharacter');
const { normalizeAddress, normalizeChainId, sha256 } = require('./evmWalletLinkService');

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function jwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non configurato');
  return process.env.JWT_SECRET;
}

function loginDomain() {
  return String(process.env.MYZUBSTER_WALLET_DOMAIN || 'www.myzubster.com').trim();
}

function loginUri() {
  return String(process.env.MYZUBSTER_PUBLIC_URL || process.env.PUBLIC_APP_URL || 'https://www.myzubster.com').replace(/\/$/, '');
}

function createSiweMessage({ address, chainId, nonce, issuedAt, expiresAt, domain = loginDomain(), uri = loginUri() }) {
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to MyZubster. This signature does not authorize a payment or transfer ETH.',
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${expiresAt.toISOString()}`
  ].join('\n');
}

async function createEthereumLoginChallenge({ address, chainId, now = new Date(), ttlMs = DEFAULT_TTL_MS }) {
  const normalizedAddress = normalizeAddress(address);
  const normalizedChainId = normalizeChainId(chainId);
  const issuedAt = new Date(now);
  const expiresAt = new Date(issuedAt.getTime() + ttlMs);
  const nonce = crypto.randomBytes(16).toString('hex');
  const domain = loginDomain();
  const uri = loginUri();
  const message = createSiweMessage({
    address: normalizedAddress,
    chainId: normalizedChainId,
    nonce,
    issuedAt,
    expiresAt,
    domain,
    uri
  });

  const stored = await EthereumLoginChallenge.create({
    address: normalizedAddress,
    chainId: normalizedChainId,
    domain,
    uri,
    nonceHash: sha256(nonce),
    message,
    messageHash: sha256(message),
    issuedAt,
    expiresAt
  });

  return {
    challengeId: String(stored._id),
    address: normalizedAddress,
    chainId: normalizedChainId,
    message,
    issuedAt,
    expiresAt
  };
}

async function ensureEthereumCharacter(user) {
  let character = await MetaverseCharacter.findOne({ accountUserId:user._id });
  const providerIdentity = {
    provider:'ethereum',
    providerId:String(user.evmWallet.address),
    verifiedAt:user.evmWallet.verifiedAt || new Date()
  };

  if (!character) {
    const displayName = String(user.username || 'Explorer').slice(0, 30);
    character = new MetaverseCharacter({
      characterId:`account-${String(user._id)}`,
      displayName,
      characterName:displayName,
      archetype:'explorer',
      identityStatus:'account-linked',
      worldId:'neon-plaza',
      createdFrom:'account-social',
      accountUserId:user._id,
      identityProviders:[providerIdentity],
      lastSeenAt:new Date()
    });
  } else {
    const providers = Array.isArray(character.identityProviders)
      ? character.identityProviders.filter(item => item.provider !== 'ethereum')
      : [];
    character.identityProviders = [...providers, providerIdentity];
    character.identityStatus = 'account-linked';
    character.lastSeenAt = new Date();
  }

  await character.save();
  return character;
}

async function verifyEthereumLogin({ challengeId, message, signature, now = new Date() }) {
  const challenge = await EthereumLoginChallenge.findById(challengeId).select('+message');
  if (!challenge) {
    const error = new Error('Challenge Ethereum non disponibile');
    error.code = 'ETHEREUM_LOGIN_CHALLENGE_MISSING';
    throw error;
  }
  if (challenge.consumedAt) {
    const error = new Error('Challenge Ethereum già utilizzato');
    error.code = 'ETHEREUM_LOGIN_CHALLENGE_CONSUMED';
    throw error;
  }
  if (new Date(challenge.expiresAt).getTime() <= new Date(now).getTime()) {
    const error = new Error('Challenge Ethereum scaduto');
    error.code = 'ETHEREUM_LOGIN_CHALLENGE_EXPIRED';
    throw error;
  }
  if (String(message || '') !== String(challenge.message || '') || sha256(String(message || '')) !== String(challenge.messageHash || '')) {
    const error = new Error('Messaggio Ethereum non valido');
    error.code = 'ETHEREUM_LOGIN_MESSAGE_MISMATCH';
    throw error;
  }

  let recovered;
  try {
    recovered = normalizeAddress(verifyMessage(String(message), String(signature || '')));
  } catch (_error) {
    const error = new Error('Firma Ethereum non valida');
    error.code = 'INVALID_ETHEREUM_LOGIN_SIGNATURE';
    throw error;
  }

  const expected = normalizeAddress(challenge.address);
  if (recovered !== expected) {
    const error = new Error('La firma appartiene a un wallet diverso');
    error.code = 'ETHEREUM_LOGIN_SIGNER_MISMATCH';
    throw error;
  }

  const consumed = await EthereumLoginChallenge.findOneAndUpdate(
    { _id:challenge._id, consumedAt:null },
    { $set:{ consumedAt:new Date(now) } },
    { new:true }
  );
  if (!consumed) {
    const error = new Error('Challenge Ethereum già utilizzato');
    error.code = 'ETHEREUM_LOGIN_CHALLENGE_CONSUMED';
    throw error;
  }

  const user = await User.findOne({
    'evmWallet.address':expected,
    'evmWallet.status':'WALLET_VERIFIED'
  });
  if (!user) {
    const error = new Error('Wallet verificato ma non ancora collegato a un account MyZubster');
    error.code = 'ETHEREUM_WALLET_NOT_LINKED';
    throw error;
  }

  user.lastLogin = new Date(now);
  user.evmWallet.lastVerifiedAt = new Date(now);
  await user.save();

  const character = await ensureEthereumCharacter(user);
  const token = jwt.sign(
    { userId:user._id, username:user.username, role:user.role },
    jwtSecret(),
    { expiresIn:process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    provider:'ethereum',
    user:{
      id:user._id,
      username:user.username,
      role:user.role,
      wallet:{
        address:user.evmWallet.address,
        chainId:user.evmWallet.chainId,
        verifiedAt:user.evmWallet.verifiedAt
      }
    },
    characterId:character?.characterId || null
  };
}

module.exports = {
  DEFAULT_TTL_MS,
  createSiweMessage,
  createEthereumLoginChallenge,
  verifyEthereumLogin
};
