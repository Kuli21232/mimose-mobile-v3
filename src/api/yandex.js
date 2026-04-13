import client from './client';
import useSettingsStore from '../store/settingsStore';
import CryptoJS from 'crypto-js';

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

const YANDEX_SIGN_SALT = 'XGRlBW9FXlekgbPrRHuSiA';
const YANDEX_MUSIC_API = 'https://api.music.yandex.net';

function extractXmlValue(xml, tagName) {
  const match = String(xml || '').match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`));
  return match ? match[1] : '';
}

async function resolveStreamClientSide(trackId, albumId, token) {
  const trackKey = albumId ? `${trackId}:${albumId}` : trackId;

  // 1. Fetch download-info from Yandex
  const diRes = await fetch(`${YANDEX_MUSIC_API}/tracks/${trackKey}/download-info`, {
    headers: { Authorization: `OAuth ${token}` },
  });
  if (!diRes.ok) throw new Error(`download-info HTTP ${diRes.status}`);

  const diData = await diRes.json();
  const items = Array.isArray(diData?.result) ? diData.result : [];

  // 2. Pick best bitrate
  const bestItem = [...items]
    .sort((a, b) => (b.bitrateInKbps || 0) - (a.bitrateInKbps || 0))
    .find((i) => i.downloadInfoUrl);
  if (!bestItem?.downloadInfoUrl) throw new Error('no downloadInfoUrl in download-info');

  // 3. Fetch the XML with the signing parts
  const xmlRes = await fetch(bestItem.downloadInfoUrl, {
    headers: { Authorization: `OAuth ${token}` },
  });
  if (!xmlRes.ok) throw new Error(`download-info XML HTTP ${xmlRes.status}`);
  const xml = await xmlRes.text();

  const host = extractXmlValue(xml, 'host');
  const path = extractXmlValue(xml, 'path');
  const ts = extractXmlValue(xml, 'ts');
  const s = extractXmlValue(xml, 's');
  if (!host || !path || !ts || !s) throw new Error('invalid download-info XML');

  // 4. Build signed MP3 URL
  const sign = CryptoJS.MD5(YANDEX_SIGN_SALT + path.slice(1) + s).toString();
  return `https://${host}/get-mp3/${sign}/${ts}${path}`;
}

export async function resolveYandexStreamUrl(track) {
  if (!track) return null;

  const trackId = String(track.id || track.trackId || '');
  if (!trackId) return null;

  const token = await getPreferredYandexToken();
  if (!token) {
    console.warn('[yandexApi] No Yandex token available — cannot resolve stream URL');
    return null;
  }

  const albumId = String(track.albumId || track.albums?.[0]?.id || '');

  // In local web dev, use the dev-proxy (handles CORS)
  const isLocalWeb =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window?.location?.hostname);

  if (isLocalWeb) {
    const { LOCAL_WEB_PROXY_BASE } = await import('../config.js');
    const resolveUrl = `${LOCAL_WEB_PROXY_BASE}/yandex-music/resolve-stream`;
    console.log('[yandexApi] resolve-stream POST →', resolveUrl, { trackId, albumId, tokenLen: token.length });
    try {
      const res = await fetch(resolveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, albumId: albumId || undefined, token }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
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

  // On native / production — resolve directly (no CORS restrictions)
  console.log('[yandexApi] resolving stream client-side', { trackId, albumId, tokenLen: token.length });
  try {
    const streamUrl = await resolveStreamClientSide(trackId, albumId, token);
    console.log('[yandexApi] resolve OK, streamUrl:', streamUrl?.substring(0, 80));
    return streamUrl;
  } catch (err) {
    console.warn('[yandexApi] resolveYandexStreamUrl client-side error:', err?.message);
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
