'use strict';

const { PROJECT_STATUSES, ZorgaxDigitalProductProject } = require('../models/ZorgaxDigitalProductProject');
const ideaValidationServiceDefault = require('./zorgaxDigitalIdeaValidationService');
const productBlueprintServiceDefault = require('./zorgaxDigitalProductBlueprintService');
const launchOfferServiceDefault = require('./zorgaxDigitalLaunchOfferService');
const metricsServiceDefault = require('./zorgaxDigitalProductMetricsService');

const STATUS_ORDER = Object.freeze([
  PROJECT_STATUSES.IDEA,
  PROJECT_STATUSES.VALIDATING,
  PROJECT_STATUSES.PLANNED,
  PROJECT_STATUSES.BUILDING,
  PROJECT_STATUSES.READY_TO_LAUNCH,
  PROJECT_STATUSES.LAUNCHED,
  PROJECT_STATUSES.MEASURING
]);

function requireNonEmptyString(value, field) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function normalizeStringArray(value, field) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value.map((item) => requireNonEmptyString(item, field));
}

function publicProject(item) {
  const row = typeof item?.toObject === 'function' ? item.toObject() : item;
  if (!row) return null;
  const { _id, __v, ...rest } = row;
  return rest;
}

async function createProject({ ProjectModel = ZorgaxDigitalProductProject, ownerId, title, description, productType, targetCustomer = '', customerProblem = '', valueProposition = '', metadata = {} }) {
  const item = await ProjectModel.create({ ownerId: requireNonEmptyString(ownerId, 'ownerId'), title: requireNonEmptyString(title, 'title'), description: requireNonEmptyString(description, 'description'), productType: requireNonEmptyString(productType, 'productType'), targetCustomer: String(targetCustomer || '').trim(), customerProblem: String(customerProblem || '').trim(), valueProposition: String(valueProposition || '').trim(), advisoryOnly: true, humanApprovalRequired: true, metadata: metadata && typeof metadata === 'object' ? metadata : {} });
  return publicProject(item);
}

async function listProjects({ ProjectModel = ZorgaxDigitalProductProject, ownerId, limit = 100 }) {
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 100, 250));
  const rows = await ProjectModel.find({ ownerId: requireNonEmptyString(ownerId, 'ownerId') }).sort({ createdAt: -1 }).limit(boundedLimit).lean();
  return rows.map(publicProject);
}

async function getProject({ ProjectModel = ZorgaxDigitalProductProject, ownerId, projectId }) {
  const item = await ProjectModel.findOne({ ownerId: requireNonEmptyString(ownerId, 'ownerId'), projectId: requireNonEmptyString(projectId, 'projectId') });
  if (!item) throw new Error('digital product project not found');
  return item;
}

function buildAdvisoryPlan(project) {
  const missing = [];
  if (!project.targetCustomer) missing.push('Define the target customer precisely.');
  if (!project.customerProblem) missing.push('Define the customer problem the product solves.');
  if (!project.valueProposition) missing.push('Write a clear value proposition.');
  return { projectId: project.projectId, status: project.status, advisoryOnly: true, requiresHumanApproval: true, commercializationGuarantee: false, nextActions: [...missing, 'Validate demand with real prospective customers before scaling production.', 'Define the smallest sellable version of the product.', 'Choose a price hypothesis and test willingness to pay.', 'Prepare a launch page, FAQ and support plan before publishing.'], launchChecklist: ['Product scope approved by owner', 'Target customer and problem validated', 'Price approved by owner', 'Sales claims reviewed for accuracy', 'Landing page reviewed', 'Customer support channel prepared', 'Publication explicitly approved by owner'] };
}

async function getAdvisoryPlan(args) {
  const item = await getProject(args);
  return buildAdvisoryPlan(publicProject(item));
}

async function updateStrategy({ ProjectModel = ZorgaxDigitalProductProject, ownerId, projectId, targetCustomer, customerProblem, valueProposition, assumptions, evidence, risks, pricing }) {
  const item = await getProject({ ProjectModel, ownerId, projectId });
  if (targetCustomer !== undefined) item.targetCustomer = String(targetCustomer || '').trim();
  if (customerProblem !== undefined) item.customerProblem = String(customerProblem || '').trim();
  if (valueProposition !== undefined) item.valueProposition = String(valueProposition || '').trim();
  if (assumptions !== undefined) item.validation.assumptions = normalizeStringArray(assumptions, 'assumptions');
  if (evidence !== undefined) item.validation.evidence = normalizeStringArray(evidence, 'evidence');
  if (risks !== undefined) item.validation.risks = normalizeStringArray(risks, 'risks');
  if (pricing !== undefined) {
    if (!pricing || typeof pricing !== 'object') throw new Error('pricing must be an object');
    if (pricing.currency !== undefined) item.pricing.currency = requireNonEmptyString(pricing.currency, 'pricing.currency').toUpperCase();
    if (pricing.amountMinor !== undefined) {
      if (!Number.isSafeInteger(pricing.amountMinor) || pricing.amountMinor < 0) throw new Error('pricing.amountMinor must be a safe non-negative integer');
      item.pricing.amountMinor = pricing.amountMinor;
    }
  }
  await item.save();
  return publicProject(item);
}

