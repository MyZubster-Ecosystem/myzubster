const crypto = require('crypto');
const mongoose = require('mongoose');
const MetaverseChatMessage = require('../models/MetaverseChatMessage');
const MetaverseCharacter = require('../models/MetaverseCharacter');
const VirtualRoom = require('../models/VirtualRoom');
const VirtualSession = require('../models/VirtualSession');
const VirtualRoomChatThrottle = require('../models/VirtualRoomChatThrottle');
const VirtualRoomMessageReport = require('../models/VirtualRoomMessageReport');
const VirtualRoomReportThrottle = require('../models/VirtualRoomReportThrottle');

const ROOM_CHAT_RETENTION_MS = 24 * 60 * 60 * 1000;
const ROOM_CHAT_PAGE_SIZE = 50;
const ROOM_REPORT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const ROOM_REPORT_REASONS = new Set(['spam', 'harassment', 'unsafe', 'other']);
const ROOM_REPORT_RATE_LIMIT = 10;
const ROOM_REPORT_WINDOW_MS = 60 * 1000;

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function roomChatThrottleKey(roomId, sessionId, actorUserId) {
  return crypto.createHash('sha256')
    .update(`${roomId}:${sessionId}:${actorUserId}`)
    .digest('hex');
}

async function claimRoomChatWindow({ roomId, sessionId, actorUserId, now = new Date() }) {
  const key = roomChatThrottleKey(roomId, sessionId, actorUserId);
  try {
    await VirtualRoomChatThrottle.findOneAndUpdate(
      {
        key,
        $or: [
          { nextAllowedAt: { $lte: now } },
          { nextAllowedAt: { $exists: false } }
        ]
      },
      {
        $set: {
          nextAllowedAt: new Date(now.getTime() + 750),
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000)
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
}

function roomReportThrottleKey(roomId, sessionId, actorUserId, now = new Date()) {
  const bucket = Math.floor(now.getTime() / ROOM_REPORT_WINDOW_MS);
  return crypto.createHash('sha256')
    .update(`report:${roomId}:${sessionId}:${actorUserId}:${bucket}`)
    .digest('hex');
}

async function claimRoomReportSlot({ roomId, sessionId, actorUserId, now = new Date() }) {
  const key = roomReportThrottleKey(roomId, sessionId, actorUserId, now);
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { expiresAt: new Date(now.getTime() + (2 * ROOM_REPORT_WINDOW_MS)) }
  };
  let bucket;
  try {
    bucket = await VirtualRoomReportThrottle.findOneAndUpdate(
      { key },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    bucket = await VirtualRoomReportThrottle.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true });
  }
  return Boolean(bucket && bucket.count <= ROOM_REPORT_RATE_LIMIT);
}

function cleanRoomMessage(value) {
  return String(value || '').replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, 280);
}

function publicRoomMessage(value) {
  const message = typeof value?.toObject === 'function' ? value.toObject() : value;
  return {
    id: message.messageId,
    characterName: message.characterName,
    text: message.text,
    createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt
  };
}

function publicRoomMessageWithReportState(value, reportedMessageIds, actorUserId) {
  const message = publicRoomMessage(value);
  const source = typeof value?.toObject === 'function' ? value.toObject() : value;
  return {
    ...message,
    reportedByMe: reportedMessageIds.has(message.id),
    authoredByMe: Boolean(actorUserId && String(source.senderUserId) === String(actorUserId))
  };
}

async function authorizedContext(sessionId, actorUserId, requireLive = false) {
  if (!databaseAvailable()) return { valid: false, status: 503, error: 'Room chat storage unavailable' };
  const session = await VirtualSession.findOne({ sessionId: String(sessionId) });
  if (!session) return { valid: false, status: 404, error: 'Session not found' };
  const room = await VirtualRoom.findOne({ roomId: session.roomId });
  if (!room) return { valid: false, status: 404, error: 'Room not found' };
  const actor = String(actorUserId);
  const authorized = actor === String(session.hostUserId) || (session.participantUserIds || []).includes(actor);
  if (!authorized) return { valid: false, status: 403, error: 'Join session before accessing room chat' };
  if (requireLive && session.state !== 'live') return { valid: false, status: 409, error: 'Room chat is writable only during a live session' };
  if ((room.blockedUserIds || []).includes(actor)) return { valid: false, status: 403, error: 'Access blocked' };
  return { valid: true, session, room, actor };
}

function canModerateRoomChat(actorUserId, hostUserId, actorRole = 'user') {
  return Boolean(actorUserId && (actorRole === 'admin' || String(actorUserId) === String(hostUserId)));
}

async function deleteRoomMessage({ sessionId, messageId, actorUserId, actorRole }) {
  const context = await authorizedContext(sessionId, actorUserId);
  if (!context.valid) return context;
  if (!canModerateRoomChat(actorUserId, context.session.hostUserId, actorRole)) {
    return { valid: false, status: 403, error: 'Host capability required' };
  }
  const result = await MetaverseChatMessage.deleteOne({
    messageId: String(messageId),
    sessionId: context.session.sessionId,
    worldId: `virtual-room:${context.room.roomId}`
  });
  if (!result.deletedCount) return { valid: false, status: 404, error: 'Message not found' };
  return { valid: true, status: 200 };
}

