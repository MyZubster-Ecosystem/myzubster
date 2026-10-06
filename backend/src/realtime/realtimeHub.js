let ioInstance = null;

function registerRealtimeIO(io) {
  ioInstance = io || null;
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return false;
  ioInstance.to(`user:${String(userId)}`).emit(event, payload);
  return true;
}

function emitModerationAction({ targetUserId, action, contextType = null, contextId = null, eventId = null, createdAt = null }) {
  return emitToUser(targetUserId, 'moderation.action', {
    eventId,
    action,
    contextType,
    contextId,
    createdAt
  });
}

function emitInteractionControl({ ownerUserId, targetUserId, kind, active }) {
  const payload = {
    kind,
    active: Boolean(active),
    ownerUserId: String(ownerUserId),
    targetUserId: String(targetUserId)
  };
  emitToUser(ownerUserId, 'moderation.control_changed', payload);
  emitToUser(targetUserId, 'moderation.control_changed', payload);
  return true;
}

module.exports = {
  registerRealtimeIO,
  emitToUser,
  emitModerationAction,
  emitInteractionControl
};
