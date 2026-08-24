// Gardens is served by the same Vercel application. Keeping these requests
// same-origin avoids mixed-content failures when legacy build variables still
// point at the retired HTTP service.
const apiUrl = (path) => path;

/**
 * Ottiene l'elenco di tutti gli orti.
 * @param {Object} [filters] - { status, size }
 * @returns {Promise<{success:boolean, total:number, gardens:Array}>}
 */
export const getGardens = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.size) params.append('size', filters.size);

  const res = await fetch(apiUrl(`/api/gardens?${params.toString()}`));
  if (!res.ok) throw new Error('Errore recupero orti');
  return res.json();
};

/**
 * Ottiene un orto per ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const getGardenById = async (id) => {
  const res = await fetch(apiUrl(`/api/gardens/${id}`));
  if (!res.ok) throw new Error('Orto non trovato');
  return res.json();
};

/**
 * Crea un nuovo orto (con geocoding automatico se fornito l'indirizzo).
 * @param {Object} data - { name, description?, address?, gps?:{lat,lng}, size?, ownerId? }
 * @returns {Promise<Object>}
 */
export const createGarden = async (data) => {
  const res = await fetch(apiUrl('/api/gardens'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Errore creazione orto');
  return res.json();
};

/**
 * Ricerca testuale orti (q) – con fallback geocoding automatico.
 * @param {string} q - query di ricerca
 * @returns {Promise<Object>}
 */
export const searchGardens = async (q) => {
  const res = await fetch(apiUrl(`/api/gardens/search?q=${encodeURIComponent(q)}`));
  if (!res.ok) throw new Error('Errore ricerca orti');
  return res.json();
};

/**
 * Ricerca orti per coordinate geografiche.
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radius=5000] - metri
 * @returns {Promise<Object>}
 */
export const nearbyGardens = async (lat, lng, radius = 5000) => {
  const res = await fetch(apiUrl(`/api/gardens/nearby?lat=${lat}&lng=${lng}&radius=${radius}`));
  if (!res.ok) throw new Error('Errore ricerca per coordinate');
  return res.json();
};

/**
 * Geocodifica un indirizzo (solo utility, non salva).
 * @param {string} q
 * @returns {Promise<Object>}
 */
export const geocodeAddress = async (q) => {
  const res = await fetch(apiUrl(`/api/gardens/geocode?q=${encodeURIComponent(q)}`));
  if (!res.ok) throw new Error('Errore geocoding');
  return res.json();
};
