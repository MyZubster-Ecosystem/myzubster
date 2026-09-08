const crypto = require("crypto");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");
const { emitToUser } = require("../realtime/realtimeHub");
const {
  incrementCounter,
  logRealtimeEvent,
  observeDuration,
  traceRef,
} = require("./realtimeObservability");

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

function cleanDeepLink(value) {
  const link = String(value || "")
    .trim()
    .slice(0, 500);
  if (!link.startsWith("/")) return null;
  return link;
}

function publicNotification(row) {
  return {
    id: row.notificationId,
    type: row.type,
    category: row.category,
    payload: row.payload || {},
    deepLink: row.deepLink,
    readAt: row.readAt || null,
    createdAt: row.createdAt,
  };
}

async function categoryEnabled({ userId, category }) {
  const preference = await NotificationPreference.findOne({
    userId: String(userId),
    category,
  }).lean();
  return preference ? preference.inProductEnabled !== false : true;
}

async function createNotification({
  userId,
  type,
  category,
  dedupeKey,
  payload = {},
  deepLink,
}) {
  const started = Date.now();
  incrementCounter("notificationAttempts");
  const finish = (counter, result) => {
    if (counter) incrementCounter(counter);
    observeDuration("notificationProcessingMs", Date.now() - started);
    return result;
  };
  try {
    if (!databaseAvailable())
      return finish("notificationFailures", {
        valid: false,
        status: 503,
        error: "Notification storage unavailable",
      });
    if (
      !userId ||
      !dedupeKey ||
      !["follow", "community", "message", "session"].includes(type)
    )
      return finish("notificationFailures", {
        valid: false,
        status: 400,
        error: "Invalid notification",
      });
    if (!["social", "community", "message", "session"].includes(category))
      return finish("notificationFailures", {
        valid: false,
        status: 400,
        error: "Invalid notification category",
      });
    const safeDeepLink = cleanDeepLink(deepLink);
    if (!safeDeepLink)
      return finish("notificationFailures", {
        valid: false,
        status: 400,
        error: "Notification deep link must be an internal path",
      });
    if (!(await categoryEnabled({ userId, category })))
      return finish("notificationsSkipped", {
        valid: true,
        status: 200,
        skipped: true,
        reason: "preference-disabled",
      });

    const existing = await Notification.findOne({
      userId: String(userId),
      dedupeKey: String(dedupeKey),
    }).lean();
    if (existing)
      return finish("notificationsDuplicate", {
        valid: true,
        status: 200,
        duplicate: true,
        notification: publicNotification(existing),
      });

    let row;
    try {
      row = await Notification.create({
        notificationId: crypto.randomUUID(),
        userId: String(userId),
        type,
        category,
        dedupeKey: String(dedupeKey).slice(0, 200),
        payload,
        deepLink: safeDeepLink,
      });
    } catch (error) {
      if (error && error.code === 11000) {
        const duplicate = await Notification.findOne({
          userId: String(userId),
          dedupeKey: String(dedupeKey),
        }).lean();
        return finish("notificationsDuplicate", {
          valid: true,
          status: 200,
          duplicate: true,
          notification: publicNotification(duplicate),
        });
      }
      throw error;
    }

    const notification = publicNotification(row.toObject());
    incrementCounter("notificationsPersisted");
    const emitted = emitToUser(userId, "notification.created", notification);
    incrementCounter(
      emitted ? "notificationRealtimeEmits" : "notificationRealtimeMisses",
    );
    logRealtimeEvent("notification_processed", {
      notificationRef: traceRef(notification.id),
      messageRef: traceRef(notification.payload?.messageId),
      status: emitted
        ? "persisted_and_emitted"
        : "persisted_without_live_recipient",
      durationMs: Date.now() - started,
    });
    return finish(null, {
      valid: true,
      status: 201,
      duplicate: false,
      notification,
      realtimeEmitted: emitted,
    });
  } catch (error) {
    incrementCounter("notificationFailures");
    observeDuration("notificationProcessingMs", Date.now() - started);
    logRealtimeEvent(
      "notification_failed",
      {
        notificationRef: traceRef(dedupeKey),
        status: 500,
        reason: error?.name || "notification_persistence_failed",
        durationMs: Date.now() - started,
      },
      "error",
    );
    throw error;
  }
}

async function listNotifications({
  userId,
  unreadOnly = false,
  limit = 50,
  before = null,
}) {
  if (!databaseAvailable())
    return {
      valid: false,
      status: 503,
      error: "Notification storage unavailable",
    };
  const query = { userId: String(userId) };
  if (unreadOnly) query.readAt = null;
  if (before) query.createdAt = { $lt: new Date(before) };
  const rows = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
    .lean();
  const unreadCount = await Notification.countDocuments({
    userId: String(userId),
    readAt: null,
  });
  return {
    valid: true,
    status: 200,
    notifications: rows.map(publicNotification),
    unreadCount,
    cursor: rows.length
      ? rows[rows.length - 1].createdAt.toISOString()
      : before || null,
  };
}

async function markRead({ userId, notificationId }) {
  if (!databaseAvailable())
    return {
      valid: false,
      status: 503,
      error: "Notification storage unavailable",
    };
  const row = await Notification.findOneAndUpdate(
    { notificationId: String(notificationId), userId: String(userId) },
    { $set: { readAt: new Date() } },
    { new: true },
  );
  if (!row)
    return { valid: false, status: 404, error: "Notification not found" };
  const unreadCount = await Notification.countDocuments({
    userId: String(userId),
    readAt: null,
  });
  const notification = publicNotification(row.toObject());
  emitToUser(userId, "notification.read", {
    id: notification.id,
    readAt: notification.readAt,
    unreadCount,
  });
  return { valid: true, status: 200, notification, unreadCount };
}

async function setPreference({ userId, category, inProductEnabled }) {
  if (!databaseAvailable())
    return {
      valid: false,
      status: 503,
      error: "Notification storage unavailable",
    };
  if (!["social", "community", "message", "session"].includes(category))
    return {
      valid: false,
      status: 400,
      error: "Invalid notification category",
    };
  const row = await NotificationPreference.findOneAndUpdate(
    { userId: String(userId), category },
    { $set: { inProductEnabled: Boolean(inProductEnabled) } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return {
    valid: true,
    status: 200,
    preference: {
      category: row.category,
      inProductEnabled: row.inProductEnabled,
    },
  };
}

module.exports = {
  cleanDeepLink,
  createNotification,
  listNotifications,
  markRead,
  setPreference,
  categoryEnabled,
};
