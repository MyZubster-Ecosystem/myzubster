const crypto = require('crypto');
const mongoose = require('mongoose');
const MetaverseChatMessage = require('../models/MetaverseChatMessage');
const MetaverseCharacter = require('../models/MetaverseCharacter');
const VirtualRoom = require('../models/VirtualRoom');
const VirtualSession = require('../models/VirtualSession');

const ROOM_CHAT_RETENTION_MS = 24 * 60 * 60 * 1000;
const ROOM_CHAT_PAGE_SIZE = 50;

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
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
    .sort({ createdAt: cursor ? 1 : -1 })
    .limit(ROOM_CHAT_PAGE_SIZE)
    .lean();
  if (!cursor) messages.reverse();
  return { valid: true, status: 200, messages: messages.map(publicRoomMessage), cursor: observedAt.toISOString(), retentionSeconds: ROOM_CHAT_RETENTION_MS / 1000 };
}

async function createRoomMessage({ sessionId, actorUserId, text }) {
  const context = await authorizedContext(sessionId, actorUserId, true);
  if (!context.valid) return context;
  const safeText = cleanRoomMessage(text);
  if (!safeText) return { valid: false, status: 400, error: 'Message is empty' };
  const recent = await MetaverseChatMessage.exists({
    worldId: `virtual-room:${context.room.roomId}`,
    sessionId: context.session.sessionId,
    senderUserId: context.actor,
    createdAt: { $gt: new Date(Date.now() - 750) }
  });
  if (recent) return { valid: false, status: 429, error: 'Message rate exceeded' };
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
  return { valid: true, status: 201, message: publicRoomMessage(message) };
}

module.exports = {
  ROOM_CHAT_RETENTION_MS,
  cleanRoomMessage,
  publicRoomMessage,
  canModerateRoomChat,
  deleteRoomMessage,
  listRoomMessages,
  createRoomMessage
};
