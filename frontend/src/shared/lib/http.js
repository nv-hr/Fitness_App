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

/**
 * Stream responses using Server-Sent Events (SSE).
 *
 * @param {string} path - API path.
 * @param {object} body - Request payload.
 * @param {Function} onChunk - Callback for intermediate text tokens.
 * @param {Function} onDone - Callback for the final completed plan object.
 * @param {Function} onError - Callback for any errors encountered.
 */
export async function fetchSseStream(path, body, onChunk, onDone, onError) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!response.ok) {
      let errMsg = 'Request failed';
      try {
        const errJson = await response.json();
        errMsg = errJson.error?.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'chunk') {
            onChunk(parsed.content);
          } else if (parsed.type === 'done') {
            onDone(parsed.plan);
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message);
          }
        } catch (e) {
          onError(e);
        }
      }
    }
  } catch (err) {
    onError(err);
  }
}
