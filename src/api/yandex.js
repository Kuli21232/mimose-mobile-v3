import client from './client';
import useSettingsStore from '../store/settingsStore';

// ─── Server-side Yandex token cache ──────────────────────────────────────────
// Fetched once from GET /api/v3/app/config (protected) after login.
// The server holds the service token with an active Yandex Music subscription.
let _serverYandexToken = '';
let _serverTokenFetchedAt = 0;
const SERVER_TOKEN_TTL_MS = 10 * 60 * 1000; // re-fetch after 10 min

async function getServerYandexToken() {
  const now = Date.now();
  if (_serverYandexToken && (now - _serverTokenFetchedAt) < SERVER_TOKEN_TTL_MS) {
    return _serverYandexToken;
  }

  try {
    const { data } = await client.get('/api/v3/app/config');
    const token = String(data?.yandexMusicToken || '').trim();
    if (token) {
      _serverYandexToken = token;
      _serverTokenFetchedAt = now;
    }
    return token;
  } catch {
    return _serverYandexToken; // return stale on error
  }
}

// Reset when user logs out
export function clearServerYandexToken() {
  _serverYandexToken = '';
  _serverTokenFetchedAt = 0;
}

function getLocalYandexToken() {
  const ym = useSettingsStore.getState().settings.integrations.yandexMusic;
  if (!ym?.enablePlayback) return '';
  return String(ym?.token || '').trim();
}

async function getPreferredYandexToken() {
  const serverToken = await getServerYandexToken();
  const localToken = getLocalYandexToken();
  return serverToken || localToken;
}

// ─── Stream URL resolution ────────────────────────────────────────────────────
// Priority: server service token (has subscription) → local OAuth token
export async function resolveYandexStreamUrl(track) {
  if (!track) return null;

  const trackId = String(track.id || track.trackId || '');
  if (!trackId) return null;

  // 1. Get best available token (server > local)
  const token = await getPreferredYandexToken();

  if (!token) {
    console.warn('[yandexApi] No Yandex token available — cannot resolve stream URL');
    return null;
  }

  // 2. Call dev-proxy /yandex-music/resolve-stream which handles:
  //    download-info fetch → XML parse → MD5 sign → direct MP3 URL
  const isLocalDev =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window?.location?.hostname);

  // Import lazily to avoid circular dep with config
  const { LOCAL_WEB_PROXY_BASE, API_BASE } = await import('../config.js');
  const resolveBase = isLocalDev ? LOCAL_WEB_PROXY_BASE : API_BASE;
  const resolveUrl = `${resolveBase}/yandex-music/resolve-stream`;

  const albumId = String(track.albumId || track.albums?.[0]?.id || '');

  console.log('[yandexApi] resolve-stream POST →', resolveUrl, { trackId, albumId, tokenLen: token.length });
  try {
    const res = await fetch(resolveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackId,
        albumId: albumId || undefined,
        token,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[yandexApi] resolve-stream HTTP', res.status, err);
      throw new Error(err?.detail || err?.error || `resolve-stream HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log('[yandexApi] resolve-stream OK, streamUrl:', data?.streamUrl?.substring(0, 80));
    return data?.streamUrl || null;
  } catch (err) {
    console.warn('[yandexApi] resolveYandexStreamUrl error:', err?.message);
    return null;
  }
}

export async function getLyrics(track) {
  if (!track?.id) return null;

  const isLocalDev =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window?.location?.hostname);

  if (!isLocalDev) {
    return null;
  }

  const token = await getPreferredYandexToken();
  const { LOCAL_WEB_PROXY_BASE } = await import('../config.js');

  try {
    const res = await fetch(`${LOCAL_WEB_PROXY_BASE}/yandex-music/lyrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackId: String(track.id || ''),
        token: token || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || err?.error || `lyrics HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('[yandexApi] getLyrics error:', err?.message);
    return null;
  }
}

// ─── API methods ──────────────────────────────────────────────────────────────
export const yandexApi = {
  getChart: () =>
    client.get('/api/v3/yandex/chart'),

  getTopArtists: () =>
    client.get('/api/v3/yandex/artists'),

  search: (query, type) =>
    client.get('/api/v3/yandex/search', { params: { q: query, type } }),

  getTrack: (id) =>
    client.get(`/api/v3/yandex/tracks/${id}`),

  getArtistTracks: (id) =>
    client.get(`/api/v3/yandex/artists/${id}/tracks`),

  getArtistAlbums: (id) =>
    client.get(`/api/v3/yandex/artists/${id}/albums`),

  getArtistInfo: (id) =>
    client.get(`/api/v3/yandex/artists/${id}/info`),

  getArtistLatestRelease: (id) =>
    client.get(`/api/v3/yandex/artists/${id}/latest-release`),

  getAlbumWithTracks: (id) =>
    client.get(`/api/v3/yandex/albums/${id}/with-tracks`),

  getOAuthUrl: async () => {
    const { data } = await client.get('/api/v3/yandex/oauth/url');
    return {
      authUrl: data?.authUrl || data?.url || data?.oauthUrl || '',
      state: data?.state || data?.oauthState || '',
      raw: data,
    };
  },

  getOAuthPending: async (state) => {
    const { data } = await client.get(`/api/v3/yandex/oauth/pending/${encodeURIComponent(state)}`);
    return {
      pending: Boolean(data?.pending),
      code: data?.code || data?.oauthCode || data?.authCode || data?.data?.code || null,
      error: data?.error || data?.detail || data?.message || '',
      raw: data,
    };
  },

  getOAuthPlaylists: async (code) => {
    const { data } = await client.post('/api/v3/yandex/oauth/playlists', {
      code: String(code || '').trim(),
    });
    return {
      playlists: Array.isArray(data?.playlists) ? data.playlists : [],
      login: data?.login || '',
      token: data?.token || data?.accessToken || data?.access_token || data?.data?.token || null,
      error: data?.error || data?.detail || data?.message || '',
      raw: data,
    };
  },

  getLyrics,
  resolveYandexStreamUrl,
};
