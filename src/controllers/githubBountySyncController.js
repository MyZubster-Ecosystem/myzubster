const crypto = require('crypto');
const GitHubBounty = require('../models/githubBountyModel');
const githubSync = require('../services/githubBountySyncService');

function verifyWebhookSignature(req) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return {
      ok: false,
      status: 503,
      error: 'GITHUB_WEBHOOK_SECRET is not configured'
    };
  }

  const signature = req.get('x-hub-signature-256');
  if (!signature || !req.rawBody) {
    return {
      ok: false,
      status: 401,
      error: 'Missing GitHub webhook signature or raw body'
    };
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex')}`;

  const receivedBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (receivedBuffer.length !== expectedBuffer.length) {
    return { ok: false, status: 401, error: 'Invalid GitHub webhook signature' };
  }

  const ok = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  return ok
    ? { ok: true }
    : { ok: false, status: 401, error: 'Invalid GitHub webhook signature' };
}

function buildFilter(req, includePrivate = false) {
  const filter = {};

  if (!includePrivate) filter.sourceVisibility = 'public';
  if (req.query.repository) filter.repository = req.query.repository;
  if (req.query.status) filter.lifecycleStatus = req.query.status;
  if (req.query.state) filter.githubState = req.query.state;
  if (req.query.visibility && includePrivate) filter.sourceVisibility = req.query.visibility;

  if (req.query.tracked !== undefined) {
    filter.tracked = String(req.query.tracked) !== 'false';
  } else {
    filter.tracked = true;
  }

  if (req.query.rewardAsset) {
    filter.rewardAssets = String(req.query.rewardAsset).toUpperCase();
  }

  return filter;
}

async function listWithVisibility(req, res, includePrivate) {
  try {
    const filter = buildFilter(req, includePrivate);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);

    const bounties = await GitHubBounty.find(filter)
      .sort({ sourceUpdatedAt: -1, updatedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      ok: true,
      count: bounties.length,
      includesPrivate: includePrivate,
      bounties
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

exports.list = (req, res) => listWithVisibility(req, res, false);
exports.listAdmin = (req, res) => listWithVisibility(req, res, true);

async function getOneWithVisibility(req, res, includePrivate) {
  try {
    const repository = String(req.query.repository || '').trim();
    const issueNumber = Number(req.params.issueNumber);

    if (!repository || !Number.isInteger(issueNumber)) {
      return res.status(400).json({
        ok: false,
        error: 'repository query parameter and integer issueNumber are required'
      });
    }

    const filter = {
      sourceKey: `${repository}#${issueNumber}`
    };

    if (!includePrivate) filter.sourceVisibility = 'public';

    const bounty = await GitHubBounty.findOne(filter).lean();

    if (!bounty) {
      return res.status(404).json({ ok: false, error: 'GitHub bounty not found' });
    }

    res.json({ ok: true, bounty });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

exports.getOne = (req, res) => getOneWithVisibility(req, res, false);
exports.getOneAdmin = (req, res) => getOneWithVisibility(req, res, true);

exports.stats = async (req, res) => {
  try {
    const publicMatch = { sourceVisibility: 'public' };

    const [byStatus, byAsset, repositories, total, tracked] = await Promise.all([
      GitHubBounty.aggregate([
        { $match: publicMatch },
        { $group: { _id: '$lifecycleStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      GitHubBounty.aggregate([
        { $match: publicMatch },
        { $unwind: { path: '$rewardAssets', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$rewardAssets', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      GitHubBounty.aggregate([
        { $match: { ...publicMatch, tracked: true } },
        { $group: { _id: '$repository', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      GitHubBounty.countDocuments(publicMatch),
      GitHubBounty.countDocuments({ ...publicMatch, tracked: true })
    ]);

    res.json({
      ok: true,
      total,
      tracked,
      byStatus,
      byAsset,
      repositories
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

exports.sync = async (req, res) => {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return res.status(503).json({
        ok: false,
        error: 'GITHUB_TOKEN is required for organization-wide sync, including private repositories'
      });
    }

    const result = await githubSync.syncOrganizationBounties();
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
};

exports.webhook = async (req, res) => {
  try {
    const signature = verifyWebhookSignature(req);
    if (!signature.ok) {
      return res.status(signature.status).json({ ok: false, error: signature.error });
    }

    const eventName = req.get('x-github-event');
    const deliveryId = req.get('x-github-delivery') || null;

    const result = await githubSync.processWebhook(eventName, req.body);

    res.status(200).json({
      ok: true,
      deliveryId,
      event: eventName,
      result
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

exports.verifyWebhookSignature = verifyWebhookSignature;
