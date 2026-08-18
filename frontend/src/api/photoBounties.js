const API_URL = process.env.REACT_APP_API_URL || '';

function getToken() {
  return (
    localStorage.getItem('myzubster_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function getPhotoBounties() {
  const res = await fetch(`${API_URL}/api/photo-bounties`);
  return parseResponse(res);
}

export async function submitPhotoBounty(bountyId, photoId) {
  const token = getToken();

  if (!token) {
    throw new Error('Login required: authentication token not found');
  }

  const res = await fetch(
    `${API_URL}/api/photo-bounties/${encodeURIComponent(bountyId)}/submit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ photoId }),
    }
  );

  return parseResponse(res);
}
