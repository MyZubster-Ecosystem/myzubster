const {
  fanoutMode,
  initializeRealtimeAdapter,
  resetRealtimeAdapterForTests
} = require('./redisAdapter');

describe('Socket.IO Redis adapter', () => {
  afterEach(async () => {
    delete process.env.REDIS_URL;
    await resetRealtimeAdapterForTests();
  });

  test('uses the local adapter when Redis is not configured', async () => {
    const io = { adapter: jest.fn() };

    await expect(initializeRealtimeAdapter(io)).resolves.toEqual({ mode: 'local-fallback' });
    expect(io.adapter).not.toHaveBeenCalled();
    expect(fanoutMode()).toBe('local-fallback');
  });

  test('installs cross-instance fan-out after both Redis clients are ready', async () => {
    process.env.REDIS_URL = 'redis://preview.example.test:6379';
    const client = {
      isOpen: true,
      isReady: true,
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      duplicate: jest.fn(),
      on: jest.fn()
    };
    const subscriber = {
      isOpen: true,
      isReady: true,
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    };
    client.duplicate.mockReturnValue(subscriber);
    const io = { adapter: jest.fn() };
    const socketAdapter = { name: 'redis-adapter' };
    const createSocketAdapter = jest.fn(() => socketAdapter);

    await expect(initializeRealtimeAdapter(io, {
      createRedisClient: jest.fn(() => client),
      createSocketAdapter
    })).resolves.toEqual({ mode: 'redis' });

    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(subscriber.connect).toHaveBeenCalledTimes(1);
    expect(createSocketAdapter).toHaveBeenCalledWith(client, subscriber, {
      key: 'myzubster:socket.io',
      publishOnSpecificResponseChannel: true
    });
    expect(io.adapter).toHaveBeenCalledWith(socketAdapter);
    expect(fanoutMode()).toBe('redis');
  });

  test('falls back locally when the Redis client cannot be created', async () => {
    process.env.REDIS_URL = 'not-a-redis-url';
    const io = { adapter: jest.fn() };

    await expect(initializeRealtimeAdapter(io, {
      createRedisClient: jest.fn(() => { throw new Error('invalid URL'); })
    })).resolves.toEqual({ mode: 'local-fallback' });

    expect(io.adapter).not.toHaveBeenCalled();
    expect(fanoutMode()).toBe('local-fallback');
  });
});
