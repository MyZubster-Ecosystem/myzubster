const fs = require('fs');
const path = require('path');

const registryPath = path.resolve(__dirname, '../../../config/dao/life-participants.json');

const LIFE_DAO_POLICY = Object.freeze({
  version: '2026-08-28',
  governanceLane: 'life-advisory',
  governanceMode: 'advisory_non_binding',
  bindingVotingPower: 0,
  roles: ['life_observer', 'life_advisor'],
  allowedScopes: [
    'pilot_technical',
    'kpi_mrv',
    'evidence_quality',
    'data_governance',
    'replication',
    'community_feedback',
  ],
  prohibitedScopes: [
    'treasury',
    'payment_execution',
    'life_budget',
    'cofinancing_commitment',
    'grant_agreement',
    'consortium_agreement',
    'legal_commitment',
  ],
  activation: {
    requiresExplicitConsent: true,
    requiresPublicDisplayConsent: true,
    requiresMaintainerReview: true,
    withdrawalSupported: true,
  },
});

function loadLifeDaoRegistry() {
  return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

function publicParticipant(participant) {
  return {
    memberId: participant.memberId,
    displayName: participant.displayName,
    organization: participant.organization || null,
    daoRole: participant.daoRole,
    status: participant.status,
    advisoryScopes: Array.isArray(participant.advisoryScopes) ? participant.advisoryScopes : [],
    bindingVotingPower: 0,
    consentEvidence: participant.consentEvidence || null,
  };
}

function isLifeAdvisoryIdentity(memberId, registry = loadLifeDaoRegistry()) {
  if (!memberId || !registry || !Array.isArray(registry.participants)) return false;

  return registry.participants.some((participant) => {
    if (!participant || participant.memberId !== memberId) return false;
    if (!LIFE_DAO_POLICY.roles.includes(participant.daoRole)) return false;
    return participant.status !== 'withdrawn';
  });
}

function getLifeDaoPublicState() {
  const registry = loadLifeDaoRegistry();
  const participants = (registry.participants || []).map(publicParticipant);
  const activeParticipants = participants.filter((participant) => participant.status === 'active');
  const pendingConsent = participants.filter((participant) => participant.status === 'pending_consent');

  return {
    ...LIFE_DAO_POLICY,
    enrollment: registry.enrollment,
    participants,
    roleSlots: registry.roleSlots || [],
    counts: {
      activeParticipants: activeParticipants.length,
      pendingConsent: pendingConsent.length,
      totalRegistered: participants.length,
    },
  };
}

function getLifeBindingRestriction(method, routePath, body = {}, registry = loadLifeDaoRegistry()) {
  const normalizedMethod = String(method || '').toUpperCase();

  if ((normalizedMethod === 'POST' || normalizedMethod === 'PUT') && routePath === '/vote') {
    if (isLifeAdvisoryIdentity(body.voterId, registry)) {
      return {
        code: 'LIFE_ADVISORY_NON_BINDING',
        message: 'LIFE Observer/Advisor identities cannot cast binding DAO votes.',
      };
    }
  }

  if (normalizedMethod === 'POST' && routePath === '/delegate') {
    if (
      isLifeAdvisoryIdentity(body.delegatorId, registry) ||
      isLifeAdvisoryIdentity(body.delegateId, registry)
    ) {
      return {
        code: 'LIFE_ADVISORY_NON_BINDING',
        message: 'LIFE Observer/Advisor identities cannot give or receive binding DAO delegation.',
      };
    }
  }

  return null;
}

function lifeDaoBindingGuard(req, res, next) {
  const restriction = getLifeBindingRestriction(req.method, req.path || '', req.body || {});

  if (restriction) {
    return res.status(403).json({
      success: false,
      ...restriction,
    });
  }

  return next();
}

module.exports = {
  LIFE_DAO_POLICY,
  getLifeDaoPublicState,
  getLifeBindingRestriction,
  isLifeAdvisoryIdentity,
  lifeDaoBindingGuard,
  loadLifeDaoRegistry,
};
