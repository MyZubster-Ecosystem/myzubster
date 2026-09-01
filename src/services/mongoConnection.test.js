const { createMongoConnector } = require('./mongoConnection');

describe('createMongoConnector', () => {
  test('reconnects after a previously successful connection is later lost', async () => {
    const mongoose = {
      connection: { readyState: 0 },
      connect: jest.fn(async () => {
        mongoose.connection.readyState = 1;
      })
    };
    const logger = { log: jest.fn(), error: jest.fn() };
    const connectMongo = createMongoConnector({
      mongoose,
      mongoUri: 'mongodb://example.test/myzubster',
      logger
    });

    await connectMongo();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);

    mongoose.connection.readyState = 0;
    await connectMongo();

    expect(mongoose.connect).toHaveBeenCalledTimes(2);
  });

  test('shares one in-flight connection attempt between concurrent callers', async () => {
    let resolveConnect;
    const mongoose = {
      connection: { readyState: 0 },
      connect: jest.fn(() => new Promise((resolve) => {
        resolveConnect = () => {
          mongoose.connection.readyState = 1;
          resolve();
        };
      }))
    };
    const logger = { log: jest.fn(), error: jest.fn() };
    const connectMongo = createMongoConnector({
      mongoose,
      mongoUri: 'mongodb://example.test/myzubster',
      logger
    });

    const first = connectMongo();
    const second = connectMongo();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);

    resolveConnect();
    await Promise.all([first, second]);
  });
});
