const crypto = require('crypto');
const mongoose = require('mongoose');
const ZorgaxPartyArchive = require('../models/ZorgaxPartyArchive');

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function safeText(value, maxLength) {
  return String(value || '')
    .replace(/[<>\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength);
}

function safeUrl(value) {
  const raw = safeText(value, 2048);
  try {
    const parsed = new URL(raw);
    if (!['https:', 'http:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function archiveCapabilities() {
  return {
    lifecycle: 'handoff-supported',
    replayEngine: 'not-modeled',
    sourceDependency: 'MYZ-97',
    publicAssetsRequireApproval: true,
    mediaConsentRequired: true,
    liveCapabilitiesExpireOnArchive: true
  };
}

function validateArchiveInput({ actorRole, confirmed, visibility, assets = [] }) {
  if (actorRole !== 'admin') return { valid: false, status: 403, error: 'Admin capability required' };
  if (confirmed !== true) return { valid: false, status: 409, error: 'Explicit confirmation required' };
  if (!['public', 'unlisted', 'private'].includes(visibility)) {
    return { valid: false, status: 400, error: 'Invalid archive visibility' };
  }
  if (!Array.isArray(assets) || assets.length > 20) {
    return { valid: false, status: 400, error: 'Archive assets must be an array of at most 20 items' };
  }

  const normalizedAssets = [];
  for (const asset of assets) {
    if (!['replay', 'highlight', 'archive'].includes(asset?.type)) {
      return { valid: false, status: 400, error: 'Invalid archive asset type' };
    }
    const title = safeText(asset?.title, 160);
    const url = safeUrl(asset?.url);
    if (!title || !url) return { valid: false, status: 400, error: 'Archive asset title and http(s) URL are required' };
    normalizedAssets.push({
      type: asset.type,
      title,
      url,
      approved: asset.approved === true,
      consentVerified: asset.consentVerified === true
    });
  }

  return { valid: true, normalizedAssets };
}

async function createArchiveHandoff({ actorUserId, actorRole, confirmed, communityId, eventId, roomId, visibility = 'private', assets = [] }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Archive storage unavailable' };
  const validation = validateArchiveInput({ actorRole, confirmed, visibility, assets });
  if (!validation.valid) return validation;

  const archiveId = crypto.randomUUID();
  const now = new Date();
  const archive = await ZorgaxPartyArchive.create({
    archiveId,
    communityId: safeText(communityId || 'myzubster-metaverse', 160),
    eventId: eventId ? safeText(eventId, 160) : null,
    roomId: safeText(roomId || 'neon-plaza', 160),
    state: 'archived',
    visibility,
    assets: validation.normalizedAssets,
    liveCapabilitiesExpiredAt: now,
    createdByUserId: actorUserId,
    createdAt: now,
    updatedAt: now
  });

  return { valid: true, status: 201, archive: publicArchiveView(archive.toObject(), actorRole === 'admin') };
}

function publicArchiveView(archive, includePrivate = false) {
  if (!archive) return null;
  const publicAssets = (archive.assets || []).filter((asset) => asset.approved === true && asset.consentVerified === true);
  return {
    id: archive.archiveId,
    state: archive.state,
    visibility: archive.visibility,
    communityId: archive.communityId,
    eventId: archive.eventId || null,
    roomId: archive.roomId,
    liveCapabilitiesExpiredAt: archive.liveCapabilitiesExpiredAt,
    assets: includePrivate ? archive.assets : publicAssets,
    replayEngine: 'not-modeled'
  };
}

async function getLatestArchive({ includePrivate = false } = {}) {
  if (!databaseAvailable()) {
    return {
      status: 'unavailable',
      archive: null,
      reason: 'archive-storage-unavailable',
      replayEngine: 'not-modeled'
    };
  }
  const query = includePrivate ? {} : { visibility: 'public' };
  const archive = await ZorgaxPartyArchive.findOne(query).sort({ createdAt: -1 }).lean();
  if (!archive) {
    return {
      status: 'not-modeled',
      archive: null,
      reason: 'no-approved-archive-handoff',
      replayEngine: 'not-modeled'
    };
  }
  return { status: archive.state, archive: publicArchiveView(archive, includePrivate), replayEngine: 'not-modeled' };
}

async function liveCapabilitiesExpired() {
  if (!databaseAvailable()) return false;
  const archive = await ZorgaxPartyArchive.findOne({ state: 'archived' }).sort({ createdAt: -1 }).lean();
  return Boolean(archive?.liveCapabilitiesExpiredAt && new Date(archive.liveCapabilitiesExpiredAt).getTime() <= Date.now());
}

module.exports = {
  archiveCapabilities,
  validateArchiveInput,
  createArchiveHandoff,
  getLatestArchive,
  liveCapabilitiesExpired,
  publicArchiveView
};
