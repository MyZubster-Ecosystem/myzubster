const crypto = require('crypto');

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        if (value[key] !== undefined) result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }
  return value instanceof Date ? value.toISOString() : value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256Canonical(value) {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

module.exports = { canonicalize, canonicalJson, sha256Canonical };
