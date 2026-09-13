'use strict';

const crypto = require('crypto');

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (!left.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function requireMyzLedgerService(req, res, next) {
  const expected = process.env.MYZ_LEDGER_SERVICE_TOKEN;
  if (!expected) {
    return res.status(503).json({ success: false, code: 'MYZ_LEDGER_SERVICE_AUTH_UNCONFIGURED', error: 'MYZ ledger service authentication is not configured' });
  }
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!safeEqual(token, expected)) {
    return res.status(401).json({ success: false, code: 'MYZ_LEDGER_SERVICE_UNAUTHORIZED', error: 'Unauthorized service request' });
  }
  return next();
}

module.exports = { requireMyzLedgerService, safeEqual };
