const GEOCODING_TIMEOUT = 8000;
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

async function geocodeAddress(address) {
  const url = NOMINATIM_BASE + '/search?q=' + encodeURIComponent(address) + '&format=json&limit=1&addressdetails=1';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOCODING_TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'it', 'User-Agent': 'MyZubster/1.0' },
    });
    if (!response.ok) throw new Error('Nominatim risponde ' + response.status);
    const results = await response.json();
    if (!results || results.length === 0) return null;
    const first = results[0];
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayName: first.display_name,
      neighborhood: (first.address && (first.address.suburb || first.address.neighbourhood)) || '',
      city: (first.address && (first.address.city || first.address.town || first.address.village || first.address.municipality)) || '',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function reverseGeocode(lat, lng) {
  const url = NOMINATIM_BASE + '/reverse?lat=' + lat + '&lon=' + lng + '&format=json&addressdetails=1';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOCODING_TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'it', 'User-Agent': 'MyZubster/1.0' },
    });
    if (!response.ok) throw new Error('Nominatim risponde ' + response.status);
    const data = await response.json();
    if (!data || data.error) return null;
    return {
      displayName: data.display_name,
      address: data.display_name,
      neighborhood: (data.address && (data.address.suburb || data.address.neighbourhood)) || '',
      city: (data.address && (data.address.city || data.address.town || data.address.village || data.address.municipality)) || '',
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { geocodeAddress, reverseGeocode };
