// Mimose API configuration

const runtimeEnv = typeof process !== 'undefined' ? process.env || {} : {};

const isLocalWebDebug =
  typeof window !== 'undefined' &&
  typeof window.location !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const UPSTREAM_API_BASE = 'https://api.mimose.fun';
export const UPSTREAM_PROXY_BASE = 'http://89.19.210.40:8080';
export const LOCAL_WEB_PROXY_BASE = 'http://localhost:8787';
export const YANDEX_MUSIC_API_BASE = isLocalWebDebug
  ? `${LOCAL_WEB_PROXY_BASE}/yandex-music`
  : 'https://api.music.yandex.net';

// In web-debug we talk to a local proxy to avoid browser CORS restrictions.
export const API_BASE = isLocalWebDebug ? LOCAL_WEB_PROXY_BASE : UPSTREAM_API_BASE;
export const PROXY_BASE = isLocalWebDebug ? LOCAL_WEB_PROXY_BASE : UPSTREAM_PROXY_BASE;

// SignatureRequired spec from MOBILE_DEV_GUIDE.md:
// - X-Signature: HMAC-SHA256 hex
// - X-Timestamp: unix seconds
// - X-Nonce: UUID v4
// The real SIGNATURE_KEY still needs to be provided from backend secrets.
export const SIGNATURE_KEY_HEX =
  runtimeEnv.EXPO_PUBLIC_MIMOSE_SIGNATURE_KEY_HEX ||
  runtimeEnv.MIMOSE_SIGNATURE_KEY_HEX ||
  '7272727272727272727272727272727272727272727272727272727272727272';
export const SIGNATURE_KEY =
  runtimeEnv.EXPO_PUBLIC_MIMOSE_SIGNATURE_KEY ||
  runtimeEnv.MIMOSE_SIGNATURE_KEY ||
  'mimose-app-secret';
export const SIGNATURE_HEADER = 'X-Signature';
export const TIMESTAMP_HEADER = 'X-Timestamp';
export const NONCE_HEADER = 'X-Nonce';

// Protected endpoints also expect device headers.
export const DEVICE_HWID_HEADER = 'X-Device-HWID';
export const DEVICE_MARKER_HEADER = 'X-Device-Marker';
export const DEVICE_WEBVIEW_FP_HEADER = 'X-Device-WebViewFP';
export const DEFAULT_ORIGIN = 'tauri://localhost';

// Legacy alias used by older code paths.
export const APP_SECRET = SIGNATURE_KEY;

export const audioUrl = (trackId, source = 'yandex') =>
  `${PROXY_BASE}/audio/${source}/${trackId}`;

// Proxy an image through the Rust proxy server (cached 1h, handles CORS).
// coverUri may be a Yandex "%%"-template or a bare domain (no scheme).
export const imageProxyUrl = (coverUri, size = '200x200') => {
  if (!coverUri) return null;
  let url = String(coverUri).replace('%%', size);
  if (url.startsWith('//')) url = 'https:' + url;
  else if (!url.startsWith('http')) url = 'https://' + url;
  return `${PROXY_BASE}/image/${encodeURIComponent(url)}`;
};
