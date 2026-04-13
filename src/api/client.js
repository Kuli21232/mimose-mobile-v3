import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';
import {
  API_BASE,
  DEFAULT_ORIGIN,
  DEVICE_HWID_HEADER,
  DEVICE_MARKER_HEADER,
  DEVICE_WEBVIEW_FP_HEADER,
  NONCE_HEADER,
  SIGNATURE_HEADER,
  SIGNATURE_KEY,
  SIGNATURE_KEY_HEX,
  TIMESTAMP_HEADER,
} from '../config';

const DEVICE_HWID_STORAGE_KEY = '@mimose_device_hwid';
const DEVICE_MARKER_STORAGE_KEY = '@mimose_device_marker';
const CAN_SET_ORIGIN_HEADER = Platform.OS !== 'web' || typeof window === 'undefined';
const PUBLIC_REQUEST_PATTERNS = [
  /^\/api\/v3\/auth\/login$/,
  /^\/api\/v3\/auth\/register$/,
  /^\/api\/v3\/auth\/check-handle(?:\/|$)/,
  /^\/api\/v3\/auth\/verify-email(?:\/|$)/,
  /^\/api\/v3\/auth\/reset-password(?:\/|$)/,
  /^\/api\/v3\/yandex\/oauth(?:\/|$)/,
];

let serverTimeOffsetMs = 0;
let lastTimeSyncAt = 0;

async function clearStoredAuthArtifacts() {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('fingerprint');
  } catch {
    // ignore storage cleanup errors on web
  }
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getCryptoImpl() {
  return globalThis.crypto?.subtle || null;
}

