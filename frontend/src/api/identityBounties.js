const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3009';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}/api/identity-bounties${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Identity bounty request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export const getIdentityBountyDefinition = () => request('/definition');
export const getIdentityBountyStats = () => request('/stats');

export const claimIdentityBounty = (data) => request('/claim', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateIdentityBounty = (id, data) => request(`/${id}/update`, {
  method: 'POST',
  body: JSON.stringify(data)
});

export const submitIdentityBounty = (id, participantKey) => request(`/${id}/submit`, {
  method: 'POST',
  body: JSON.stringify({ participantKey })
});

export const getIdentityBountySubmission = (id) => request(`/${id}`);
