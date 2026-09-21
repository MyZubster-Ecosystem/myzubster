const express = require('express');
const EcosystemActor = require('../models/EcosystemActor');
const EcosystemContribution = require('../models/EcosystemContribution');
const { authenticate, isAdmin } = require('../middleware/auth');
const { verifyContributionSource } = require('../services/githubEcosystemVerificationService');
const { buildGithubWorkEvidence } = require('../services/githubWorkEvidenceService');

const router = express.Router();

const FORBIDDEN_FINANCIAL_FIELDS = ['paid', 'paymentStatus', 'bountyStatus', 'rewardAmount', 'reward', 'settlement'];

function cleanString(value, maxLength = 300) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanList(value, maxItems = 100, maxLength = 500) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => cleanString(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

function rejectFinancialClaims(body = {}) {
  const found = FORBIDDEN_FINANCIAL_FIELDS.find(field => Object.prototype.hasOwnProperty.call(body, field));
  if (found) {
    const error = new Error(`${found} non appartiene al Contribution Graph; bounty e pagamenti sono verificati separatamente`);
    error.code = 'FINANCIAL_FIELD_REJECTED';
    throw error;
  }
}

function sourceStatus(source) {
  if (source.kind === 'pull_request') {
    if (source.merged) return 'merged';
    return source.sourceState === 'closed' ? 'closed' : 'opened';
  }
  if (source.kind === 'issue') return source.sourceState === 'closed' ? 'closed' : 'opened';
  return 'proposed';
}

function publicContribution(value) {
  const item = value?.toObject ? value.toObject() : value;
  return {
    contributionId: item.contributionId,
    actorIds: item.actorIds || [],
    projectId: item.projectId,
    title: item.title,
    description: item.description || '',
    status: item.status,
    github: item.github,
    evidenceRefs: item.evidenceRefs || [],
    githubWorkEvidence: item.githubWorkEvidence || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function managedActors(actorIds, req, res) {
  const ids = [...new Set(cleanList(actorIds, 20, 100))];
  if (!ids.length) {
    res.status(400).json({ success: false, message: 'Almeno un actorId è obbligatorio' });
    return null;
  }
  const actors = await EcosystemActor.find({ actorId: { $in: ids } });
  if (actors.length !== ids.length) {
    res.status(404).json({ success: false, message: 'Uno o più actor non esistono' });
    return null;
  }
  if (req.userRole !== 'admin') {
    const unauthorized = actors.find(actor => String(actor.createdBy) !== String(req.userId));
    if (unauthorized) {
      res.status(403).json({ success: false, message: 'Non puoi attribuire contributi ad actor che non gestisci' });
      return null;
    }
  }
  return actors;
}

async function managedContribution(req, res) {
  const contribution = await EcosystemContribution.findOne({ contributionId: req.params.contributionId });
  if (!contribution) {
    res.status(404).json({ success: false, message: 'Contributo non trovato' });
    return null;
  }
  if (req.userRole === 'admin') return contribution;
  const actors = await EcosystemActor.find({ actorId: { $in: contribution.actorIds } }).select('createdBy').lean();
  if (!actors.length || actors.some(actor => String(actor.createdBy) !== String(req.userId))) {
    res.status(403).json({ success: false, message: 'Permessi insufficienti per questo contributo' });
    return null;
  }
  return contribution;
}

function evidenceForCommit(source, actors, requested) {
  if (!requested || source.kind !== 'commit' || !source.committedAt) return {};
  const account = actors
    .map(actor => actor.github?.verification?.verifiedLogin || actor.github?.login)
    .find(Boolean);
  if (!account) return {};
  const evidence = buildGithubWorkEvidence({
    account,
    commits: [{
      sha: source.sha,
      repository: source.repository,
      url: source.url,
      committedAt: source.committedAt
    }]
  });
  return {
    evidenceHash: evidence.evidenceHash,
    algorithm: evidence.algorithm,
    commitment: evidence.commitment
  };
}

router.post('/contributions', authenticate, async (req, res) => {
  try {
    rejectFinancialClaims(req.body || {});
    const actors = await managedActors(req.body?.actorIds, req, res);
    if (!actors) return;

    const projectId = cleanString(req.body?.projectId, 200);
    const title = cleanString(req.body?.title, 240);
    if (!projectId || !title) return res.status(400).json({ success: false, message: 'projectId e title sono obbligatori' });

    const source = await verifyContributionSource(req.body?.github || {});
    const actorIds = actors.map(actor => actor.actorId);
    const dedupeKey = EcosystemContribution.buildDedupeKey({
      actorIds,
      projectId,
      sourceKey: source.sourceKey
    });
    const githubWorkEvidence = evidenceForCommit(source, actors, req.body?.createEvidence === true);

    const contribution = await EcosystemContribution.create({
      actorIds,
      projectId,
      title,
      description: cleanString(req.body?.description, 4000),
      status: sourceStatus(source),
      github: { ...source, verifiedAt: new Date() },
      evidenceRefs: cleanList(req.body?.evidenceRefs, 100, 500),
      githubWorkEvidence,
      dedupeKey,
      createdBy: req.userId,
      updatedBy: req.userId
    });

    return res.status(201).json({ success: true, contribution: publicContribution(contribution) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Questo contributo è già registrato per gli actor e il progetto indicati' });
    const status = error?.response?.status === 404 ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message || 'Contributo non registrato' });
  }
});

router.get('/contributions/:contributionId', async (req, res) => {
  const contribution = await EcosystemContribution.findOne({ contributionId: req.params.contributionId }).lean();
  if (!contribution) return res.status(404).json({ success: false, message: 'Contributo non trovato' });
  return res.json({ success: true, contribution: publicContribution(contribution) });
});

router.post('/contributions/:contributionId/refresh', authenticate, async (req, res) => {
  try {
    const contribution = await managedContribution(req, res);
    if (!contribution) return;

    const source = await verifyContributionSource({
      kind: contribution.github.kind,
      repository: contribution.github.repository,
      number: contribution.github.number,
      sha: contribution.github.sha,
      releaseTag: contribution.github.releaseTag
    });

    contribution.github = { ...source, verifiedAt: new Date() };
    if (contribution.status !== 'verified') contribution.status = sourceStatus(source);
    contribution.updatedBy = req.userId;
    await contribution.save();

    return res.json({ success: true, contribution: publicContribution(contribution) });
  } catch (error) {
    const status = error?.response?.status === 404 ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message || 'Refresh GitHub fallito' });
  }
});

router.post('/contributions/:contributionId/verify', authenticate, isAdmin, async (req, res) => {
  try {
    const contribution = await EcosystemContribution.findOne({ contributionId: req.params.contributionId });
    if (!contribution) return res.status(404).json({ success: false, message: 'Contributo non trovato' });

    const source = await verifyContributionSource({
      kind: contribution.github.kind,
      repository: contribution.github.repository,
      number: contribution.github.number,
      sha: contribution.github.sha,
      releaseTag: contribution.github.releaseTag
    });

    contribution.github = { ...source, verifiedAt: new Date() };
    contribution.status = 'verified';
    contribution.updatedBy = req.userId;
    await contribution.save();

    return res.json({ success: true, contribution: publicContribution(contribution) });
  } catch (error) {
    const status = error?.response?.status === 404 ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message || 'Verifica contributo fallita' });
  }
});