function getRandomValues(length = 16) {
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }

  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function hexToBytes(value) {
  if (!value || value.length % 2 !== 0 || /[^0-9a-f]/i.test(value)) return null;

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function getSignatureKeyBytes(fallbackKey = '') {
  const hexBytes = hexToBytes(SIGNATURE_KEY_HEX);
  if (hexBytes) return hexBytes;

  return new TextEncoder().encode(fallbackKey || SIGNATURE_KEY);
}

function generateUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  const bytes = getRandomValues(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function getOriginValue() {
  return DEFAULT_ORIGIN;
}

function getDeviceMarkerValue() {
  const userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || 'unknown';
  const normalized = userAgent.replace(/\s+/g, '-').slice(0, 48) || 'unknown';
  return `mimose-${normalized}`.toLowerCase();
}

async function sha256Hex(value) {
  const subtle = getCryptoImpl();
  if (!subtle) {
    return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
  }

  const data = new TextEncoder().encode(value);
  const digest = await subtle.digest('SHA-256', data);
  return bufferToHex(digest);
}

async function hmacSha256Hex(key, message) {
  const subtle = getCryptoImpl();
  if (!subtle) {
    const keyHex = bufferToHex(getSignatureKeyBytes(key));
    return CryptoJS
      .HmacSHA256(message, CryptoJS.enc.Hex.parse(keyHex))
      .toString(CryptoJS.enc.Hex);
  }

  const cryptoKey = await subtle.importKey(
    'raw',
    getSignatureKeyBytes(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return bufferToHex(signature);
}

async function getOrCreateStoredValue(storageKey, factory) {
  const existing = await AsyncStorage.getItem(storageKey);
  if (existing) return existing;

  const nextValue = factory();
  await AsyncStorage.setItem(storageKey, nextValue);
  return nextValue;
}

async function getDeviceHeaders() {
  const hwid = await getOrCreateStoredValue(DEVICE_HWID_STORAGE_KEY, generateUuid);
  const marker = await getOrCreateStoredValue(DEVICE_MARKER_STORAGE_KEY, getDeviceMarkerValue);

  return {
    [DEVICE_HWID_HEADER]: hwid,
    [DEVICE_MARKER_HEADER]: marker,
  };
}

function buildSigningPath(config) {
  const rawUri = axios.getUri(config);
  const parsed = new URL(rawUri, API_BASE);
  const pathWithQuery = `${parsed.pathname}${parsed.search || ''}` || '/';

  return pathWithQuery.startsWith('/api/v3')
    ? pathWithQuery.replace('/api/v3', '') || '/'
    : pathWithQuery;
}

function getRequestPathname(config) {
  const rawUri = axios.getUri(config);
  return new URL(rawUri, API_BASE).pathname;
}

function isPublicRequest(config) {
  const pathname = getRequestPathname(config);
  return PUBLIC_REQUEST_PATTERNS.some((pattern) => pattern.test(pathname));
}

function getContentTypeHeader(headers = {}) {
  return String(headers['Content-Type'] || headers['content-type'] || '');
}

function prepareRequestBody(config) {
  const method = String(config.method || 'GET').toUpperCase();
  if (['GET', 'DELETE', 'HEAD'].includes(method)) return '';

  const contentType = getContentTypeHeader(config.headers);
  if (contentType.startsWith('multipart/')) return '';

  const body = config.data;
  if (body == null) return '';
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) {
    const serialized = body.toString();
    config.data = serialized;
    return serialized;
  }

  try {
    const serialized = JSON.stringify(body);
    config.data = serialized;
    return serialized;
  } catch {
    return '';
  }
}

function normalizeBody(config) {
  const method = String(config.method || 'GET').toUpperCase();
  if (['GET', 'DELETE', 'HEAD'].includes(method)) return '';

  const contentType = getContentTypeHeader(config.headers);
  if (contentType.startsWith('multipart/')) return '';

  const body = config.data;
  if (body == null) return '';
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();

  try {
    return JSON.stringify(body);
  } catch {
    return '';
  }
}

async function syncServerTimeIfNeeded() {
  const now = Date.now();
  if (now - lastTimeSyncAt < 5 * 60 * 1000) return;

  try {
    const requestConfig = { timeout: 5000 };
    if (CAN_SET_ORIGIN_HEADER) {
      requestConfig.headers = { Origin: getOriginValue() };
    }

    const response = await axios.get(`${API_BASE}/api/v3/time`, requestConfig);
    const rawTimestamp =
      response.data?.timestamp ??
      response.data?.time ??
      response.data?.unix ??
      response.data;

    const timestampMs = Number(rawTimestamp) * (Number(rawTimestamp) < 1_000_000_000_000 ? 1000 : 1);
    if (Number.isFinite(timestampMs) && timestampMs > 0) {
      serverTimeOffsetMs = timestampMs - now;
      lastTimeSyncAt = now;
    }
  } catch {
    lastTimeSyncAt = now;
  }
}

async function buildSignatureHeaders(config) {
  await syncServerTimeIfNeeded();

  const timestamp = Math.floor((Date.now() + serverTimeOffsetMs) / 1000).toString();
  const nonce = generateUuid();
  const path = buildSigningPath(config);
  const bodyHash = await sha256Hex(normalizeBody(config));
  const message = `${String(config.method || 'GET').toUpperCase()}\n${path}\n${bodyHash || ''}\n${timestamp}\n${nonce}`;
  const signature = await hmacSha256Hex(SIGNATURE_KEY, message);

  return {
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: timestamp,
    [NONCE_HEADER]: nonce,
  };
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  if (!isPublicRequest(config)) {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      const fingerprint = await AsyncStorage.getItem('fingerprint');
      if (fingerprint) {
        config.headers['X-Token-Fingerprint'] = fingerprint;
      }
    }
  }

  prepareRequestBody(config);

  if (CAN_SET_ORIGIN_HEADER) {
    config.headers.Origin = getOriginValue();
  }

  const deviceHeaders = await getDeviceHeaders();
  Object.assign(config.headers, deviceHeaders);

  // WebView fingerprint is optional in the guide. Reuse marker until the native layer provides a dedicated value.
  if (!config.headers[DEVICE_WEBVIEW_FP_HEADER]) {
    config.headers[DEVICE_WEBVIEW_FP_HEADER] = deviceHeaders[DEVICE_MARKER_HEADER];
  }

  const signatureHeaders = await buildSignatureHeaders(config);
  Object.assign(config.headers, signatureHeaders);

  return config;
});

let refreshing = false;
let refreshQueue = [];

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !isPublicRequest(original)) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => client(original));
      }

      original._retry = true;
      refreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('no refresh token');

        const fingerprint = await AsyncStorage.getItem('fingerprint');

        const refreshConfig = {
          method: 'POST',
          url: '/api/v3/auth/refresh',
          data: { refreshToken },
          headers: {
            'Content-Type': 'application/json',
            ...(await getDeviceHeaders()),
          },
        };

        if (CAN_SET_ORIGIN_HEADER) {
          refreshConfig.headers.Origin = getOriginValue();
        }

        if (fingerprint) {
          refreshConfig.headers['X-Token-Fingerprint'] = fingerprint;
        }

        Object.assign(refreshConfig.headers, {
          [DEVICE_WEBVIEW_FP_HEADER]: refreshConfig.headers[DEVICE_MARKER_HEADER],
          ...(await buildSignatureHeaders(refreshConfig)),
        });

        const { data } = await axios.post(`${API_BASE}/api/v3/auth/refresh`, refreshConfig.data, {
          headers: refreshConfig.headers,
        });

        // API returns camelCase
        await AsyncStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.fingerprint) {
          await AsyncStorage.setItem('fingerprint', data.fingerprint);
        }

        refreshQueue.forEach(({ resolve }) => resolve());
        refreshQueue = [];
        return client(original);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        await clearStoredAuthArtifacts();
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default client;
