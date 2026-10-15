const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    const extra = Array.isArray(details) && details.length
      ? `: ${details.map((d) => d.message).join(', ')}`
      : '';
    super(message + extra);
    this.status = status;
  }
}

export const tokens = {
  get: () => ({
    access: localStorage.getItem('rms_access'),
    refresh: localStorage.getItem('rms_refresh'),
  }),
  set: (access, refresh) => {
    localStorage.setItem('rms_access', access);
    localStorage.setItem('rms_refresh', refresh);
  },
  clear: () => {
    localStorage.removeItem('rms_access');
    localStorage.removeItem('rms_refresh');
    localStorage.removeItem('rms_user');
  },
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

let refreshing = null;

async function refreshAccess() {
  const { refresh } = tokens.get();
  if (!refresh) throw new Error('No refresh token');
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) throw new Error('Session expired');
  const data = await res.json();
  tokens.set(data.accessToken, data.refreshToken);
  localStorage.setItem('rms_user', JSON.stringify(data.user));
}

async function request(path, opts = {}, retry = true) {
  const { method = 'GET', body, params, isForm = false } = opts;

  const qs = params
    ? new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      ).toString()
    : '';

  const headers = {};
  const { access } = tokens.get();
  if (access) headers.Authorization = `Bearer ${access}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?');
  }

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    try {
      refreshing = refreshing || refreshAccess();
      await refreshing;
    } catch {
      onUnauthorized();
      throw new ApiError('Session expired. Please sign in again.', 401);
    } finally {
      refreshing = null;
    }
    return request(path, opts, false);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message || 'Request failed', res.status, data?.details);
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
};