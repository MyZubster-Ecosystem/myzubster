const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3009';

const appendDefined = (params, key, value) => {
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    params.append(key, String(value).trim());
  }
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeCoordinates = (item = {}) => {
  const source = item.gps || item.coordinates || {};
  const lat = toNumber(source.lat);
  const lng = toNumber(source.lng);

  if (lat === null || lng === null) return null;
  return { lat, lng };
};

const normalizeGardenAsPlant = (item = {}) => {
  const gps = normalizeCoordinates(item);
  const commonName = item.commonName || item.name || 'Community garden';
  const locationParts = [item.neighborhood, item.city].filter(Boolean);

  return {
    ...item,
    _id: item._id || item.id,
    commonName,
    species: item.species || item.type || 'Garden',
    status: item.status || (item.isActive === false ? 'inactive' : 'verified'),
    gps,
    locationLabel: locationParts.join(', '),
  };
};

const normalizePlantResponse = (payload = {}) => {
  const items = Array.isArray(payload)
    ? payload
    : payload.plants || payload.data || payload.gardens || [];

  return {
    ...payload,
    plants: items.map(normalizeGardenAsPlant).filter((plant) => plant.gps),
    searchCenter: payload.searchCenter || null,
  };
};

const requestJson = async (path) => {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};

export const getPlants = async (filters = {}) => {
  const params = new URLSearchParams();
  appendDefined(params, 'q', filters.query || filters.species);
  appendDefined(params, 'city', filters.city);
  appendDefined(params, 'neighborhood', filters.neighborhood);
  appendDefined(params, 'lat', filters.lat);
  appendDefined(params, 'lng', filters.lng);
  appendDefined(params, 'radius', filters.radius);

  const query = params.toString();
  const payload = await requestJson(`/api/gardens${query ? `?${query}` : ''}`);
  return normalizePlantResponse(payload);
};

export const searchPlantsByArea = async ({ query, lat, lng, radius = 10 } = {}) => {
  const params = new URLSearchParams();
  appendDefined(params, 'q', query);
  appendDefined(params, 'lat', lat);
  appendDefined(params, 'lng', lng);
  appendDefined(params, 'radius', radius);

  const payload = await requestJson(`/api/gardens/search?${params.toString()}`);
  const normalized = normalizePlantResponse(payload);

  return {
    ...normalized,
    searchCenter: normalized.searchCenter || (
      lat !== undefined && lng !== undefined ? { lat: toNumber(lat), lng: toNumber(lng) } : null
    ),
  };
};

export const getPlantById = async (id) => {
  const payload = await requestJson(`/api/gardens/${id}`);
  return normalizeGardenAsPlant(payload.data || payload);
};

export const registerPlant = async (plantData, token) => {
  const response = await fetch(`${API_URL}/api/gardens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(plantData),
  });

  if (!response.ok) {
    throw new Error('Failed to register plant');
  }

  const payload = await response.json();
  return normalizeGardenAsPlant(payload.data || payload);
};
