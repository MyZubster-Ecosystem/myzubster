// OpenStreetMap Service
// Handles Nominatim, OSRM, and Overpass API calls

const https = require('https');
const http = require('http');

class OSMService {
  constructor() {
    this.nominatimBase = 'https://nominatim.openstreetmap.org';
    this.osrmBase = 'https://router.project-osrm.org';
    this.overpassBase = 'https://overpass-api.de/api/interpreter';
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  // ── HTTP Request Helper ──
  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'MyZubster/1.0 (https://github.com/MyZubster-Ecosystem/myzubster)',
          'Accept': 'application/json',
          ...options.headers,
        },
      };

      const req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  // ── Cache Helper ──
  getCached(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheTTL) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
    // Cleanup old entries
    if (this.cache.size > 1000) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 100);
      oldest.forEach(([k]) => this.cache.delete(k));
    }
  }

  // ── Nominatim: Geocoding ──
  async geocode(query, options = {}) {
    const cacheKey = `geocode:${query}:${JSON.stringify(options)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: options.limit || 5,
      addressdetails: 1,
      extratags: 1,
      namedetails: 1,
    });

    if (options.viewbox) {
      params.append('viewbox', options.viewbox);
      params.append('bounded', '0');
    }

    if (options.countrycodes) {
      params.append('countrycodes', options.countrycodes);
    }

    const result = await this.request(`${this.nominatimBase}/search?${params}`);
    this.setCache(cacheKey, result);
    return result;
  }

  // ── Nominatim: Reverse Geocoding ──
  async reverseGeocode(lat, lon, options = {}) {
    const cacheKey = `reverse:${lat}:${lon}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      lat,
      lon,
      format: 'json',
      addressdetails: 1,
      extratags: 1,
    });

    const result = await this.request(`${this.nominatimBase}/reverse?${params}`);
    this.setCache(cacheKey, result);
    return result;
  }

  // ── OSRM: Routing ──
  async getRoute(coordinates, options = {}) {
    const cacheKey = `route:${JSON.stringify(coordinates)}:${options.profile || 'foot'}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const profile = options.profile || 'foot'; // foot, car, bike
    const coords = coordinates.map(c => `${c.lon},${c.lat}`).join(';');
    
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      annotations: 'true',
    });

    if (options.roundtrip === false) {
      params.append('roundtrip', 'false');
    }

    const result = await this.request(
      `${this.osrmBase}/route/v1/${profile}/${coords}?${params}`
    );
    
    if (result.code === 'Ok' && result.routes && result.routes[0]) {
      const route = result.routes[0];
      const formatted = {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: route.geometry,
        steps: route.legs[0].steps.map(step => ({
          instruction: step.maneuver.type,
          name: step.name,
          distance: step.distance,
          duration: step.duration,
          geometry: step.geometry,
        })),
      };
      this.setCache(cacheKey, formatted);
      return formatted;
    }
    
    throw new Error('Route not found');
  }

  // ── Overpass: POI Search ──
  async searchPOI(bounds, query, options = {}) {
    const cacheKey = `poi:${bounds}:${query}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const [south, west, north, east] = bounds;
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["${query}"](${south},${west},${north},${east});
        way["${query}"](${south},${west},${north},${east});
      );
      out body;
      >;
      out skel qt;
    `;

    const result = await this.request(this.overpassBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    const features = this._parseOverpassResult(result);
    this.setCache(cacheKey, features);
    return features;
  }

  // ── Overpass: Custom Query ──
  async overpassQuery(query) {
    const cacheKey = `overpass:${query.substring(0, 100)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const result = await this.request(this.overpassBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    const features = this._parseOverpassResult(result);
    this.setCache(cacheKey, features);
    return features;
  }

  // ── Parse Overpass Result ──
  _parseOverpassResult(result) {
    if (!result || !result.elements) return [];

    const nodes = {};
    const features = [];

    result.elements.forEach(el => {
      if (el.type === 'node') {
        nodes[el.id] = { lat: el.lat, lon: el.lon };
        if (el.tags) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [el.lon, el.lat],
            },
            properties: {
              id: el.id,
              ...el.tags,
            },
          });
        }
      }
    });

    return features;
  }

  // ── Search Gardens ──
  async searchGardens(query, options = {}) {
    const results = await this.geocode(query, { limit: 10, ...options });
    return results
      .filter(r => r.type === 'way' || r.type === 'relation' || 
        r.class?.includes('garden') || r.class?.includes('park') ||
        r.type?.includes('gardens'))
      .map(r => ({
        name: r.namedetails?.name || r.display_name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        type: r.type,
        category: r.class,
        address: r.address,
        boundingbox: r.boundingbox,
      }));
  }

  // ── Search Nurseries ──
  async searchNurseries(bounds) {
    return this.searchPOI(bounds, 'shop=garden_centre');
  }

  // ── Search Markets ──
  async searchMarkets(bounds) {
    return this.searchPOI(bounds, 'amenity=marketplace');
  }

  // ── Get Garden Boundaries ──
  async getGardenBoundaries(gardenId) {
    const query = `
      [out:json][timeout:25];
      relation(${gardenId});
      out body;
      >;
      out skel qt;
    `;
    return this.overpassQuery(query);
  }

  // ── Calculate Distance ──
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // ── Get Cache Stats ──
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 1000,
    };
  }
}

module.exports = new OSMService();
