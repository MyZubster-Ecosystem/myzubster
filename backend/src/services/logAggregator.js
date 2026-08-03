const fs = require('fs');
const path = require('path');

const DEFAULT_LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const DEFAULT_LOG_FILE = 'monitoring.log';
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

function ensureLogDir(logDir = process.env.MONITOR_LOG_DIR || DEFAULT_LOG_DIR) {
  fs.mkdirSync(logDir, { recursive: true });
  return logDir;
}

function getLogPath(options = {}) {
  const logDir = ensureLogDir(options.logDir);
  return path.join(logDir, options.fileName || process.env.MONITOR_LOG_FILE || DEFAULT_LOG_FILE);
}

function rotateLogIfNeeded(logPath, maxBytes = Number(process.env.MONITOR_LOG_MAX_BYTES) || DEFAULT_MAX_BYTES) {
  if (!fs.existsSync(logPath)) return null;

  const { size } = fs.statSync(logPath);
  if (size < maxBytes) return null;

  const archivePath = `${logPath}.${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.renameSync(logPath, archivePath);
  return archivePath;
}

function normalizeEntry(entry) {
  if (typeof entry === 'string') {
    return { level: 'info', message: entry };
  }

  return {
    level: entry.level || 'info',
    message: entry.message || '',
    ...entry
  };
}

function appendLog(entry, options = {}) {
  const logPath = getLogPath(options);
  rotateLogIfNeeded(logPath, options.maxBytes);

  const payload = {
    timestamp: new Date().toISOString(),
    service: 'myzubster-monitoring',
    ...normalizeEntry(entry)
  };

  fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`, 'utf8');
  return payload;
}

function createRequestLoggerStream(options = {}) {
  return {
    write(message) {
      appendLog({
        level: 'http',
        message: message.trim()
      }, options);
    }
  };
}

function readRecentLogs(options = {}) {
  const limit = Math.max(1, Number(options.limit) || 100);
  const logPath = getLogPath(options);

  if (!fs.existsSync(logPath)) return [];

  return fs
    .readFileSync(logPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { level: 'info', message: line };
      }
    });
}

module.exports = {
  appendLog,
  createRequestLoggerStream,
  ensureLogDir,
  getLogPath,
  readRecentLogs,
  rotateLogIfNeeded
};
