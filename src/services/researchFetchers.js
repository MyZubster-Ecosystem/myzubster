'use strict';

const { spawn } = require('child_process');
const dns = require('dns');
const http = require('http');
const https = require('https');
const axios = require('axios');
const { isPrivateIp } = require('./researchSearchPolicy');

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MAX_BYTES = 1024 * 1024;
const USER_AGENT = 'MyZubsterResearchBot/0.1 (+bounded allowlist crawler)';

function assertHttpSuccess(status) {
  if (!Number.isInteger(status) || status < 200 || status >= 300) {
    throw new Error(`crawler received HTTP status ${status || 'unknown'}`);
  }
}

function createSafeLookup(lookup = dns.lookup) {
  return function safeLookup(hostname, options, callback) {
    const lookupOptions = options && typeof options === 'object' ? { ...options } : {};
    const wantsAll = lookupOptions.all === true;

    lookup(hostname, lookupOptions, (error, addressOrAddresses, family) => {
      if (error) return callback(error);

      if (wantsAll) {
        if (!Array.isArray(addressOrAddresses) || addressOrAddresses.length === 0) {
          return callback(new Error('crawler DNS lookup returned no addresses'));
        }

        for (const entry of addressOrAddresses) {
          const address = entry && typeof entry === 'object' ? entry.address : null;
          if (!address) return callback(new Error('crawler DNS lookup returned an invalid address'));
          if (isPrivateIp(address)) {
            return callback(new Error('crawler DNS resolved to a private or local address'));
          }
        }

        return callback(null, addressOrAddresses);
      }

      const address = addressOrAddresses && typeof addressOrAddresses === 'object'
        ? addressOrAddresses.address
        : addressOrAddresses;
      const resolvedFamily = addressOrAddresses && typeof addressOrAddresses === 'object'
        ? addressOrAddresses.family
        : family;

      if (!address) return callback(new Error('crawler DNS lookup returned an invalid address'));
      if (isPrivateIp(address)) return callback(new Error('crawler DNS resolved to a private or local address'));
      return callback(null, address, resolvedFamily);
    });
  };
}

function createWebFetcher({ timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES, httpClient = axios, lookup = dns.lookup } = {}) {
  const safeLookup = createSafeLookup(lookup);
  const httpAgent = new http.Agent({ keepAlive: false, lookup: safeLookup });
  const httpsAgent = new https.Agent({ keepAlive: false, lookup: safeLookup });

  return async function fetchWeb(url) {
    const response = await httpClient.get(url, {
      timeout: timeoutMs,
      maxRedirects: 0,
      responseType: 'text',
      maxContentLength: maxBytes,
      maxBodyLength: maxBytes,
      httpAgent,
      httpsAgent,
      validateStatus: status => status >= 200 && status < 400,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,text/plain;q=0.9,*/*;q=0.1',
      },
    });

    if (response.status >= 300) throw new Error('redirects are disabled by crawler policy');
    assertHttpSuccess(response.status);
    const body = String(response.data || '');
    if (Buffer.byteLength(body, 'utf8') > maxBytes) throw new Error('crawler response exceeded maximum size');

    return {
      status: response.status,
      contentType: String(response.headers?.['content-type'] || '').toLowerCase(),
      body,
    };
  };
}

function createOnionFetcher({ socksProxy = '127.0.0.1:9050', timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  return function fetchOnion(url) {
    return new Promise((resolve, reject) => {
      const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
      const args = [
        '--silent',
        '--show-error',
        '--fail-with-body',
        '--socks5-hostname',
        socksProxy,
        '--connect-timeout',
        String(timeoutSeconds),
        '--max-time',
        String(timeoutSeconds),
        '--header',
        `User-Agent: ${USER_AGENT}`,
        '--header',
        'Accept: text/html,text/plain;q=0.9,*/*;q=0.1',
        '--dump-header',
        '-',
        '--url',
        url,
      ];

      const child = spawn('curl', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = Buffer.alloc(0);
      let stderr = '';
      let exceeded = false;

      child.stdout.on('data', chunk => {
        stdout = Buffer.concat([stdout, chunk]);
        if (stdout.length > maxBytes + 64 * 1024) {
          exceeded = true;
          child.kill('SIGKILL');
        }
      });
      child.stderr.on('data', chunk => {
        stderr += chunk.toString('utf8');
      });
      child.on('error', error => reject(new Error(`Tor curl failed to start: ${error.message}`)));
      child.on('close', code => {
        if (exceeded) return reject(new Error('crawler response exceeded maximum size'));
        if (code !== 0) return reject(new Error(`Tor curl failed: ${stderr.trim() || `exit ${code}`}`));

        const raw = stdout.toString('utf8');
        const headerEnd = raw.indexOf('\r\n\r\n');
        if (headerEnd === -1) return reject(new Error('Tor response did not include HTTP headers'));
        const headerText = raw.slice(0, headerEnd);
        const body = raw.slice(headerEnd + 4);
        if (Buffer.byteLength(body, 'utf8') > maxBytes) return reject(new Error('crawler response exceeded maximum size'));

        const statusMatch = headerText.match(/^HTTP\/\S+\s+(\d{3})/i);
        const contentTypeMatch = headerText.match(/^content-type:\s*([^\r\n]+)/im);
        const status = statusMatch ? Number(statusMatch[1]) : null;
        try {
          assertHttpSuccess(status);
        } catch (error) {
          return reject(error);
        }

        resolve({
          status,
          contentType: String(contentTypeMatch?.[1] || '').toLowerCase(),
          body,
        });
      });
    });
  };
}

module.exports = {
  DEFAULT_MAX_BYTES,
  DEFAULT_TIMEOUT_MS,
  USER_AGENT,
  createOnionFetcher,
  createSafeLookup,
  createWebFetcher,
};
