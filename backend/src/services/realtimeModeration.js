const crypto = require('crypto');
const mongoose = require('mongoose');
const InteractionControl = require('../models/InteractionControl');
const ModerationReport = require('../models/ModerationReport');
const ModerationEvent = require('../models/ModerationEvent');

const EVENT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const REPORT_WINDOW_MS = 60 * 1000;
const REPORT_LIMIT = 5;
const reportBursts = new Map();

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function cleanText(value, maxLength = 500) {
  return String(value || '').replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}

function allowReport(userId) {
  const now = Date.now();
  const key = String(userId);
  const recent = (reportBursts.get(key) || []).filter((at) => now - at < REPORT_WINDOW_MS);
  if (recent.length >= REPORT_LIMIT) {
    reportBursts.set(key, recent);
    return false;
  }
  recent.push(now);
  reportBursts.set(key, recent);
  return true;
}

async function appendEvent({ type, actorUserId, targetUserId = null, action, contextType = null, contextId = null, metadata = {} }) {
  return ModerationEvent.create({
    eventId: crypto.randomUUID(),
    type,
    actorUserId: String(actorUserId),
    targetUserId: targetUserId ? String(targetUserId) : null,
    action,
    contextType,
    contextId,
    metadata,
    expiresAt: new Date(Date.now() + EVENT_RETENTION_MS)
  });
}

async function setInteractionControl({ ownerUserId, targetUserId, kind, active }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Moderation storage unavailable' };
  if (!['block', 'mute'].includes(kind)) return { valid: false, status: 400, error: 'Invalid control kind' };
  if (!targetUserId || String(ownerUserId) === String(targetUserId)) return { valid: false, status: 400, error: 'Invalid target user' };
  const control = await InteractionControl.findOneAndUpdate(
    { ownerUserId: String(ownerUserId), targetUserId: String(targetUserId), kind },
    { $set: { active: Boolean(active) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await appendEvent({ type: 'control_changed', actorUserId: ownerUserId, targetUserId, action: `${kind}:${control.active ? 'on' : 'off'}` });
  return { valid: true, status: 200, control: { targetUserId: control.targetUserId, kind: control.kind, active: control.active } };
}

async function deliveryDecision({ senderUserId, recipientUserId }) {
  if (!databaseAvailable()) return { allowed: false, status: 'unavailable', reason: 'moderation-storage-unavailable' };
  const controls = await InteractionControl.find({
    active: true,
    $or: [
      { ownerUserId: String(recipientUserId), targetUserId: String(senderUserId), kind: 'block' },
      { ownerUserId: String(recipientUserId), targetUserId: String(senderUserId), kind: 'mute' },
      { ownerUserId: String(senderUserId), targetUserId: String(recipientUserId), kind: 'block' }
    ]
  }).lean();
  const hasBlock = controls.some((row) => row.kind === 'block');
  if (hasBlock) return { allowed: false, status: 'blocked', reason: 'block-policy' };
  const mutedByRecipient = controls.some((row) => row.kind === 'mute' && row.ownerUserId === String(recipientUserId));
  return mutedByRecipient
    ? { allowed: false, status: 'muted', reason: 'recipient-mute' }
    : { allowed: true, status: 'allowed', reason: null };
}

async function createReport({ reporterUserId, targetUserId = null, contextType, contextId, reason }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Moderation storage unavailable' };
  if (!allowReport(reporterUserId)) return { valid: false, status: 429, error: 'Report rate limit exceeded' };
  if (!['message', 'user', 'session'].includes(contextType)) return { valid: false, status: 400, error: 'Invalid report context' };
  const safeContextId = cleanText(contextId, 160);
  const safeReason = cleanText(reason, 500);
  if (!safeContextId || !safeReason) return { valid: false, status: 400, error: 'Report context and reason are required' };
  const report = await ModerationReport.create({
    reportId: crypto.randomUUID(),
    reporterUserId: String(reporterUserId),
    targetUserId: targetUserId ? String(targetUserId) : null,
    contextType,
    contextId: safeContextId,
    reason: safeReason
  });
  await appendEvent({ type: 'report_created', actorUserId: reporterUserId, targetUserId, action: 'report', contextType, contextId: safeContextId, metadata: { reportId: report.reportId } });
  return { valid: true, status: 201, report: { id: report.reportId, contextType, contextId: safeContextId, status: report.status } };
}

async function moderationAction({ moderatorUserId, moderatorRole, targetUserId = null, action, contextType = null, contextId = null }) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Moderation storage unavailable' };
  if (!['admin', 'moderator'].includes(String(moderatorRole || ''))) return { valid: false, status: 403, error: 'Moderator capability required' };
  const allowedActions = new Set(['warn', 'remove_content', 'mute', 'suspend', 'escalate']);
  if (!allowedActions.has(action)) return { valid: false, status: 400, error: 'Invalid moderation action' };
  const event = await appendEvent({ type: 'moderation_action', actorUserId: moderatorUserId, targetUserId, action, contextType, contextId: cleanText(contextId, 160) || null });
  return { valid: true, status: 200, event: { id: event.eventId, action, targetUserId: targetUserId || null, createdAt: event.createdAt } };
}

async function listModerationEvents({ after }) {
  if (!databaseAvailable()) return { status: 'unavailable', events: [], retryRecommended: true };
  const cursor = after ? new Date(after) : new Date(0);
  const events = await ModerationEvent.find({ createdAt: { $gt: cursor } }).sort({ createdAt: 1 }).limit(100).lean();
  return {
    status: 'ok',
    transport: 'persistent-polling',
    events: events.map((event) => ({
      id: event.eventId,
      type: event.type,
      action: event.action,
      targetUserId: event.targetUserId,
      contextType: event.contextType,
      contextId: event.contextId,
      createdAt: event.createdAt
    })),
    cursor: events.length ? events[events.length - 1].createdAt.toISOString() : cursor.toISOString()
  };
}

module.exports = {
  EVENT_RETENTION_MS,
  REPORT_LIMIT,
  REPORT_WINDOW_MS,
  setInteractionControl,
  deliveryDecision,
  createReport,
  moderationAction,
  listModerationEvents
};
