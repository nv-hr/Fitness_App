/**
 * http.js — Shared HTTP client for all API calls.
 *
 * Why: Centralising fetch logic here means every feature module gets
 * cookie-based auth (credentials: 'include'), consistent error shaping,
 * and graceful handling of non-JSON responses (rate-limiter plain-text, etc.)
 * without each feature needing to handle these edge cases itself.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Base fetch wrapper. Automatically includes credentials and serialises
 * JSON errors into thrown `Error` instances with `.retryAfter` and `.code`.
 *
 * @param {string} path       - API path, e.g. '/api/profile'.
 * @param {RequestInit} [options] - Standard fetch options (method, body, headers, …).
 * @returns {Promise<any>}    - Parsed JSON response body.
 * @throws {Error}            - On non-2xx responses; error may have `.retryAfter` and `.code`.
 */
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
    const err = new Error(data.error?.message || 'Request failed');
    err.retryAfter = data.error?.retryAfter;
    err.code = data.error?.code;
    throw err;
  }

  return data;
}

/**
 * Convenience wrapper for GET requests.
 *
 * @param {string} path - API path.
 * @returns {Promise<any>}
 */
export async function apiGet(path) {
  return apiFetch(path, { method: 'GET' });
}

/**
 * Convenience wrapper for POST requests.
 *
 * @param {string}      path - API path.
 * @param {object|null} body - Request payload; serialised to JSON automatically.
 * @returns {Promise<any>}
 */
export async function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    body: body !== null ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience wrapper for DELETE requests.
 *
 * @param {string} path - API path.
 * @returns {Promise<any>}
 */
export async function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' });
}
