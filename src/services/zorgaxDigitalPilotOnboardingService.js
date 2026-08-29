'use strict';

const { ENROLLMENT_STATUSES, ZorgaxDigitalPilotEnrollment } = require('../models/ZorgaxDigitalPilotEnrollment');
const { ZorgaxDigitalProductProject } = require('../models/ZorgaxDigitalProductProject');
const businessServiceDefault = require('./zorgaxDigitalBusinessService');
const ideaRankingDefault = require('./zorgaxDigitalPilotIdeaRankingService');

const CONSENT_VERSION = 'zorgax_life_pilot_v1';

function requireString(value, field) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function publicEnrollment(item) {
  const row = typeof item?.toObject === 'function' ? item.toObject() : item;
  if (!row) return null;
  const { _id, __v, ...rest } = row;
  return rest;
}

async function getEnrollment({ EnrollmentModel = ZorgaxDigitalPilotEnrollment, ownerId }) {
  const item = await EnrollmentModel.findOne({ ownerId: requireString(ownerId, 'ownerId') });
  if (!item) throw new Error('pilot enrollment not found');
  return item;
}

async function createInvitation({ EnrollmentModel = ZorgaxDigitalPilotEnrollment, ownerId, metadata = {} }) {
  const normalizedOwnerId = requireString(ownerId, 'ownerId');
  const existing = await EnrollmentModel.findOne({ ownerId: normalizedOwnerId });
  if (existing) return publicEnrollment(existing);
  const item = await EnrollmentModel.create({ ownerId: normalizedOwnerId, status: ENROLLMENT_STATUSES.INVITED, metadata, advisoryOnly: true, humanApprovalRequired: true });
  return publicEnrollment(item);
}

async function acceptInvitation({ EnrollmentModel = ZorgaxDigitalPilotEnrollment, ownerId, accepted, now = new Date() }) {
  if (accepted !== true) throw new Error('explicit pilot acceptance is required');
  const item = await getEnrollment({ EnrollmentModel, ownerId });
  if (item.status === ENROLLMENT_STATUSES.DECLINED) throw new Error('declined pilot enrollment cannot be accepted');
  item.consent.accepted = true;
  item.consent.acceptedAt = item.consent.acceptedAt || now;
  item.consent.version = CONSENT_VERSION;
  if (item.status === ENROLLMENT_STATUSES.INVITED) item.status = ENROLLMENT_STATUSES.ACCEPTED;
  await item.save();
  return publicEnrollment(item);
}

async function updateOnboarding({ EnrollmentModel = ZorgaxDigitalPilotEnrollment, ownerId, objective, weeklyCommitment, preferredProductType }) {
  const item = await getEnrollment({ EnrollmentModel, ownerId });
  if (!item.consent?.accepted) throw new Error('pilot acceptance is required before onboarding');
  if (objective !== undefined) item.objective = String(objective || '').trim();
  if (weeklyCommitment !== undefined) item.weeklyCommitment = String(weeklyCommitment || '').trim();
  if (preferredProductType !== undefined) item.preferredProductType = String(preferredProductType || '').trim();
  item.status = item.objective && item.weeklyCommitment ? ENROLLMENT_STATUSES.ACTIVE : ENROLLMENT_STATUSES.ONBOARDING;
  await item.save();
  return publicEnrollment(item);
}

async function rankCandidateIdeas({ EnrollmentModel = ZorgaxDigitalPilotEnrollment, ideaRankingService = ideaRankingDefault, ownerId, ideas }) {
  const item = await getEnrollment({ EnrollmentModel, ownerId });
  if (!item.consent?.accepted) throw new Error('pilot acceptance is required before idea ranking');
  if (!item.objective || !item.weeklyCommitment) throw new Error('pilot onboarding must be completed before idea ranking');
  return ideaRankingService.rankIdeas({ ideas, objective: item.objective, weeklyCommitment: item.weeklyCommitment });
}

async function startFirstProject({
  EnrollmentModel = ZorgaxDigitalPilotEnrollment,
  ProjectModel = ZorgaxDigitalProductProject,
  businessService = businessServiceDefault,
  ownerId,
  title,
  description,
  productType,
  targetCustomer = '',
  customerProblem = '',
  valueProposition = '',
  metadata = {}
}) {
  const item = await getEnrollment({ EnrollmentModel, ownerId });
  if (!item.consent?.accepted) throw new Error('pilot acceptance is required before first project');
  if (!item.objective || !item.weeklyCommitment) throw new Error('pilot onboarding must be completed before first project');

  if (item.firstProjectId) {
    const existing = await businessService.getProject({ ProjectModel, ownerId: String(ownerId), projectId: item.firstProjectId });
    return { enrollment: publicEnrollment(item), project: businessService.publicProject(existing), replay: true };
  }

  const project = await businessService.createProject({
    ProjectModel,
    ownerId: String(ownerId),
    title,
    description,
    productType: productType || item.preferredProductType,
    targetCustomer,
    customerProblem,
    valueProposition,
    metadata: {
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
      pilotProgram: 'LIFE',
      pilotEnrollmentId: item.enrollmentId,
      createdFromPilotOnboarding: true
    }
  });

  item.firstProjectId = project.projectId;
  item.status = ENROLLMENT_STATUSES.ACTIVE;
  await item.save();

  return { enrollment: publicEnrollment(item), project, replay: false };
}

function buildFirstSession(enrollment) {
  const row = publicEnrollment(enrollment);
  const missing = [];
  if (!row.consent?.accepted) missing.push('Accept the LIFE pilot invitation explicitly.');
  if (!row.objective) missing.push('Define one concrete learning/business objective for the pilot.');
  if (!row.weeklyCommitment) missing.push('Choose a realistic weekly time commitment.');
  if (!row.preferredProductType) missing.push('Choose an initial digital product type or leave it open for exploration.');
  return {
    version: 'zorgax_life_first_session_v1',
    enrollmentId: row.enrollmentId,
    status: row.status,
    firstProjectId: row.firstProjectId || null,
    readyForFirstProduct: Boolean(row.consent?.accepted && row.objective && row.weeklyCommitment),
    firstProductCreated: Boolean(row.firstProjectId),
    missing,
    sessionAgenda: [
      'Define the participant objective and constraints.',
      'Collect three candidate product ideas from interests, skills or authorized learning material.',
      'Rank candidate ideas as decision support, without treating the ranking as market proof.',
      'Select one idea explicitly for evidence-based validation.',
      'Define target customer, customer problem and smallest testable value proposition.',
      'Agree the next human action before the following session.'
    ],
    advisoryOnly: true,
    requiresHumanApproval: true,
    externalExecutionPerformed: false,
    publicationPerformed: false,
    spendingPerformed: false,
    predictsProfit: false
  };
}

async function getFirstSession(args) {
  const item = await getEnrollment(args);
  return buildFirstSession(item);
}

module.exports = {
  CONSENT_VERSION,
  acceptInvitation,
  buildFirstSession,
  createInvitation,
  getEnrollment,
  getFirstSession,
  publicEnrollment,
  rankCandidateIdeas,
  startFirstProject,
  updateOnboarding
};
