require('dotenv').config();
const mongoose = require('mongoose');
const {
  createMonitoringSnapshot,
  recoverUnhealthyServices
} = require('./services/monitoringService');
const { appendLog } = require('./services/logAggregator');
const { sendAlert } = require('./services/alertService');

async function runMonitorOnce(options = {}) {
  if (mongoose.connection.readyState === 0 && process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  const snapshot = await createMonitoringSnapshot({
    mongooseConnection: mongoose.connection,
    ssh: {
      enabled: process.env.MONITOR_SSH_CHECK_ENABLED !== 'false'
    }
  });

  appendLog({ level: snapshot.status === 'healthy' ? 'info' : 'warn', message: 'Monitor check', snapshot });

  let recovery = null;
  let alertResults = [];

  if (snapshot.status !== 'healthy') {
    recovery = await recoverUnhealthyServices(snapshot, {
      enabled: options.execute === true || process.env.MONITOR_AUTO_RECOVERY === 'true'
    });
    alertResults = await sendAlert(snapshot);
    appendLog({ level: 'warn', message: 'Monitor remediation result', recovery, alertResults });
  }

  return { snapshot, recovery, alertResults };
}

if (require.main === module) {
  runMonitorOnce({ execute: process.argv.includes('--execute') })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.snapshot.status === 'critical' ? 2 : 0);
    })
    .catch((error) => {
      appendLog({ level: 'error', message: 'Monitor command failed', error: error.message });
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runMonitorOnce
};
