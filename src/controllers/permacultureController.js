const { randomUUID } = require('crypto');
const PermacultureSite = require('../models/PermacultureSite');
const {
  LocationPrivacyError,
  prepareLocation,
  decryptExactLocation,
  projectPublicLocation
} = require('../services/locationPrivacyService');
const { generatePermaculturePlan } = require('../services/permacultureAiService');
const {
  buildPermacultureNftMetadata,
  simulatePermacultureNft
} = require('../services/permacultureNftService');

class ControllerError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function plain(value) {
  return value && typeof value.toObject === 'function' ? value.toObject() : value || {};
}

function latestPlan(plans) {
  if (!Array.isArray(plans) || plans.length === 0) return null;
  return plain(plans[plans.length - 1]);
}

function publicSite(site) {
  const data = plain(site);
  const plan = latestPlan(data.aiPlans);
  const nft = plain(data.nft);
  delete data.privateLocation;
  delete data.ownerId;
  delete data.aiPlans;
  data.location = projectPublicLocation(data.location);
  data.aiPlan = plan;
  data.nft = {
    state: nft.state || 'none',
    onChain: nft.onChain === true,
    tokenId: nft.tokenId,
    metadataHash: nft.metadataHash
  };
  return data;
}

function uniqueList(value, max = 12) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => String(item).trim()).filter(Boolean))].slice(0, max);
}

function planningProfile(input = {}) {
  return {
    areaSqm: Number(input.areaSqm),
    climateZone: input.climateZone,
    soilTexture: input.soilTexture || 'unknown',
    slope: input.slope || 'unknown',
    waterSources: uniqueList(input.waterSources),
    goals: uniqueList(input.goals),
    constraints: uniqueList(input.constraints)
  };
}

function sendError(res, error, fallback = 'Permaculture request failed') {
  if (error instanceof ControllerError) {
    return res.status(error.status).json({ success: false, error: error.message, code: error.code });
  }
  if (error instanceof LocationPrivacyError || error.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: error.message, code: error.code });
  }
  if (error.code === 'PERMACULTURE_PLAN_REQUIRED') {
    return res.status(409).json({ success: false, error: error.message, code: error.code });
  }
  if (error.code === 'NFT_RUNTIME_NOT_CONFIGURED') {
    return res.status(503).json({ success: false, error: error.message, code: error.code });
  }
  console.error(fallback, error);
  return res.status(500).json({ success: false, error: fallback });
}

async function ownedSite(siteId, req, includePrivate = false) {
  let query = PermacultureSite.findOne({ siteId });
  if (includePrivate) query = query.select('+privateLocation');
  const site = await query;
  if (!site) throw new ControllerError('Permaculture site not found', 404, 'PERMACULTURE_SITE_NOT_FOUND');
  if (String(site.ownerId) !== String(req.userId) && req.userRole !== 'admin') {
    throw new ControllerError('Site ownership required', 403, 'PERMACULTURE_OWNERSHIP_REQUIRED');
  }
  return site;
}

exports.create = async (req, res) => {
  try {
    const { name, siteType = 'rural', location, isPublic = false } = req.body || {};
    if (!name || !req.body?.profile) {
      return res.status(400).json({ success: false, error: 'name and profile are required' });
    }
    const locationInput = location && typeof location === 'object'
      ? { ...location, visibility: location.visibility || 'private' }
      : undefined;
    const preparedLocation = prepareLocation(locationInput);
    const site = await PermacultureSite.create({
      siteId: randomUUID(),
      name: String(name).trim().slice(0, 120),
      ownerId: String(req.userId),
      siteType,
      profile: planningProfile(req.body.profile),
      location: preparedLocation.publicLocation,
      privateLocation: preparedLocation.privateLocation,
      isPublic: isPublic === true,
      status: 'draft'
    });
    return res.status(201).json({ success: true, data: publicSite(site) });
  } catch (error) {
    return sendError(res, error, 'Unable to create permaculture site');
  }
};

exports.listPublic = async (_req, res) => {
  try {
    const sites = await PermacultureSite.find({ isPublic: true, status: { $ne: 'archived' } })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ success: true, count: sites.length, data: sites.map(publicSite) });
  } catch (error) {
    return sendError(res, error, 'Unable to load permaculture sites');
  }
};

