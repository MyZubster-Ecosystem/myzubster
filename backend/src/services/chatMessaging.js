const crypto = require("crypto");
const mongoose = require("mongoose");
const ChatChannel = require("../models/ChatChannel");
const ChatMessage = require("../models/ChatMessage");
const CommunityMembership = require("../models/CommunityMembership");
const { deliveryDecision } = require("./realtimeModeration");
const { createNotification } = require("./notificationService");

const MESSAGE_BURST_WINDOW_MS = 10 * 1000;
const MESSAGE_BURST_LIMIT = 12;
const NOTIFICATION_BATCH_SIZE = Math.min(
  Math.max(Number(process.env.REALTIME_NOTIFICATION_BATCH_SIZE) || 20, 1),
  100,
);

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function cleanBody(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 2000);
}

async function isCommunityMember({ communityId, userId, role = "user" }) {
  if (role === "admin") return true;
  if (!databaseAvailable()) return false;
  const row = await CommunityMembership.findOne({
    communityId: String(communityId),
    userId: String(userId),
    status: "active",
  }).lean();
  return Boolean(row);
}

async function canAccessChannel({ channel, userId, role = "user" }) {
  if (!channel) return false;
  if (role === "admin") return true;
  const actor = String(userId);
  if (channel.type === "direct")
    return (channel.participantUserIds || []).map(String).includes(actor);
  if (channel.type === "community")
    return isCommunityMember({
      communityId: channel.communityId,
      userId: actor,
      role,
    });
  return false;
}

async function createDirectChannel({ actorUserId, otherUserId }) {
  if (!databaseAvailable())
    return {
      valid: false,
      status: 503,
      error: "Messaging storage unavailable",
    };
  if (!otherUserId || String(actorUserId) === String(otherUserId))
    return {
      valid: false,
      status: 400,
      error: "Invalid direct-message participant",
    };
  const participants = [String(actorUserId), String(otherUserId)].sort();
  const blocked = await deliveryDecision({
    senderUserId: actorUserId,
    recipientUserId: otherUserId,
  });
  if (!blocked.allowed && blocked.status === "blocked")
    return {
      valid: false,
      status: 403,
      error: "Direct message blocked by interaction policy",
    };
  let channel = await ChatChannel.findOne({
    type: "direct",
    participantUserIds: { $all: participants, $size: 2 },
  });
  if (!channel) {
    channel = await ChatChannel.create({
      channelId: crypto.randomUUID(),
      type: "direct",
      participantUserIds: participants,
      createdByUserId: String(actorUserId),
    });
  }
  return { valid: true, status: 200, channel };
}

async function ensureCommunityChannel({
  actorUserId,
  actorRole = "user",
  communityId,
}) {
  if (!databaseAvailable())
    return {
      valid: false,
      status: 503,
      error: "Messaging storage unavailable",
    };
  if (!communityId)
    return { valid: false, status: 400, error: "Community is required" };
  const member = await isCommunityMember({
    communityId,
    userId: actorUserId,
    role: actorRole,
  });
  if (!member)
    return {
      valid: false,
      status: 403,
      error: "Community membership required",
    };
  let channel = await ChatChannel.findOne({
    type: "community",
    communityId: String(communityId),
  });
  if (!channel)
    channel = await ChatChannel.create({
      channelId: crypto.randomUUID(),
      type: "community",
      communityId: String(communityId),
      createdByUserId: String(actorUserId),
    });
  return { valid: true, status: 200, channel };
}

async function recipientsForChannel(channel, senderUserId) {
  if (channel.type === "direct")
    return (channel.participantUserIds || [])
      .map(String)
      .filter((id) => id !== String(senderUserId));
  const rows = await CommunityMembership.find({
    communityId: channel.communityId,
    status: "active",
  })
    .select({ userId: 1, _id: 0 })
    .lean();
  return rows
    .map((row) => String(row.userId))
    .filter((id) => id !== String(senderUserId));
}

async function messagingRateDecision(userId) {
  const since = new Date(Date.now() - MESSAGE_BURST_WINDOW_MS);
  const count = await ChatMessage.countDocuments({
    senderUserId: String(userId),
    createdAt: { $gte: since },
  });
  return count >= MESSAGE_BURST_LIMIT
    ? { allowed: false, status: 429, reason: "message-burst-rate-limit" }
    : { allowed: true, status: 200, reason: null };
}