async function reportRoomMessage({ sessionId, messageId, actorUserId, reason }) {
  const context = await authorizedContext(sessionId, actorUserId);
  if (!context.valid) return context;
  if (!ROOM_REPORT_REASONS.has(reason)) return { valid: false, status: 400, error: 'Invalid report reason' };
  const message = await MetaverseChatMessage.findOne({
    messageId: String(messageId),
    sessionId: context.session.sessionId,
    worldId: `virtual-room:${context.room.roomId}`
  }).select('messageId +senderUserId');
  if (!message) return { valid: false, status: 404, error: 'Message not found' };
  if (String(message.senderUserId) === context.actor) return { valid: false, status: 400, error: 'Cannot report your own message' };
  const rateAllowed = await claimRoomReportSlot({
    roomId: context.room.roomId,
    sessionId: context.session.sessionId,
    actorUserId: context.actor
  });
  if (!rateAllowed) return { valid: false, status: 429, error: 'Report rate exceeded' };
  const now = new Date();
  const report = await VirtualRoomMessageReport.findOneAndUpdate(
    { sessionId: context.session.sessionId, messageId: message.messageId, reporterUserId: context.actor },
    {
      $set: { reason, status: 'open', resolution: null, resolvedAt: null, expiresAt: new Date(now.getTime() + ROOM_REPORT_RETENTION_MS) },
      $setOnInsert: { reportId: crypto.randomUUID(), roomId: context.room.roomId }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { valid: true, status: 201, report: { id: report.reportId, messageId: message.messageId, reason: report.reason, status: report.status } };
}

function aggregateRoomReports(reports, messagesById) {
  const grouped = new Map();
  reports.forEach((report) => {
    const current = grouped.get(report.messageId);
    if (current) {
      current.count += 1;
      current.reasons.add(report.reason);
      if (new Date(report.createdAt) < new Date(current.createdAt)) current.createdAt = report.createdAt;
      return;
    }
    grouped.set(report.messageId, {
      id: report.reportId,
      count: 1,
      reasons: new Set([report.reason]),
      createdAt: report.createdAt,
      message: messagesById.get(report.messageId) || null
    });
  });
  return Array.from(grouped.values())
    .map((report) => ({ ...report, reasons: Array.from(report.reasons).sort() }))
    .sort((left, right) => right.count - left.count || new Date(left.createdAt) - new Date(right.createdAt));
}

async function listRoomMessageReports({ sessionId, actorUserId, actorRole }) {
  const context = await authorizedContext(sessionId, actorUserId);
  if (!context.valid) return context;
  if (!canModerateRoomChat(actorUserId, context.session.hostUserId, actorRole)) return { valid: false, status: 403, error: 'Host capability required' };
  const reports = await VirtualRoomMessageReport.find({ roomId: context.room.roomId, sessionId: context.session.sessionId, status: 'open' }).sort({ createdAt: 1 }).lean();
  const messages = await MetaverseChatMessage.find({ messageId: { $in: reports.map((report) => report.messageId) }, worldId: `virtual-room:${context.room.roomId}` }).lean();
  const byId = new Map(messages.map((message) => [message.messageId, publicRoomMessage(message)]));
  const resolved = await VirtualRoomMessageReport.find({ roomId: context.room.roomId, sessionId: context.session.sessionId, status: 'resolved' })
    .sort({ resolvedAt: -1 })
    .limit(20)
    .select('reportId reason resolution resolvedAt -_id')
    .lean();
  return {
    valid: true,
    status: 200,
    reports: aggregateRoomReports(reports, byId),
    history: resolved.map((report) => ({
      id: report.reportId,
      reason: report.reason,
      resolution: report.resolution || 'dismissed',
      resolvedAt: report.resolvedAt
    }))
  };
}

async function resolveRoomMessageReport({ sessionId, reportId, actorUserId, actorRole }) {
  const context = await authorizedContext(sessionId, actorUserId);
  if (!context.valid) return context;
  if (!canModerateRoomChat(actorUserId, context.session.hostUserId, actorRole)) return { valid: false, status: 403, error: 'Host capability required' };
  const report = await VirtualRoomMessageReport.findOne({
    reportId: String(reportId),
    roomId: context.room.roomId,
    sessionId: context.session.sessionId,
    status: 'open'
  }).select('messageId');
  if (!report) return { valid: false, status: 404, error: 'Report not found' };
  const result = await VirtualRoomMessageReport.updateMany(
    {
      roomId: context.room.roomId,
      sessionId: context.session.sessionId,
      messageId: report.messageId,
      status: 'open'
    },
    { $set: { status: 'resolved', resolution: 'dismissed', resolvedAt: new Date() } }
  );
  return { valid: true, status: 200, resolvedCount: result.modifiedCount };
}

async function moderateReportedRoomMessage({ sessionId, reportId, actorUserId, actorRole }) {
  const context = await authorizedContext(sessionId, actorUserId);
  if (!context.valid) return context;
  if (!canModerateRoomChat(actorUserId, context.session.hostUserId, actorRole)) return { valid: false, status: 403, error: 'Host capability required' };

  const databaseSession = await mongoose.startSession();
  let messageId = null;
  let removed = false;
  try {
    await databaseSession.withTransaction(async () => {
      messageId = null;
      removed = false;
      const report = await VirtualRoomMessageReport.findOne({
        reportId: String(reportId),
        roomId: context.room.roomId,
        sessionId: context.session.sessionId,
        status: 'open'
      }).select('messageId').session(databaseSession);
      if (!report) return;

      messageId = report.messageId;
      const deletion = await MetaverseChatMessage.deleteOne({
        messageId,
        sessionId: context.session.sessionId,
        worldId: `virtual-room:${context.room.roomId}`
      }).session(databaseSession);
      removed = deletion.deletedCount > 0;
      await VirtualRoomMessageReport.updateMany(
        {
          roomId: context.room.roomId,
          sessionId: context.session.sessionId,
          messageId,
          status: 'open'
        },
        { $set: { status: 'resolved', resolution: 'message_removed', resolvedAt: new Date() } },
        { session: databaseSession }
      );
    });
  } finally {
    await databaseSession.endSession();
  }
  if (!messageId) return { valid: false, status: 404, error: 'Report not found' };
  return { valid: true, status: 200, removed, messageId };
}

async function listRoomMessages({ sessionId, actorUserId, after }) {
  const context = await authorizedContext(sessionId, actorUserId);
  if (!context.valid) return context;
  const cursor = after ? new Date(after) : null;
  if (cursor && Number.isNaN(cursor.getTime())) return { valid: false, status: 400, error: 'Invalid message cursor' };
  const observedAt = new Date();
  const query = {
    worldId: `virtual-room:${context.room.roomId}`,
    sessionId: context.session.sessionId,
    createdAt: cursor ? { $gt: cursor, $lte: observedAt } : { $lte: observedAt }
  };
  const messages = await MetaverseChatMessage.find(query)
    .select('+senderUserId')
    .sort({ createdAt: cursor ? 1 : -1 })
    .limit(ROOM_CHAT_PAGE_SIZE)
    .lean();
  if (!cursor) messages.reverse();
  const reportedMessageIds = messages.length
    ? await VirtualRoomMessageReport.distinct('messageId', {
      roomId: context.room.roomId,
      sessionId: context.session.sessionId,
      reporterUserId: context.actor,
      status: 'open',
      messageId: { $in: messages.map((message) => message.messageId) }
    })
    : [];
  const reportedByMe = new Set(reportedMessageIds);
  return {
    valid: true,
    status: 200,
    messages: messages.map((message) => publicRoomMessageWithReportState(message, reportedByMe, context.actor)),
    cursor: observedAt.toISOString(),
    retentionSeconds: ROOM_CHAT_RETENTION_MS / 1000
  };
}

async function createRoomMessage({ sessionId, actorUserId, text }) {
  const context = await authorizedContext(sessionId, actorUserId, true);
  if (!context.valid) return context;
  const safeText = cleanRoomMessage(text);
  if (!safeText) return { valid: false, status: 400, error: 'Message is empty' };
  const rateAllowed = await claimRoomChatWindow({
    roomId: context.room.roomId,
    sessionId: context.session.sessionId,
    actorUserId: context.actor
  });
  if (!rateAllowed) return { valid: false, status: 429, error: 'Message rate exceeded' };
  const character = await MetaverseCharacter.findOne({ accountUserId: context.actor }).select('characterName -_id').lean();
  const now = new Date();
  const message = await MetaverseChatMessage.create({
    messageId: crypto.randomUUID(),
    worldId: `virtual-room:${context.room.roomId}`,
    sessionId: context.session.sessionId,
    senderUserId: context.actor,
    characterName: character?.characterName || (context.actor === String(context.session.hostUserId) ? 'Room host' : 'Verified participant'),
    text: safeText,
    createdAt: now,
    expiresAt: new Date(now.getTime() + ROOM_CHAT_RETENTION_MS)
  });
  return { valid: true, status: 201, message: publicRoomMessageWithReportState(message, new Set(), context.actor) };
}

module.exports = {
  ROOM_CHAT_RETENTION_MS,
  ROOM_REPORT_RETENTION_MS,
  ROOM_REPORT_REASONS,
  ROOM_REPORT_RATE_LIMIT,
  ROOM_REPORT_WINDOW_MS,
  roomReportThrottleKey,
  claimRoomReportSlot,
  roomChatThrottleKey,
  claimRoomChatWindow,
  cleanRoomMessage,
  publicRoomMessage,
  publicRoomMessageWithReportState,
  canModerateRoomChat,
  aggregateRoomReports,
  deleteRoomMessage,
  reportRoomMessage,
  listRoomMessageReports,
  resolveRoomMessageReport,
  moderateReportedRoomMessage,
  listRoomMessages,
  createRoomMessage
};