router.get('/actors/:actorId/contributions', async (req, res) => {
  const contributions = await EcosystemContribution.find({ actorIds: req.params.actorId }).sort({ createdAt: -1 }).limit(200).lean();
  return res.json({ success: true, actorId: req.params.actorId, count: contributions.length, contributions: contributions.map(publicContribution) });
});

router.get('/projects/:projectId/contributions', async (req, res) => {
  const contributions = await EcosystemContribution.find({ projectId: req.params.projectId }).sort({ createdAt: -1 }).limit(500).lean();
  return res.json({ success: true, projectId: req.params.projectId, count: contributions.length, contributions: contributions.map(publicContribution) });
});

router.get('/projects/:projectId/participants', async (req, res) => {
  const contributions = await EcosystemContribution.find({ projectId: req.params.projectId }).select('actorIds').lean();
  const actorIds = [...new Set(contributions.flatMap(item => item.actorIds || []))];
  const actors = await EcosystemActor.find({ actorId: { $in: actorIds } }).select('actorId type name slug github status -_id').sort({ name: 1 }).lean();
  return res.json({ success: true, projectId: req.params.projectId, count: actors.length, participants: actors });
});

router.get('/graph', async (req, res) => {
  const query = req.query.projectId ? { projectId: cleanString(req.query.projectId, 200) } : {};
  const contributions = await EcosystemContribution.find(query).sort({ createdAt: -1 }).limit(500).lean();
  const actorIds = [...new Set(contributions.flatMap(item => item.actorIds || []))];
  const actors = await EcosystemActor.find({ actorId: { $in: actorIds } }).select('actorId type name slug').lean();

  const nodes = [];
  const edges = [];
  const seenNodes = new Set();
  const addNode = node => {
    if (seenNodes.has(node.id)) return;
    seenNodes.add(node.id);
    nodes.push(node);
  };

  for (const actor of actors) addNode({ id: actor.actorId, kind: 'actor', type: actor.type, label: actor.name, slug: actor.slug });

  for (const contribution of contributions) {
    const contributionNode = `contribution:${contribution.contributionId}`;
    const projectNode = `project:${contribution.projectId}`;
    const repositoryNode = `repository:${contribution.github.repository}`;
    const sourceNode = `github:${contribution.github.sourceKey}`;

    addNode({ id: contributionNode, kind: 'contribution', label: contribution.title, status: contribution.status });
    addNode({ id: projectNode, kind: 'project', label: contribution.projectId });
    addNode({ id: repositoryNode, kind: 'repository', label: contribution.github.repository });
    addNode({ id: sourceNode, kind: 'github_source', sourceType: contribution.github.kind, label: contribution.github.title || contribution.github.sourceKey, url: contribution.github.url });

    for (const actorId of contribution.actorIds || []) edges.push({ from: actorId, to: contributionNode, relation: 'CONTRIBUTED' });
    edges.push({ from: contributionNode, to: projectNode, relation: 'PART_OF_PROJECT' });
    edges.push({ from: contributionNode, to: sourceNode, relation: 'SUPPORTED_BY_GITHUB' });
    edges.push({ from: sourceNode, to: repositoryNode, relation: 'IN_REPOSITORY' });

    for (const evidenceRef of contribution.evidenceRefs || []) {
      const evidenceNode = `evidence:${evidenceRef}`;
      addNode({ id: evidenceNode, kind: 'evidence', label: evidenceRef });
      edges.push({ from: contributionNode, to: evidenceNode, relation: 'HAS_EVIDENCE' });
    }
    if (contribution.githubWorkEvidence?.evidenceHash) {
      const evidenceNode = `evidence:sha256:${contribution.githubWorkEvidence.evidenceHash}`;
      addNode({ id: evidenceNode, kind: 'evidence', algorithm: 'sha256', label: contribution.githubWorkEvidence.evidenceHash });
      edges.push({ from: contributionNode, to: evidenceNode, relation: 'HAS_GITHUB_WORK_EVIDENCE' });
    }
  }

  return res.json({
    success: true,
    schema: 'myzubster.contribution-graph.v1',
    projectId: req.query.projectId || null,
    nodes,
    edges,
    boundaries: {
      githubStateIsPaymentState: false,
      contributionStatusIsPaymentState: false,
      institutionalAffiliationInferred: false
    }
  });
});

module.exports = router;
module.exports.publicContribution = publicContribution;
module.exports.sourceStatus = sourceStatus;
module.exports.rejectFinancialClaims = rejectFinancialClaims;
