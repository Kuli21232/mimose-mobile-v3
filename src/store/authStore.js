import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { profileApi } from '../api/profile';
import { clearServerYandexToken } from '../api/yandex';

// Safe wrapper — AsyncStorage.multiRemove may not exist on web
async function clearTokens() {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('fingerprint');
  } catch { /* ignore */ }
}

function decodeJwtPayload(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2 || !parts[1]) return null;

    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) {
      payload += '=';
    }

    const decoded = typeof atob === 'function'
      ? atob(payload)
      : Buffer.from(payload, 'base64').toString('utf8');

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  if (!exp) return false;
  return (exp * 1000) <= (Date.now() + 15_000);
}

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true while we check stored tokens on app start

  // ─── Bootstrap ─────────────────────────────────────────────────────────────
  init: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      if (isTokenExpired(token)) {
        await clearTokens();
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const { data } = await profileApi.getMe();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      await clearTokens();
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  // ─── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const { data } = await authApi.login(email, password);

    // API returns camelCase: accessToken, refreshToken, fingerprint, user, profile
    await AsyncStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
    }
    if (data.fingerprint) {
      await AsyncStorage.setItem('fingerprint', data.fingerprint);
    }

    // Login response already contains user + profile
    const user = {
      ...data.user,
      ...data.profile,
    };
    set({ user, isAuthenticated: true, isLoading: false });
    return user;
  },

  // ─── Register ───────────────────────────────────────────────────────────────
  // Register does NOT return tokens — only a "verify email" message.
  // The user must verify email first, then login.
  register: async (email, password, handle) => {
    const { data } = await authApi.register(email, password, handle);
    // data = { message, emailVerified, email }
    set({ isLoading: false });
    return data;
  },

  // ─── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    await clearTokens();
    clearServerYandexToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  // ─── Update user (after profile edit) ──────────────────────────────────────
  setUser: (user) => set({ user }),
}));

export default useAuthStore;
