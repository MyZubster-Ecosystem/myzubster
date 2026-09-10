function createMongoConnector({
  mongoose,
  mongoUri,
  serverSelectionTimeoutMS = 5000,
  connectTimeoutMS = 5000,
  socketTimeoutMS = 15000,
  logger = console
}) {
  let mongoConnectionPromise = null;

  return function connectMongo() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (mongoConnectionPromise) return mongoConnectionPromise;

    if (!mongoUri) {
      const error = new Error('MongoDB non configurato: impostare MONGODB_URI (o MONGO_URI)');
      logger.error(`❌ ${error.message}`);
      return Promise.reject(error);
    }

    mongoConnectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS,
      connectTimeoutMS,
      socketTimeoutMS,
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000
    })
      .then(() => {
        logger.log('✅ Connected to MongoDB');
      })
      .catch((error) => {
        logger.error('❌ MongoDB connection error:', error);
        throw error;
      })
      .finally(() => {
        // Do not retain a settled promise. If a warm serverless instance later
        // loses MongoDB, the next request must be allowed to reconnect.
        mongoConnectionPromise = null;
      });

    return mongoConnectionPromise;
  };
}

module.exports = { createMongoConnector };
