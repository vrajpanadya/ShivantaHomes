import axios from 'axios';

export const TOKEN_KEY = 'sh_token';

/** localStorage can throw inside embedded/third-party contexts — never let that break a request. */
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable — the HTTP-only cookie still carries the session */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 30000 });

api.interceptors.request.use((config) => {
  // Marks requests as coming from our SPA (CSRF guard for cookie sessions).
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  // Token travels in a custom header: some reverse proxies strip or repurpose `Authorization`.
  const t = tokenStore.get();
  if (t) config.headers['X-Auth-Token'] = t;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const onAdmin = window.location.pathname.startsWith('/admin');
    const onAuthPage = /\/admin\/(login|reset)/.test(window.location.pathname);
    const isSessionProbe = String(err.config?.url ?? '').includes('/auth/me');
    if (err.response?.status === 401 && onAdmin && !onAuthPage && !isSessionProbe) {
      tokenStore.clear();
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export default api;
