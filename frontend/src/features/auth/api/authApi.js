import { apiGet, apiPost, apiFetch } from '../../../shared/lib/http.js';

export async function register(data) {
  return apiPost('/api/auth/register', {
    email: data.email,
    password: data.password,
    pdpConsent: data.pdpConsent,
  });
}

export async function login(data) {
  return apiPost('/api/auth/login', {
    email: data.email,
    password: data.password,
  });
}

export async function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return apiGet('/api/auth/me');
}