async function validateProjectIdea({ ProjectModel = ZorgaxDigitalProductProject, ideaValidationService = ideaValidationServiceDefault, ownerId, projectId, now = new Date() }) {
  const item = await getProject({ ProjectModel, ownerId, projectId });
  const report = ideaValidationService.buildValidationReport(publicProject(item));
  item.validation.latestReport = report;
  item.validation.latestValidatedAt = now;
  if (item.status === PROJECT_STATUSES.IDEA) item.status = PROJECT_STATUSES.VALIDATING;
  await item.save();
  return { project: publicProject(item), report };
}

async function generateProductBlueprint({ ProjectModel = ZorgaxDigitalProductProject, productBlueprintService = productBlueprintServiceDefault, ownerId, projectId, now = new Date() }) {
  const item = await getProject({ ProjectModel, ownerId, projectId });
  const blueprint = productBlueprintService.buildProductBlueprint(publicProject(item));
  item.blueprint.latest = blueprint;
  item.blueprint.latestGeneratedAt = now;
  if (item.status === PROJECT_STATUSES.VALIDATING) item.status = PROJECT_STATUSES.PLANNED;
  await item.save();
  return { project: publicProject(item), blueprint };
}

async function generateLaunchOffer({ ProjectModel = ZorgaxDigitalProductProject, launchOfferService = launchOfferServiceDefault, ownerId, projectId, now = new Date() }) {
  const item = await getProject({ ProjectModel, ownerId, projectId });
  const launchOffer = launchOfferService.buildLaunchOffer(publicProject(item));
  item.launchOffer.latest = launchOffer;
  item.launchOffer.latestGeneratedAt = now;
  item.launchChecklist = launchOffer.launchChecklist;
  await item.save();
  return { project: publicProject(item), launchOffer };
}

async function recordProductMetric({ ProjectModel = ZorgaxDigitalProductProject, metricsService = metricsServiceDefault, ownerId, projectId, ...event }) {
  await getProject({ ProjectModel, ownerId, projectId });
  return metricsService.recordMetricEvent({ ownerId: String(ownerId), projectId, ...event });
}

async function getProductMetricSnapshot({ ProjectModel = ZorgaxDigitalProductProject, metricsService = metricsServiceDefault, ownerId, projectId, currency = null }) {
  await getProject({ ProjectModel, ownerId, projectId });
  return metricsService.getMetricSnapshot({ ownerId: String(ownerId), projectId, currency });
}

async function getProductLearningReport({ ProjectModel = ZorgaxDigitalProductProject, metricsService = metricsServiceDefault, ownerId, projectId, currency = null }) {
  const item = await getProject({ ProjectModel, ownerId, projectId });
  const snapshot = await metricsService.getMetricSnapshot({ ownerId: String(ownerId), projectId, currency });
  const report = metricsService.buildLearningReport(snapshot);
  if (item.status === PROJECT_STATUSES.LAUNCHED) {
    item.status = PROJECT_STATUSES.MEASURING;
    await item.save();
  }
  return { project: publicProject(item), snapshot, report };
}

async function advanceProject({ ProjectModel = ZorgaxDigitalProductProject, ownerId, projectId, nextStatus }) {
  const item = await getProject({ ProjectModel, ownerId, projectId });
  const normalized = requireNonEmptyString(nextStatus, 'nextStatus').toUpperCase();
  if (!STATUS_ORDER.includes(normalized)) throw new Error('invalid project status');
  const currentIndex = STATUS_ORDER.indexOf(item.status);
  const nextIndex = STATUS_ORDER.indexOf(normalized);
  if (nextIndex === currentIndex) return publicProject(item);
  if (nextIndex !== currentIndex + 1) throw new Error(`digital product project cannot advance from ${item.status} to ${normalized}`);
  item.status = normalized;
  await item.save();
  return publicProject(item);
}

module.exports = { STATUS_ORDER, advanceProject, buildAdvisoryPlan, createProject, generateLaunchOffer, generateProductBlueprint, getAdvisoryPlan, getProductLearningReport, getProductMetricSnapshot, getProject, listProjects, publicProject, recordProductMetric, updateStrategy, validateProjectIdea };
