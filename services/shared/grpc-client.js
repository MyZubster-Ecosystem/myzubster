/**
 * Inter-service communication client
 * Supports REST (default) and gRPC for service-to-service calls
 */
const http = require('http');

class ServiceClient {
  constructor(serviceName, baseUrl) {
    this.serviceName = serviceName;
    this.baseUrl = baseUrl;
  }

  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ raw: body });
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  get(path) { return this.request('GET', path); }
  post(path, data) { return this.request('POST', path, data); }
  put(path, data) { return this.request('PUT', path, data); }
  delete(path) { return this.request('DELETE', path); }
}

// Service discovery via environment variables
const services = {
  auth: new ServiceClient('auth', process.env.AUTH_SERVICE_URL || 'http://localhost:3001'),
  garden: new ServiceClient('garden', process.env.GARDEN_SERVICE_URL || 'http://localhost:3002'),
  bounty: new ServiceClient('bounty', process.env.BOUNTY_SERVICE_URL || 'http://localhost:3003'),
  nft: new ServiceClient('nft', process.env.NFT_SERVICE_URL || 'http://localhost:3004'),
  notification: new ServiceClient('notification', process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005')
};

module.exports = { ServiceClient, services };
