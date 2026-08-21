'use strict';

const net = require('net');

function parseCommaList(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeUrl(value) {
  const url = new URL(String(value || '').trim());
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  return url;
}

function isV3OnionHost(hostname) {
  return /^[a-z2-7]{56}\.onion$/i.test(String(hostname || ''));
}

function isPrivateIpv4(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return true;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIp(address) {
  const type = net.isIP(address);
  if (type === 4) return isPrivateIpv4(address);
  if (type === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb') ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('ff')
    );
  }
  return false;
}

function hostnameMatchesAllowlist(hostname, allowedHosts) {
  return allowedHosts.some(allowed => hostname === allowed || hostname.endsWith(`.${allowed}`));
}

function createResearchPolicy({ allowedHosts = [], allowedOnions = [] } = {}) {
  const webAllowlist = allowedHosts.map(item => item.toLowerCase());
  const onionAllowlist = allowedOnions.map(item => item.toLowerCase());

  return {
    assertUrl(value) {
      let url;
      try {
        url = normalizeUrl(value);
      } catch (_) {
        throw new Error('research crawler URL is invalid');
      }

      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('research crawler only supports http/https URLs');
      }

      const hostname = url.hostname;
      const isOnion = hostname.endsWith('.onion');

      if (isOnion) {
        if (!isV3OnionHost(hostname)) throw new Error('only Tor v3 onion hosts are supported');
        if (!onionAllowlist.includes(hostname)) throw new Error('onion host is not in RESEARCH_CRAWLER_ALLOWED_ONIONS');
        return { url, sourceType: 'onion' };
      }

      if (
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal') ||
        isPrivateIp(hostname)
      ) {
        throw new Error('private, loopback and local-network targets are blocked');
      }

      if (webAllowlist.length === 0 || !hostnameMatchesAllowlist(hostname, webAllowlist)) {
        throw new Error('web host is not in RESEARCH_CRAWLER_ALLOWED_HOSTS');
      }

      return { url, sourceType: 'web' };
    },
  };
}

module.exports = {
  createResearchPolicy,
  hostnameMatchesAllowlist,
  isPrivateIp,
  isV3OnionHost,
  normalizeUrl,
  parseCommaList,
};
