const https = require('https');
const http = require('http');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function request(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            reject(new Error(`Nominatim error ${res.statusCode}: ${data}`));
          }
        });
      })
      .on('error', reject);
  });
}

async function searchPlaces(query) {
  const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  const results = await request(url);
  return results.map((item) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type,
    importance: item.importance,
  }));
}

async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}`;
  const result = await request(url);
  return {
    displayName: result.display_name,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
  };
}

module.exports = {
  searchPlaces,
  reverseGeocode,
};
