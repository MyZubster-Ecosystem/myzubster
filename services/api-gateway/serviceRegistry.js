/**
 * Lightweight in-process service registry / discovery.
 *
 * Dependency-free by design. It can be swapped for a Consul- or etcd-backed
 * implementation later by keeping the same interface:
 *   register / has / resolve / describe / healthCheck
 */
'use strict';

const http = require('http');
const { URL } = require('url');

function ping(url, timeoutMs) {
  return new Promise((resolve) => {
    let target;
    try {
      target = new URL(url);
    } catch (err) {
      return resolve(false);
    }
    const req = http.get(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 80,
        path: target.pathname || '/health',
        timeout: timeoutMs,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  register(name, url) {
    if (!name || !url) {
      throw new Error('ServiceRegistry.register requires a name and url');
    }
    const key = String(name).toLowerCase();
    this.services.set(key, { name: key, url: url, healthy: true });
    return this;
  }

  has(name) {
    return this.services.has(String(name).toLowerCase());
  }

  resolve(name) {
    const entry = this.services.get(String(name).toLowerCase());
    return entry ? entry.url : null;
  }

  describe() {
    return Array.from(this.services.values()).map((entry) => ({
      name: entry.name,
      url: entry.url,
      healthy: entry.healthy,
    }));
  }

  async healthCheck(timeoutMs) {
    const timeout = timeoutMs || 2000;
    const checks = this.describe().map(async (svc) => {
      const base = svc.url.endsWith('/') ? svc.url.slice(0, -1) : svc.url;
      const ok = await ping(base + '/health', timeout);
      const entry = this.services.get(svc.name);
      if (entry) entry.healthy = ok;
      return { name: svc.name, url: svc.url, healthy: ok };
    });
    return Promise.all(checks);
  }
}

module.exports = { ServiceRegistry };
