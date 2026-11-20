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

describe('explicit isolated Marketplace database',()=>{
  test('uses the configured database instead of the URI default',async()=>{
    const mongoose={connection:{readyState:0},connect:jest.fn(async()=>{})};
    const connect=createMongoConnector({mongoose,mongoUri:'mongodb://example.test/wrong-default',dbName:'myzubster_pr1689_preview',qaDatabase:'myzubster_pr1689_preview',vercelEnv:'preview',logger:{log:jest.fn(),error:jest.fn()}});
    await connect();
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://example.test/wrong-default',expect.objectContaining({dbName:'myzubster_pr1689_preview'}));
  });
  test.each([
    {dbName:undefined,vercelEnv:'preview'},
    {dbName:'production',vercelEnv:'preview'},
    {dbName:'myzubster_pr1689_preview',vercelEnv:'production'}
  ])('rejects unsafe QA configuration %j',options=>{
    const mongoose={connection:{readyState:0},connect:jest.fn()};
    expect(()=>createMongoConnector({mongoose,mongoUri:'mongodb://example.test/default',qaDatabase:'myzubster_pr1689_preview',...options})).toThrow('Marketplace QA requires Preview');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });
});