async function createMessageNotifications({ channel, message, recipients }) {
  const summary = {
    attempted: recipients.length,
    persisted: 0,
    skipped: 0,
    failed: 0,
  };
  for (
    let offset = 0;
    offset < recipients.length;
    offset += NOTIFICATION_BATCH_SIZE
  ) {
    const batch = recipients.slice(offset, offset + NOTIFICATION_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((recipientUserId) => {
        const deepLink =
          channel.type === "community"
            ? `/communities/${encodeURIComponent(channel.communityId)}/chat`
            : `/messages/${encodeURIComponent(channel.channelId)}`;
        return createNotification({
          userId: recipientUserId,
          type: "message",
          category: "message",
          dedupeKey: `message:${message.messageId}`,
          payload: {
            messageId: message.messageId,
            channelId: channel.channelId,
            senderUserId: message.senderUserId,
            communityId: channel.communityId || null,
          },
          deepLink,
        });
      }),
    );
    for (const result of results) {
      if (result.status === "rejected" || result.value?.valid === false)
        summary.failed += 1;
      else if (result.value?.skipped) summary.skipped += 1;
      else summary.persisted += 1;
    }
  }
  return summary;
}

async function persistMessage({
  actorUserId,
  actorRole = "user",
  channelId,
  clientMessageId,
  body,
}) {
  if (!databaseAvailable())
    return {
      valid: false,
      status: 503,
      error: "Messaging storage unavailable",
    };
  const safeBody = cleanBody(body);
  const safeClientId = String(clientMessageId || "")
    .trim()
    .slice(0, 160);
  if (!safeBody || !safeClientId)
    return {
      valid: false,
      status: 400,
      error: "Message body and clientMessageId are required",
    };
  const channel = await ChatChannel.findOne({
    channelId: String(channelId),
  }).lean();
  if (!channel)
    return { valid: false, status: 404, error: "Channel not found" };
  if (
    !(await canAccessChannel({ channel, userId: actorUserId, role: actorRole }))
  )
    return { valid: false, status: 403, error: "Channel access denied" };

  const existing = await ChatMessage.findOne({
    channelId: channel.channelId,
    clientMessageId: safeClientId,
  }).lean();
  if (existing)
    return {
      valid: true,
      status: 200,
      duplicate: true,
      message: existing,
      deliverTo: [],
    };

  const rate = await messagingRateDecision(actorUserId);
  if (!rate.allowed)
    return {
      valid: false,
      status: rate.status,
      error: "Message rate limit exceeded",
      reason: rate.reason,
    };

  const recipients = await recipientsForChannel(channel, actorUserId);
  const deliverTo = [];
  for (const recipientUserId of recipients) {
    const decision = await deliveryDecision({
      senderUserId: actorUserId,
      recipientUserId,
    });
    if (decision.allowed) deliverTo.push(recipientUserId);
  }
  if (channel.type === "direct" && deliverTo.length === 0)
    return {
      valid: false,
      status: 403,
      error: "Message blocked or muted by interaction policy",
    };

  const message = await ChatMessage.create({
    messageId: crypto.randomUUID(),
    clientMessageId: safeClientId,
    channelId: channel.channelId,
    senderUserId: String(actorUserId),
    body: safeBody,
  });
  const object = message.toObject();
  const notificationSummary = await createMessageNotifications({
    channel,
    message: object,
    recipients: deliverTo,
  });
  return {
    valid: true,
    status: 201,
    duplicate: false,
    message: object,
    deliverTo,
    notificationSummary,
  };
}

async function listMessages({
  actorUserId,
  actorRole = "user",
  channelId,
  after = null,
  limit = 50,
}) {
  if (!databaseAvailable())
    return {
      valid: false,
      status: 503,
      error: "Messaging storage unavailable",
    };
  const channel = await ChatChannel.findOne({
    channelId: String(channelId),
  }).lean();
  if (!channel)
    return { valid: false, status: 404, error: "Channel not found" };
  if (
    !(await canAccessChannel({ channel, userId: actorUserId, role: actorRole }))
  )
    return { valid: false, status: 403, error: "Channel access denied" };
  const query = { channelId: channel.channelId };
  if (after) query.createdAt = { $gt: new Date(after) };
  const messages = await ChatMessage.find(query)
    .sort({ createdAt: 1 })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
    .lean();
  return {
    valid: true,
    status: 200,
    messages,
    cursor: messages.length
      ? messages[messages.length - 1].createdAt.toISOString()
      : after || null,
  };
}

module.exports = {
  MESSAGE_BURST_LIMIT,
  MESSAGE_BURST_WINDOW_MS,
  NOTIFICATION_BATCH_SIZE,
  cleanBody,
  isCommunityMember,
  canAccessChannel,
  createDirectChannel,
  ensureCommunityChannel,
  messagingRateDecision,
  persistMessage,
  listMessages,
};
