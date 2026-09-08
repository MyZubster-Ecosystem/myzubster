const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const router = require("./realtime");
const {
  incrementCounter,
  resetRealtimeObservability,
} = require("../services/realtimeObservability");

describe("realtime operational routes", () => {
  const secret = "test-realtime-admin-secret";
  let app;

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    resetRealtimeObservability();
    app = express();
    app.use(express.json());
    app.use("/api/realtime", router);
  });

  test("exposes non-cacheable aggregate metrics to administrators", async () => {
    incrementCounter("connectionAttempts", 4);
    incrementCounter("connectionSuccesses", 4);
    const token = jwt.sign({ userId: "admin-1", role: "admin" }, secret);

    const response = await request(app)
      .get("/api/realtime/metrics")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toMatchObject({
      success: true,
      privacy: "aggregate-only",
      counters: { connectionAttempts: 4, connectionSuccesses: 4 },
    });
    expect(JSON.stringify(response.body)).not.toContain("admin-1");
  });

  test("does not expose operational metrics to regular users", async () => {
    const token = jwt.sign({ userId: "user-1", role: "user" }, secret);
    const response = await request(app)
      .get("/api/realtime/metrics")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });
});
