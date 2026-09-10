const express = require("express");
const crypto = require("crypto");
const { authenticate, isAdmin } = require("../../../src/middleware/auth");
const {
  mintSocketToken,
  TOKEN_TTL_SECONDS,
} = require("../services/realtimeGateway");
const {
  realtimeMetricsSnapshot,
} = require("../services/realtimeObservability");
const presenceStore = require("../services/presenceStore");
const { fanoutMode } = require("../realtime/redisAdapter");

const router = express.Router();

router.get("/health", async (_req, res) => {
  const presence = await presenceStore.list("system:realtime-health");
  res.set("Cache-Control", "no-store");
  return res.json({
    success: true,
    status: "ok",
    transport: "socket.io",
    socketPath: "/realtime",
    presence: presence.mode,
    fanout: fanoutMode(),
    privacy: "aggregate-only",
  });
});

router.post("/token", authenticate, (req, res) => {
  try {
    const correlationId = String(
      req.headers["x-request-id"] || crypto.randomUUID(),
    ).slice(0, 160);
    const token = mintSocketToken({
      userId: req.userId,
      role: req.userRole || "user",
      username: req.username || null,
      correlationId,
    });
    return res.json({
      success: true,
      token,
      expiresInSeconds: TOKEN_TTL_SECONDS,
      socketPath: "/realtime",
      transports: ["websocket", "polling"],
      namespaces: [
        "user:{id}",
        "community:{id}",
        "session:{id}",
        "world:neon-plaza",
      ],
      correlationId,
    });
  } catch (error) {
    console.error("Realtime token error:", error?.name || "Error");
    return res
      .status(503)
      .json({ success: false, error: "Realtime token unavailable" });
  }
});

router.get("/metrics", authenticate, isAdmin, (_req, res) => {
  res.set("Cache-Control", "no-store");
  return res.json({
    success: true,
    privacy: "aggregate-only",
    ...realtimeMetricsSnapshot(),
  });
});

module.exports = router;
