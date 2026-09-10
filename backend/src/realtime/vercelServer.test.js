const express = require("express");
const request = require("supertest");
const { createVercelRealtimeServer } = require("./vercelServer");

describe("Vercel realtime server adapter", () => {
  test("waits for storage before serving HTTP and shares readiness with Socket.IO", async () => {
    const backendApp = express();
    backendApp.get("/api/realtime/health", (_req, res) => {
      res.json({ success: true });
    });
    const ensureReady = jest.fn().mockResolvedValue(undefined);
    const attachRealtimeServer = jest.fn(() => ({ close: jest.fn() }));

    const server = createVercelRealtimeServer({
      backendApp,
      attachRealtimeServer,
      ensureReady,
    });
    const response = await request(server).get("/api/realtime/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(ensureReady).toHaveBeenCalledTimes(1);
    expect(attachRealtimeServer).toHaveBeenCalledWith(server, {
      ready: ensureReady,
    });
  });

  test("fails closed when MongoDB readiness cannot be established", async () => {
    const backendApp = express();
    backendApp.get("/api/realtime/health", (_req, res) => {
      res.json({ success: true });
    });
    const logger = { error: jest.fn() };
    const server = createVercelRealtimeServer({
      backendApp,
      attachRealtimeServer: () => ({ close: jest.fn() }),
      ensureReady: jest.fn().mockRejectedValue(new Error("offline")),
      logger,
    });

    const response = await request(server).get("/api/realtime/health");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      error: "Realtime storage unavailable",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Realtime runtime readiness failed:",
      "Error",
    );
  });
});
