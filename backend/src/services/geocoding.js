const https = require('https');

const GEOCODING_TIMEOUT = 8000;
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'Accept-Language': 'it', 'User-Agent': 'MyZubster/1.0' } },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error('Nominatim risponde ' + res.statusCode));
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.setTimeout(GEOCODING_TIMEOUT, () => {
      req.destroy(new Error('Nominatim timeout'));
    });
    req.on('error', reject);
  });
}

async function geocodeAddress(address) {
  const url = NOMINATIM_BASE + '/search?q=' + encodeURIComponent(address) + '&format=json&limit=1&addressdetails=1';
  const results = await requestJson(url);
  if (!Array.isArray(results) || results.length === 0) return null;
  const first = results[0];
  return {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
    displayName: first.display_name,
    neighborhood: (first.address && (first.address.suburb || first.address.neighbourhood)) || '',
    city: (first.address && (first.address.city || first.address.town || first.address.village || first.address.municipality)) || '',
  };
}

async function reverseGeocode(lat, lng) {
  const url = NOMINATIM_BASE + '/reverse?lat=' + lat + '&lon=' + lng + '&format=json&addressdetails=1';
  const data = await requestJson(url);
  if (!data || data.error) return null;
  return {
    displayName: data.display_name,
    address: data.display_name,
    neighborhood: (data.address && (data.address.suburb || data.address.neighbourhood)) || '',
    city: (data.address && (data.address.city || data.address.town || data.address.village || data.address.municipality)) || '',
  };
}

module.exports = { geocodeAddress, reverseGeocode };
