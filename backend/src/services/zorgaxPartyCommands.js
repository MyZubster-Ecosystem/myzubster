const crypto = require('crypto');
const mongoose = require('mongoose');
const ZorgaxPartyAudit = require('../models/ZorgaxPartyAudit');
const ZorgaxPartyNotice = require('../models/ZorgaxPartyNotice');
const { buildPartyTelemetry, summarizePartyTelemetry } = require('./zorgaxPartyTelemetry');

const ALLOWLIST = Object.freeze({
  request_session_status: Object.freeze({
    minRole: 'user',
    confirmationRequired: false,
    mutates: false
  }),
  publish_notice: Object.freeze({
    minRole: 'admin',
    confirmationRequired: true,
    mutates: true
  })
});

const ROLE_RANK = Object.freeze({ user: 1, admin: 2 });
const NOTICE_TTL_MS = 6 * 60 * 60 * 1000;

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function safeText(value, maxLength) {
  return String(value || '')
    .replace(/[<>\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength);
}

function publicAllowlist() {
  return Object.entries(ALLOWLIST).map(([command, config]) => ({
    command,
    confirmationRequired: config.confirmationRequired,
    mutates: config.mutates,
    minimumRole: config.minRole
  }));
}

function hasRole(actorRole, minimumRole) {
  return (ROLE_RANK[actorRole] || 0) >= (ROLE_RANK[minimumRole] || Number.MAX_SAFE_INTEGER);
}

function validateCommandRequest({ command, actorUserId, actorRole, confirmed, idempotencyKey, payload }) {
  const config = ALLOWLIST[command];
  if (!config) return { valid: false, status: 400, error: 'Command is not allowlisted' };
  if (!actorUserId) return { valid: false, status: 401, error: 'Authentication required' };
  if (!hasRole(actorRole, config.minRole)) return { valid: false, status: 403, error: 'Insufficient capability' };
  if (config.confirmationRequired && confirmed !== true) {
    return { valid: false, status: 409, error: 'Explicit confirmation required' };
  }
  const key = safeText(idempotencyKey, 128);
  if (!key) return { valid: false, status: 400, error: 'Idempotency key is required' };

  if (command === 'publish_notice') {
    const text = safeText(payload?.text, 280);
    if (!text) return { valid: false, status: 400, error: 'Notice text is required' };
  }

  return { valid: true, config, idempotencyKey: key };
}

async function findPrevious(actorUserId, idempotencyKey) {
  if (!databaseAvailable()) return null;
  return ZorgaxPartyAudit.findOne({ actorUserId, idempotencyKey }).lean();
}

async function writeAudit({ actorUserId, actorRole, command, idempotencyKey, outcome, resourceType = null, resourceId = null, reason = null }) {
  if (!databaseAvailable()) return null;
  const auditId = crypto.randomUUID();
  return ZorgaxPartyAudit.create({
    auditId,
    actorUserId,
    actorRole,
    command,
    idempotencyKey,
    outcome,
    resourceType,
    resourceId,
    reason
  });
}

async function executePartyCommand({ command, actorUserId, actorRole, confirmed = false, idempotencyKey, payload = {} }) {
  const validation = validateCommandRequest({ command, actorUserId, actorRole, confirmed, idempotencyKey, payload });
  if (!validation.valid) return validation;

  const previous = await findPrevious(actorUserId, validation.idempotencyKey);
  if (previous) {
    return {
      valid: true,
      status: 200,
      duplicate: true,
      command,
      outcome: previous.outcome,
      resource: previous.resourceType && previous.resourceId
        ? { type: previous.resourceType, id: previous.resourceId }
        : null
    };
  }

  if (command === 'request_session_status') {
    const telemetry = summarizePartyTelemetry(await buildPartyTelemetry());
    await writeAudit({
      actorUserId,
      actorRole,
      command,
      idempotencyKey: validation.idempotencyKey,
      outcome: 'executed',
      resourceType: 'party-telemetry',
      resourceId: 'neon-plaza'
    });
    return {
      valid: true,
      status: 200,
      command,
      outcome: 'executed',
      result: {
        status: telemetry.status,
        summary: telemetry.summary,
        telemetry: telemetry.telemetry
      }
    };
  }

  if (command === 'publish_notice') {
    if (!databaseAvailable()) {
      return { valid: false, status: 503, error: 'Notice storage unavailable' };
    }
    const noticeId = crypto.randomUUID();
    const notice = await ZorgaxPartyNotice.create({
      noticeId,
      text: safeText(payload.text, 280),
      publishedByUserId: actorUserId,
      expiresAt: new Date(Date.now() + NOTICE_TTL_MS)
    });
    await writeAudit({
      actorUserId,
      actorRole,
      command,
      idempotencyKey: validation.idempotencyKey,
      outcome: 'executed',
      resourceType: 'party-notice',
      resourceId: noticeId
    });
    return {
      valid: true,
      status: 200,
      command,
      outcome: 'executed',
      result: {
        notice: {
          id: notice.noticeId,
          text: notice.text,
          status: notice.status,
          createdAt: notice.createdAt,
          expiresAt: notice.expiresAt
        }
      }
    };
  }

  return { valid: false, status: 400, error: 'Command is not implemented' };
}

module.exports = {
  ALLOWLIST,
  publicAllowlist,
  validateCommandRequest,
  executePartyCommand
};
