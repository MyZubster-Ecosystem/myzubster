/**
 * Servizio di geocoding via OpenStreetMap Nominatim.
 * Converte indirizzi testuali in coordinate GPS e viceversa.
 * Rispetta la policy di Nominatim: max 1 richiesta/sec, User-Agent obbligatorio.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'MyZubster/1.0 (geolocalizzazione-orti)';
const REQUEST_DELAY = 1100; // 1.1 secondi tra le richieste

let lastRequestTime = 0;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Geocodifica un indirizzo testuale in coordinate GPS.
 * @param {string} q - Query di ricerca (es. "Via Roma 10, Milano")
 * @param {object} [options] - Opzioni aggiuntive
 * @param {string} [options.countrycodes='it'] - Codici paese ISO
 * @param {number} [options.limit=5] - Numero massimo risultati
 * @returns {Promise<Array>} Array di risultati con lat, lon, display_name
 */
async function geocode(q, options = {}) {
  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: 1,
    limit: options.limit || 5,
    countrycodes: options.countrycodes || 'it',
    'accept-language': 'it'
  });

  // Rispetta rate limit
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY) {
    await delay(REQUEST_DELAY - elapsed);
  }
  lastRequestTime = Date.now();

  const url = `${NOMINATIM_URL}/search?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const data = await response.json();
  return data.map(item => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    display_name: item.display_name,
    address: item.address || {},
    type: item.type,
    importance: item.importance
  }));
}

/**
 * Reverse geocoding: converte coordinate GPS in indirizzo.
 * @param {number} lat - Latitudine
 * @param {number} lng - Longitudine
 * @returns {Promise<Object>} Indirizzo formattato
 */
async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    lat,
    lon: lng,
    format: 'json',
    addressdetails: 1,
    'accept-language': 'it'
  });

  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY) {
    await delay(REQUEST_DELAY - elapsed);
  }
  lastRequestTime = Date.now();

  const url = `${NOMINATIM_URL}/reverse?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse error: ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.error) return null;

  return {
    lat: parseFloat(data.lat),
    lng: parseFloat(data.lon),
    display_name: data.display_name,
    address: data.address || {}
  };
}

/**
 * Estrae i campi indirizzo strutturati da un risultato Nominatim.
 * @param {Object} nominatimAddress - Oggetto address di Nominatim
 * @returns {Object} Campi indirizzo per il modello Plant
 */
function extractAddress(nominatimAddress) {
  const addr = nominatimAddress || {};
  return {
    via: addr.road || addr.pedestrian || addr.path || null,
    quartiere: addr.suburb || addr.neighbourhood || addr.city_district || addr.village || addr.town || null,
    citta: addr.city || addr.town || addr.municipality || null,
    cap: addr.postcode || null,
    regione: addr.state || addr.region || null,
    paese: addr.country || 'Italia'
  };
}

module.exports = { geocode, reverseGeocode, extractAddress };
