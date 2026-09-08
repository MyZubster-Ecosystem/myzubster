const express = require("express");
const http = require("http");

function createVercelRealtimeServer({
  backendApp,
  attachRealtimeServer,
  ensureReady,
  logger = console,
}) {
  if (typeof backendApp !== "function") {
    throw new TypeError("backendApp must be an Express application");
  }
  if (typeof attachRealtimeServer !== "function") {
    throw new TypeError("attachRealtimeServer must be a function");
  }
  if (typeof ensureReady !== "function") {
    throw new TypeError("ensureReady must be a function");
  }

  const runtimeApp = express();
  runtimeApp.disable("x-powered-by");
  runtimeApp.use(async (_req, res, next) => {
    try {
      await ensureReady();
      return next();
    } catch (error) {
      logger.error(
        "Realtime runtime readiness failed:",
        error?.name || "Error",
      );
      return res.status(503).json({
        success: false,
        error: "Realtime storage unavailable",
      });
    }
  });
  runtimeApp.use(backendApp);

  const server = http.createServer(runtimeApp);
  server.realtime = attachRealtimeServer(server, { ready: ensureReady });
  return server;
}

module.exports = { createVercelRealtimeServer };
