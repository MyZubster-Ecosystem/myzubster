jest.mock("redis", () => ({ createClient: jest.fn() }));

const { createClient } = require("redis");
const {
  realtimeMetricsSnapshot,
  resetRealtimeObservability,
} = require("./realtimeObservability");

describe("presenceStore Redis failure behavior", () => {
  let originalRedisUrl;

  beforeEach(() => {
    jest.clearAllMocks();
    resetRealtimeObservability();
    originalRedisUrl = process.env.REDIS_URL;
    process.env.REDIS_URL = "redis://unavailable.example:6379";
  });

  afterEach(() => {
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
  });

  test("falls back locally and raises an alertable metric when Redis connect fails", async () => {
    const client = {
      isReady: false,
      isOpen: false,
      on: jest.fn(),
      connect: jest.fn().mockRejectedValue(new Error("redis unavailable")),
    };
    createClient.mockReturnValue(client);
    const store = require("./presenceStore");

    const first = await store.add({
      channel: "community:c1",
      userId: "u1",
      connectionId: "s1",
    });
    const second = await store.add({
      channel: "community:c1",
      userId: "u1",
      connectionId: "s2",
    });

    expect(first).toMatchObject({
      firstConnection: true,
      mode: "local-fallback",
    });
    expect(second).toMatchObject({
      firstConnection: false,
      mode: "local-fallback",
    });
    expect(realtimeMetricsSnapshot().counters.redisFailures).toBe(2);
    store.resetPresenceStoreForTests();
  });

  test("uses local fallback when an established Redis operation fails", async () => {
    const client = {
      isReady: true,
      isOpen: false,
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      zRemRangeByScore: jest
        .fn()
        .mockRejectedValue(new Error("redis restarted")),
    };
    createClient.mockReturnValue(client);
    const store = require("./presenceStore");

    const result = await store.add({
      channel: "session:s1",
      userId: "u1",
      connectionId: "socket-1",
    });

    expect(result).toMatchObject({
      firstConnection: true,
      mode: "local-fallback",
    });
    expect(realtimeMetricsSnapshot().alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric: "redisFailures" }),
      ]),
    );
    store.resetPresenceStoreForTests();
  });
});