exports.listMine = async (req, res) => {
  try {
    const sites = await PermacultureSite.find({ ownerId: String(req.userId) })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ success: true, count: sites.length, data: sites.map(publicSite) });
  } catch (error) {
    return sendError(res, error, 'Unable to load owned permaculture sites');
  }
};

exports.getPublic = async (req, res) => {
  try {
    const site = await PermacultureSite.findOne({ siteId: req.params.siteId, isPublic: true });
    if (!site) return res.status(404).json({ success: false, error: 'Permaculture site not found' });
    return res.json({ success: true, data: publicSite(site) });
  } catch (error) {
    return sendError(res, error, 'Unable to load permaculture site');
  }
};

exports.generatePlan = async (req, res) => {
  try {
    const site = await ownedSite(req.params.siteId, req);
    if (site.nft?.state === 'minted') {
      throw new ControllerError(
        'A minted design is immutable; create a new site version for a new plan',
        409,
        'PERMACULTURE_MINTED_DESIGN_IMMUTABLE'
      );
    }
    const plan = await generatePermaculturePlan(site);
    site.aiPlans.push(plan);
    if (site.aiPlans.length > 5) site.aiPlans = site.aiPlans.slice(-5);
    site.status = 'active';
    // Any design change invalidates previously prepared NFT metadata.
    site.nft = { state: 'none', onChain: false };
    await site.save();
    return res.json({
      success: true,
      data: plain(site.aiPlans[site.aiPlans.length - 1]),
      disclosure: 'Preliminary AI-assisted design; human field review is required.'
    });
  } catch (error) {
    return sendError(res, error, 'Unable to generate permaculture plan');
  }
};

exports.prepareNft = async (req, res) => {
  try {
    const site = await ownedSite(req.params.siteId, req, true);
    const prepared = buildPermacultureNftMetadata(site);
    site.nft = {
      state: 'prepared',
      onChain: false,
      metadataHash: prepared.metadataHash,
      metadata: prepared.metadata,
      preparedAt: new Date()
    };
    await site.save();
    return res.json({
      success: true,
      data: {
        state: 'prepared',
        onChain: false,
        metadataHash: prepared.metadataHash,
        metadata: prepared.metadata
      },
      disclosure: 'Metadata prepared off-chain; no NFT was minted.'
    });
  } catch (error) {
    return sendError(res, error, 'Unable to prepare permaculture NFT metadata');
  }
};

exports.simulateNft = async (req, res) => {
  try {
    const site = await ownedSite(req.params.siteId, req, true);
    const prepared = buildPermacultureNftMetadata(site);
    const simulation = simulatePermacultureNft(prepared.metadataHash);
    site.nft = {
      ...simulation,
      metadata: prepared.metadata,
      preparedAt: new Date()
    };
    await site.save();
    return res.json({
      success: true,
      data: { ...simulation, metadata: prepared.metadata },
      disclosure: 'Development simulation only; no blockchain transaction was sent.'
    });
  } catch (error) {
    return sendError(res, error, 'Unable to simulate permaculture NFT');
  }
};

exports.getNftMetadata = async (req, res) => {
  try {
    const site = await PermacultureSite.findOne({
      isPublic: true,
      'nft.metadataHash': req.params.metadataHash
    });
    if (!site || !site.nft?.metadata) {
      return res.status(404).json({ success: false, error: 'NFT metadata not found' });
    }
    return res.json({
      success: true,
      data: {
        state: site.nft.state,
        onChain: site.nft.onChain === true,
        tokenId: site.nft.tokenId,
        metadataHash: site.nft.metadataHash,
        metadata: site.nft.metadata
      }
    });
  } catch (error) {
    return sendError(res, error, 'Unable to load permaculture NFT metadata');
  }
};

exports.getPrivateLocation = async (req, res) => {
  try {
    const site = await ownedSite(req.params.siteId, req, true);
    const payload = site.privateLocation && typeof site.privateLocation.toObject === 'function'
      ? site.privateLocation.toObject()
      : site.privateLocation;
    return res.json({
      success: true,
      data: {
        location: payload ? decryptExactLocation(payload) : null,
        visibility: site.location && site.location.visibility,
        consentVersion: site.location && site.location.consentVersion,
        consentedAt: site.location && site.location.consentedAt
      }
    });
  } catch (error) {
    return sendError(res, error, 'Unable to load private site location');
  }
};

exports.publicSite = publicSite;
