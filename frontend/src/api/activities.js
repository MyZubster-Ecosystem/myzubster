const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const fetchActivities = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.garden) params.append('garden', filters.garden);
  if (filters.plantType) params.append('plantType', filters.plantType);
  if (filters.type) params.append('type', filters.type);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const url = `${API_URL}/api/activities?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
};

export const createActivity = async (activityData) => {
  const response = await fetch(`${API_URL}/api/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData),
  });
  if (!response.ok) {
    throw new Error('Failed to create activity');
  }
  return response.json();
};

export const getActivityStreamUrl = () => `${API_URL}/api/activities/stream`;
