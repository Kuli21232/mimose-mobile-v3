const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');
const path = require('path');
const { URL } = require('url');

function loadEnvFile(filename) {
  const filePath = path.resolve(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) return;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const PORT = Number(process.env.MIMOSE_DEV_PROXY_PORT || 8787);
const API_UPSTREAM = 'https://api.mimose.fun';
const PROXY_UPSTREAM = 'http://45.95.235.196:8080';
const YANDEX_MUSIC_UPSTREAM = 'https://api.music.yandex.net';
const YANDEX_SIGN_SALT = 'XGRlBW9FXlekgbPrRHuSiA';
const YANDEX_LYRICS_SIGN_SECRET = 'p93jhgh689SBReK6ghtw62';
const ALLOW_ORIGIN = process.env.MIMOSE_DEV_PROXY_ALLOW_ORIGIN || '*';
const UPSTREAM_ORIGIN = 'tauri://localhost';
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const YANDEX_SERVICE_TOKEN = String(
  process.env.MIMOSE_YANDEX_MUSIC_TOKEN ||
  process.env.YANDEX_MUSIC_TOKEN ||
  process.env.EXPO_PUBLIC_YANDEX_MUSIC_TOKEN ||
  '',
).trim();

const ALLOWED_PROXY_DOMAINS = [
  'sndcdn.com',
  'soundcloud.com',
  'storage.yandexcloud.net',
  'storage.yandex.net',      // covers s*.storage.yandex.net (audio CDN nodes)
  'mds.yandex.net',          // covers storage.mds.yandex.net + avatars.mds.yandex.net
  'music.yandex.net',
  'api.music.yandex.net',
  'avatars.yandex.net',
  'i.scdn.co',
  'mosaic.scdn.co',
  'seed-mix-image.spotifycdn.com',
  'image-cdn-ak.spotifycdn.com',
  'image-cdn-fa.spotifycdn.com',
  'wrapped-images.spotifycdn.com',
  'spotify.com',
  'googlevideo.com',
  'lh3.googleusercontent.com',
  'yt3.ggpht.com',
  'i.ytimg.com',
  'i9.ytimg.com',
  'audioscrobbler.com',
  'dzcdn.net',
  'deezer.com',
  'cdns-images.dzcdn.net',
  'cdn-images.dzcdn.net',
  'e-cdns-images.dzcdn.net',
];

function writeCorsHeaders(req, res) {
  const requestedHeaders = req.headers['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders || '*');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function sendJson(req, res, statusCode, payload) {
  writeCorsHeaders(req, res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

function requestRemote(target, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const targetUrl = target instanceof URL ? target : new URL(target);
    const transport = targetUrl.protocol === 'https:' ? https : http;

    const remoteReq = transport.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        method,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        headers,
      },
      (remoteRes) => {
        const chunks = [];

        remoteRes.on('data', (chunk) => {
          chunks.push(chunk);
        });

        remoteRes.on('end', () => {
          resolve({
            statusCode: remoteRes.statusCode || 500,
            headers: remoteRes.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    remoteReq.on('error', reject);

    if (body) {
      remoteReq.write(body);
    }

    remoteReq.end();
  });
}

function extractXmlValue(xml, tagName) {
  const match = String(xml || '').match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`));
  return match ? match[1] : '';
}

function getBestDownloadInfo(items) {
  return [...items]
    .sort((left, right) => {
      const leftScore = Number(left?.bitrateInKbps || 0);
      const rightScore = Number(right?.bitrateInKbps || 0);
      return rightScore - leftScore;
    })
    .find((item) => item?.downloadInfoUrl) || null;
}

function buildYandexLyricsSign(trackId, timestamp) {
  return crypto
    .createHmac('sha256', YANDEX_LYRICS_SIGN_SECRET)
    .update(`${trackId}${timestamp}`)
    .digest('base64');
}

function isPrivateIpAddress(hostname) {
  if (!net.isIP(hostname)) return false;
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function isAllowedProxyUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (!host) return false;
    if (isPrivateIpAddress(host)) return false;
    if (net.isIP(host)) return false;

    return ALLOWED_PROXY_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function decodeAbsoluteProxyUrl(rawPath) {
  if (!rawPath) return null;

  try {
    const decoded = decodeURIComponent(rawPath);
    if (/^https?:\/\//i.test(decoded)) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
}

function copySafeResponseHeaders(fromHeaders, res) {
  Object.entries(fromHeaders).forEach(([key, value]) => {
    if (value == null) return;
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'access-control-allow-origin') return;

    if (
      [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control',
        'etag',
        'last-modified',
      ].includes(lowerKey)
    ) {
      res.setHeader(key, value);
    }
  });
}

function proxyExternalResponse(req, res, targetUrl, { browserUa = false } = {}) {
  return new Promise((resolve) => {
    const parsed = targetUrl instanceof URL ? targetUrl : new URL(targetUrl);
    const transport = parsed.protocol === 'https:' ? https : http;
    const headers = {
      Accept: req.headers.accept || '*/*',
      'Accept-Language': req.headers['accept-language'] || 'ru,en;q=0.9',
    };

    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    if (browserUa) {
      headers['User-Agent'] = BROWSER_USER_AGENT;
    }

    const remoteReq = transport.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        method: req.method || 'GET',
        path: `${parsed.pathname}${parsed.search}`,
        headers,
      },
      (remoteRes) => {
        res.statusCode = remoteRes.statusCode || 500;
        copySafeResponseHeaders(remoteRes.headers, res);
        writeCorsHeaders(req, res);
        remoteRes.pipe(res);
        remoteRes.on('end', resolve);
      },
    );

    remoteReq.on('error', (error) => {
      sendJson(req, res, 502, {
        error: 'proxy_error',
        detail: error.message,
      });
      resolve();
    });

    remoteReq.end();
  });
}

async function handleBinaryProxy(req, res, pathname, { browserUa = false, legacyPrefix = null } = {}) {
  const rawPath = pathname.replace(/^\/(audio|stream|image)\//, '');
  const decodedUrl = decodeAbsoluteProxyUrl(rawPath);

  if (decodedUrl) {
    if (!isAllowedProxyUrl(decodedUrl)) {
      sendJson(req, res, 403, { error: 'domain_not_allowed' });
      return;
    }

    await proxyExternalResponse(req, res, decodedUrl, { browserUa });
    return;
  }

  if (legacyPrefix) {
    const targetUrl = new URL(req.url || '/', legacyPrefix);
    await proxyPass(req, res, targetUrl);
    return;
  }

  sendJson(req, res, 400, { error: 'invalid_proxy_url' });
}

async function handleYandexResolveStream(req, res) {
  if (req.method !== 'POST') {
    sendJson(req, res, 405, { error: 'method_not_allowed' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    sendJson(req, res, 400, { error: 'invalid_json' });
    return;
  }

  const token = String(
    req.headers['x-yandex-token'] ||
    payload.token ||
    YANDEX_SERVICE_TOKEN ||
    '',
  ).trim();
  const trackId = String(payload.trackId || '').trim();
  const albumId = String(payload.albumId || '').trim();

  if (!trackId) {
    sendJson(req, res, 400, { error: 'missing_track_id' });
    return;
  }

  if (!token) {
    sendJson(req, res, 503, {
      error: 'missing_yandex_token',
      detail: 'Set YANDEX_MUSIC_TOKEN for the local dev proxy or connect a Yandex account for import-only flows.',
    });
    return;
  }

  const trackKey = albumId ? `${trackId}:${albumId}` : trackId;

  try {
    const downloadInfoResponse = await requestRemote(
      new URL(`/tracks/${trackKey}/download-info`, YANDEX_MUSIC_UPSTREAM),
      {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      },
    );

    if (downloadInfoResponse.statusCode >= 400) {
      sendJson(req, res, downloadInfoResponse.statusCode, {
        error: 'yandex_download_info_failed',
        detail: downloadInfoResponse.body,
      });
      return;
    }

    const parsed = JSON.parse(downloadInfoResponse.body || '{}');
    const items = Array.isArray(parsed?.result)
      ? parsed.result
      : Array.isArray(parsed)
        ? parsed
        : [];

    const bestItem = getBestDownloadInfo(items);
    if (!bestItem?.downloadInfoUrl) {
      sendJson(req, res, 502, { error: 'missing_download_info_url' });
      return;
    }

    const urlResponse = await requestRemote(bestItem.downloadInfoUrl, {
      headers: {
        Authorization: `OAuth ${token}`,
      },
    });

    if (urlResponse.statusCode >= 400) {
      sendJson(req, res, urlResponse.statusCode, {
        error: 'yandex_download_url_failed',
        detail: urlResponse.body,
      });
      return;
    }

    const host = extractXmlValue(urlResponse.body, 'host');
    const mediaPath = extractXmlValue(urlResponse.body, 'path');
    const ts = extractXmlValue(urlResponse.body, 'ts');
    const signToken = extractXmlValue(urlResponse.body, 's');

    if (!host || !mediaPath || !ts || !signToken) {
      sendJson(req, res, 502, { error: 'invalid_download_info_payload' });
      return;
    }

    const sign = crypto
      .createHash('md5')
      .update(`${YANDEX_SIGN_SALT}${mediaPath.slice(1)}${signToken}`)
      .digest('hex');

    const streamUrl = `https://${host}/get-mp3/${sign}/${ts}${mediaPath}`;

    sendJson(req, res, 200, {
      streamUrl,
      codec: bestItem.codec || 'mp3',
      bitrateInKbps: bestItem.bitrateInKbps || null,
      resolvedBy: req.headers['x-yandex-token'] || payload.token ? 'oauth' : 'service',
    });
  } catch (error) {
    sendJson(req, res, 502, {
      error: 'yandex_resolve_error',
      detail: error.message,
    });
  }
}

async function handleYandexLyrics(req, res) {
  if (req.method !== 'POST') {
    sendJson(req, res, 405, { error: 'method_not_allowed' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    sendJson(req, res, 400, { error: 'invalid_json' });
    return;
  }

  const token = String(
    req.headers['x-yandex-token'] ||
    payload.token ||
    YANDEX_SERVICE_TOKEN ||
    '',
  ).trim();
  const trackId = String(payload.trackId || '').trim();

  if (!trackId) {
    sendJson(req, res, 400, { error: 'missing_track_id' });
    return;
  }

  if (!token) {
    sendJson(req, res, 503, {
      error: 'missing_yandex_token',
      detail: 'Set YANDEX_MUSIC_TOKEN for the local dev proxy to fetch lyrics.',
    });
    return;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = buildYandexLyricsSign(trackId, timestamp);
    const lyricsUrl = new URL(`/tracks/${encodeURIComponent(trackId)}/lyrics`, YANDEX_MUSIC_UPSTREAM);
    lyricsUrl.searchParams.set('sign', sign);
    lyricsUrl.searchParams.set('timeStamp', String(timestamp));
    lyricsUrl.searchParams.set('format', 'LRC');

    const lyricsResponse = await requestRemote(lyricsUrl, {
      headers: {
        Authorization: `OAuth ${token}`,
        'X-Yandex-Music-Client': 'YandexMusicDesktopAppWindows/5.55.2',
        'X-Yandex-Music-Without-Invocation-Info': '1',
        'X-Yandex-Music-Device': 'os=Windows; os_version=10.0; manufacturer=Codex; model=Desktop',
        'X-Request-Id': crypto.randomUUID(),
        Origin: 'music-application://desktop',
        'Accept-Language': 'ru',
      },
    });

    if (lyricsResponse.statusCode >= 400) {
      sendJson(req, res, lyricsResponse.statusCode, {
        error: 'yandex_lyrics_failed',
        detail: lyricsResponse.body,
      });
      return;
    }

    const parsed = JSON.parse(lyricsResponse.body || '{}');
    const result = parsed?.result || parsed || {};
    const downloadUrl = result?.downloadUrl || result?.download_url || '';

    if (!downloadUrl) {
      sendJson(req, res, 404, { error: 'lyrics_not_found' });
      return;
    }

    const lrcResponse = await requestRemote(downloadUrl, {
      headers: {
        Authorization: `OAuth ${token}`,
      },
    });

    if (lrcResponse.statusCode >= 400) {
      sendJson(req, res, lrcResponse.statusCode, {
        error: 'lyrics_download_failed',
        detail: lrcResponse.body,
      });
      return;
    }

    sendJson(req, res, 200, {
      lrc: lrcResponse.body,
      writers: result?.writers || [],
    });
  } catch (error) {
    sendJson(req, res, 502, {
      error: 'yandex_lyrics_error',
      detail: error.message,
    });
  }
}

function buildTargetUrl(requestUrl) {
  const incomingUrl = new URL(requestUrl || '/', 'http://127.0.0.1');
  const { pathname, search } = incomingUrl;

  if (pathname === '/stats') {
    return new URL(requestUrl || '/', PROXY_UPSTREAM);
  }

  if (pathname.startsWith('/yandex-music/')) {
    const rewrittenPath = pathname.replace('/yandex-music', '') || '/';
    return new URL(`${rewrittenPath}${search}`, YANDEX_MUSIC_UPSTREAM);
  }

  return new URL(requestUrl || '/', API_UPSTREAM);
}

function buildForwardHeaders(headers, targetUrl) {
  const nextHeaders = { ...headers };
  delete nextHeaders.host;
  delete nextHeaders.connection;
  delete nextHeaders['content-length'];

  if (targetUrl.origin === YANDEX_MUSIC_UPSTREAM) {
    delete nextHeaders.origin;
  } else {
    nextHeaders.origin = UPSTREAM_ORIGIN;
  }

  nextHeaders.host = targetUrl.host;
  return nextHeaders;
}

function proxyPass(req, res, targetUrl) {
  return new Promise((resolve) => {
    const transport = targetUrl.protocol === 'https:' ? https : http;

    const proxyReq = transport.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        method: req.method,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        headers: buildForwardHeaders(req.headers, targetUrl),
      },
      (proxyRes) => {
        res.statusCode = proxyRes.statusCode || 500;

        Object.entries(proxyRes.headers).forEach(([key, value]) => {
          if (value == null) return;
          if (key.toLowerCase() === 'access-control-allow-origin') return;
          res.setHeader(key, value);
        });

        writeCorsHeaders(req, res);
        proxyRes.pipe(res);
        proxyRes.on('end', resolve);
      },
    );

    proxyReq.on('error', (error) => {
      sendJson(req, res, 502, {
        error: 'proxy_error',
        detail: error.message,
      });
      resolve();
    });

    req.pipe(proxyReq);
  });
}

const server = http.createServer(async (req, res) => {
  writeCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const incomingUrl = new URL(req.url || '/', 'http://127.0.0.1');

  if (incomingUrl.pathname === '/yandex-music/resolve-stream') {
    await handleYandexResolveStream(req, res);
    return;
  }

  if (incomingUrl.pathname === '/yandex-music/lyrics') {
    await handleYandexLyrics(req, res);
    return;
  }

  if (incomingUrl.pathname === '/health') {
    sendJson(req, res, 200, {
      ok: true,
      service: 'mimose-dev-proxy',
      yandexServiceTokenLoaded: Boolean(YANDEX_SERVICE_TOKEN),
    });
    return;
  }

  if (incomingUrl.pathname.startsWith('/audio/')) {
    await handleBinaryProxy(req, res, incomingUrl.pathname, {
      browserUa: true,
      legacyPrefix: PROXY_UPSTREAM,
    });
    return;
  }

  if (incomingUrl.pathname.startsWith('/stream/')) {
    await handleBinaryProxy(req, res, incomingUrl.pathname, {
      browserUa: false,
      legacyPrefix: PROXY_UPSTREAM,
    });
    return;
  }

  if (incomingUrl.pathname.startsWith('/image/')) {
    await handleBinaryProxy(req, res, incomingUrl.pathname, {
      browserUa: false,
    });
    return;
  }

  const targetUrl = buildTargetUrl(req.url || '/');
  await proxyPass(req, res, targetUrl);
});

server.listen(PORT, '0.0.0.0', () => {
  const tokenMode = YANDEX_SERVICE_TOKEN ? 'service token loaded' : 'no service token';
  console.log(`Mimose dev proxy listening on http://0.0.0.0:${PORT} (${tokenMode})`);
});
