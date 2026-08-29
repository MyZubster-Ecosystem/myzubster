'use strict';

const {
  ECONOMIC_ENTRY_TYPES,
  ECONOMIC_SOURCE_TYPES,
  ZorgaxEconomicLedgerEntry
} = require('../models/ZorgaxEconomicLedgerEntry');

function requireNonEmptyString(value, field) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function requireSafePositiveInteger(value, field) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${field} must be a positive safe integer`);
  }
  return parsed;
}

function normalizeAsset(value) {
  const asset = requireNonEmptyString(value, 'asset').toUpperCase();
  if (!/^[A-Z0-9_]{2,12}$/.test(asset)) {
    throw new Error('asset must contain only A-Z, 0-9 or underscore and be 2-12 characters long');
  }
  return asset;
}

function normalizeNetwork(value) {
  if (value === undefined || value === null || value === '') return null;
  return requireNonEmptyString(value, 'network');
}

function validateEntryType(value) {
  if (!Object.values(ECONOMIC_ENTRY_TYPES).includes(value)) {
    throw new Error('unsupported economic entry type');
  }
  return value;
}

function validateSourceType(value) {
  if (!Object.values(ECONOMIC_SOURCE_TYPES).includes(value)) {
    throw new Error('unsupported economic source type');
  }
  return value;
}

function publicEconomicEntry(entry) {
  if (!entry) return null;
  const row = typeof entry.toObject === 'function' ? entry.toObject() : entry;
  return {
    entryId: row.entryId,
    ownerId: row.ownerId,
    type: row.type,
    asset: row.asset,
    network: row.network || null,
    amountMinor: row.amountMinor,
    sourceType: row.sourceType,
    sourceReference: row.sourceReference,
    description: row.description || null,
    occurredAt: row.occurredAt,
    metadata: row.metadata || {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

async function findExistingSource({
  LedgerModel,
  ownerId,
  asset,
  network,
  sourceType,
  sourceReference
}) {
  return LedgerModel.findOne({
    ownerId,
    asset,
    network,
    sourceType,
    sourceReference
  });
}

async function recordEconomicEntry({
  LedgerModel = ZorgaxEconomicLedgerEntry,
  ownerId,
  type,
  asset,
  network = null,
  amountMinor,
  sourceType,
  sourceReference,
  description = null,
  occurredAt = new Date(),
  metadata = {}
}) {
  if (!LedgerModel || typeof LedgerModel.findOne !== 'function' || typeof LedgerModel.create !== 'function') {
    throw new Error('LedgerModel is required');
  }

  const normalizedOwnerId = requireNonEmptyString(ownerId, 'ownerId');
  const normalizedType = validateEntryType(type);
  const normalizedAsset = normalizeAsset(asset);
  const normalizedNetwork = normalizeNetwork(network);
  const normalizedAmountMinor = requireSafePositiveInteger(amountMinor, 'amountMinor');
  const normalizedSourceType = validateSourceType(sourceType);
  const normalizedSourceReference = requireNonEmptyString(sourceReference, 'sourceReference');
  const normalizedDescription = description === undefined || description === null || description === ''
    ? null
    : requireNonEmptyString(description, 'description');
  const normalizedOccurredAt = new Date(occurredAt);
  if (Number.isNaN(normalizedOccurredAt.getTime())) throw new Error('occurredAt must be a valid date');

  const key = {
    LedgerModel,
    ownerId: normalizedOwnerId,
    asset: normalizedAsset,
    network: normalizedNetwork,
    sourceType: normalizedSourceType,
    sourceReference: normalizedSourceReference
  };

  const existing = await findExistingSource(key);
  if (existing) {
    if (existing.type !== normalizedType || existing.amountMinor !== normalizedAmountMinor) {
      throw new Error('economic source reference already exists with different accounting data');
    }
    return publicEconomicEntry(existing);
  }

  try {
    const created = await LedgerModel.create({
      ownerId: normalizedOwnerId,
      type: normalizedType,
      asset: normalizedAsset,
      network: normalizedNetwork,
      amountMinor: normalizedAmountMinor,
      sourceType: normalizedSourceType,
      sourceReference: normalizedSourceReference,
      description: normalizedDescription,
      occurredAt: normalizedOccurredAt,
      metadata: metadata || {}
    });
    return publicEconomicEntry(created);
  } catch (error) {
    if (error && error.code === 11000) {
      const raced = await findExistingSource(key);
      if (raced && raced.type === normalizedType && raced.amountMinor === normalizedAmountMinor) {
        return publicEconomicEntry(raced);
      }
    }
    throw error;
  }
}

module.exports = {
  normalizeAsset,
  normalizeNetwork,
  publicEconomicEntry,
  recordEconomicEntry,
  requireNonEmptyString,
  requireSafePositiveInteger,
  validateEntryType,
  validateSourceType
};
