const backendApp = require("../backend/src/index");
const { attachRealtimeServer } = require("../backend/src/realtime/socketServer");
const {
  createVercelRealtimeServer,
} = require("../backend/src/realtime/vercelServer");

let databaseConnection = null;

async function ensureDatabase() {
  if (!databaseConnection) {
    databaseConnection = Promise.resolve(backendApp.connectDatabase()).finally(
      () => {
        databaseConnection = null;
      },
    );
  }
  return databaseConnection;
}

const server = createVercelRealtimeServer({
  backendApp,
  attachRealtimeServer,
  ensureReady: ensureDatabase,
});

server.ensureDatabase = ensureDatabase;

module.exports = server;
