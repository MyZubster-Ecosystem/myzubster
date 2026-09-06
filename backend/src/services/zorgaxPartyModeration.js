const crypto = require('crypto');
const mongoose = require('mongoose');
const PartyReport = require('../models/PartyReport');
const PartyModerationAudit = require('../models/PartyModerationAudit');

const REPORT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const AUDIT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const TARGET_TYPES = new Set(['user', 'message', 'session', 'room']);
const REASONS = new Set(['spam', 'harassment', 'unsafe-content', 'impersonation', 'other']);
const MODERATOR_ACTIONS = new Map([
  ['mark-reviewed', 'reviewed'],
  ['escalate', 'escalated'],
  ['dismiss', 'dismissed']
]);

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/[<>\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength);
}

function publicReport(report) {
  const value = typeof report?.toObject === 'function' ? report.toObject() : report;
  return {
    reportId: value.reportId,
    worldId: value.worldId,
    targetType: value.targetType,
    targetId: value.targetId,
    reason: value.reason,
    details: value.details,
    status: value.status,
    createdAt: value.createdAt instanceof Date ? value.createdAt.toISOString() : value.createdAt,
    reviewedAt: value.reviewedAt instanceof Date ? value.reviewedAt.toISOString() : value.reviewedAt
  };
}

async function createPartyReport({ reporterUserId, targetType, targetId, reason, details }) {
  if (!databaseAvailable()) {
    return { valid: false, status: 503, error: 'Moderation storage is temporarily unavailable' };
  }

  const normalizedTargetType = cleanText(targetType, 24);
  const normalizedTargetId = cleanText(targetId, 160);
  const normalizedReason = cleanText(reason, 32);
  const normalizedDetails = cleanText(details, 500);

  if (!reporterUserId) return { valid: false, status: 401, error: 'Authentication required' };
  if (!TARGET_TYPES.has(normalizedTargetType)) return { valid: false, status: 400, error: 'Unsupported report target type' };
  if (!normalizedTargetId) return { valid: false, status: 400, error: 'Report target is required' };
  if (!REASONS.has(normalizedReason)) return { valid: false, status: 400, error: 'Unsupported report reason' };

  const now = new Date();
  const report = await PartyReport.create({
    reportId: crypto.randomUUID(),
    reporterUserId: String(reporterUserId),
    worldId: 'neon-plaza',
    targetType: normalizedTargetType,
    targetId: normalizedTargetId,
    reason: normalizedReason,
    details: normalizedDetails,
    status: 'open',
    expiresAt: new Date(now.getTime() + REPORT_RETENTION_MS)
  });

  return { valid: true, status: 201, report: publicReport(report) };
}

async function moderationSummary({ actorRole }) {
  if (actorRole !== 'admin') return { valid: false, status: 403, error: 'Moderator role required' };
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Moderation storage is temporarily unavailable' };

  const [open, reviewed, escalated, dismissed, recent] = await Promise.all([
    PartyReport.countDocuments({ worldId: 'neon-plaza', status: 'open' }),
    PartyReport.countDocuments({ worldId: 'neon-plaza', status: 'reviewed' }),
    PartyReport.countDocuments({ worldId: 'neon-plaza', status: 'escalated' }),
    PartyReport.countDocuments({ worldId: 'neon-plaza', status: 'dismissed' }),
    PartyReport.find({ worldId: 'neon-plaza' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-_id reportId worldId targetType targetId reason details status createdAt reviewedAt')
      .lean()
  ]);

  return {
    valid: true,
    status: 200,
    summary: {
      counts: { open, reviewed, escalated, dismissed },
      reports: recent.map(publicReport),
      signals: { spamDetection: 'not-modeled' },
      controls: {
        blockMuteEnforcement: 'not-yet-enforced',
        permanentBanCapability: false,
        humanReviewRequiredForMaterialEnforcement: true
      }
    }
  };
}

async function reviewPartyReport({ actorUserId, actorRole, reportId, action, note }) {
  if (actorRole !== 'admin') return { valid: false, status: 403, error: 'Moderator role required' };
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Moderation storage is temporarily unavailable' };

  const normalizedAction = cleanText(action, 32);
  if (!MODERATOR_ACTIONS.has(normalizedAction)) {
    return { valid: false, status: 400, error: 'Unsupported moderation action' };
  }

  const report = await PartyReport.findOne({ reportId: cleanText(reportId, 80), worldId: 'neon-plaza' });
  if (!report) return { valid: false, status: 404, error: 'Report not found' };

  const fromStatus = report.status;
  const toStatus = MODERATOR_ACTIONS.get(normalizedAction);
  report.status = toStatus;
  report.reviewedByUserId = String(actorUserId);
  report.reviewedAt = new Date();
  await report.save();

  await PartyModerationAudit.create({
    auditId: crypto.randomUUID(),
    reportId: report.reportId,
    moderatorUserId: String(actorUserId),
    action: normalizedAction,
    fromStatus,
    toStatus,
    note: cleanText(note, 500),
    expiresAt: new Date(Date.now() + AUDIT_RETENTION_MS)
  });

  return { valid: true, status: 200, report: publicReport(report), action: normalizedAction };
}

function moderationCapabilities() {
  return {
    reportReasons: Array.from(REASONS),
    targetTypes: Array.from(TARGET_TYPES),
    moderatorActions: Array.from(MODERATOR_ACTIONS.keys()),
    autonomousPermanentBan: false,
    blockMuteEnforcement: 'not-yet-enforced',
    spamDetection: 'not-modeled',
    retention: {
      reportsDays: REPORT_RETENTION_MS / (24 * 60 * 60 * 1000),
      auditDays: AUDIT_RETENTION_MS / (24 * 60 * 60 * 1000)
    }
  };
}

module.exports = {
  createPartyReport,
  moderationSummary,
  reviewPartyReport,
  moderationCapabilities
};
