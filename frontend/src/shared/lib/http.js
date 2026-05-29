const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle both JSON and non-JSON responses defensively
  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // Non-JSON response (e.g., rate limiter text/plain, server error HTML)
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || 'Request failed');
    }
    data = text;
  }

  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}

export async function apiGet(path) {
  return apiFetch(path, { method: 'GET' });
}

export async function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    body: body !== null ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' });
}
