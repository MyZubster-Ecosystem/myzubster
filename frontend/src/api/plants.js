const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const getPlants = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.species) params.append('species', filters.species);
  if (filters.size) params.append('size', filters.size);
  if (filters.status) params.append('status', filters.status);
  
  const url = `${API_URL}/api/plants?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch plants');
  }
  
  return response.json();
};

export const getPlantById = async (id) => {
  const response = await fetch(`${API_URL}/api/plants/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch plant');
  }
  return response.json();
};

export const registerPlant = async (plantData, token) => {
  const response = await fetch(`${API_URL}/api/plants/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(plantData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to register plant');
  }
  
  return response.json();
};
