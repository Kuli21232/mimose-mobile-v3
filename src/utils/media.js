import { imageProxyUrl } from '../config';

const FALLBACK_GRADIENTS = [
  ['#1e1818', '#281e24'],
  ['#181e18', '#1e2428'],
  ['#18181e', '#241e28'],
  ['#1e1e18', '#28241e'],
  ['#181e1e', '#1e2824'],
  ['#201a1c', '#1c1a20'],
  ['#1a1e20', '#201824'],
  ['#20202a', '#281a20'],
];

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickGradient(seed) {
  return FALLBACK_GRADIENTS[hashString(String(seed || 'mimose')) % FALLBACK_GRADIENTS.length];
}

export function formatDuration(ms) {
  const totalMs = Number(ms) || 0;
  if (!totalMs) return '';

  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function extractResults(payload, preferredKeys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const keys = [
    ...preferredKeys,
    'results',
    'items',
    'tracks',
    'artists',
    'albums',
    'playlists',
    'queries',
    'searches',
  ];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      if (Array.isArray(value.results)) return value.results;
      if (Array.isArray(value.items)) return value.items;
    }
  }

  return [];
}

export function normalizeTrack(track, overrides = {}) {
  const artists = Array.isArray(track?.artists)
    ? track.artists.map((artist) => artist?.name).filter(Boolean).join(', ')
    : '';

  const durationMs = Number(track?.durationMs ?? track?.duration_ms ?? overrides.durationMs ?? 0) || 0;
  const source = overrides.source || track?.source || track?.platform || track?.provider || 'yandex';
  const id =
    track?.id ??
    track?.trackId ??
    track?.realId ??
    track?.kind ??
    track?.key ??
    `${source}:${track?.title || track?.name || 'track'}`;
  const title = track?.title || track?.name || 'вЂ”';
  const artist = track?.artist || track?.artistName || artists || 'вЂ”';
  const rawCover =
    track?.coverUrl ||
    track?.artworkUrl ||
    track?.coverUri ||
    track?.ogImage ||
    track?.album?.images?.[0]?.url ||
    track?.album?.coverUri ||
    track?.albums?.[0]?.coverUri ||
    null;

  const gradientSeed = rawCover || `${source}:${id}:${title}`;
  const albumId = track?.albumId || track?.album?.id || track?.albums?.[0]?.id || null;
  const streamUrl = track?.streamUrl || track?.downloadUrl || track?.url || null;
  const lyricsPayload =
    track?.lyrics ??
    track?.lyricsText ??
    track?.lyrics_text ??
    track?.textLyrics ??
    track?.fullLyrics ??
    track?.full_lyrics ??
    track?.lrc ??
    track?.text ??
    null;

  return {
    id: String(id),
    title,
    artist,
    duration: typeof track?.duration === 'string' ? track.duration : formatDuration(durationMs),
    durationMs,
    artGradient: track?.artGradient || pickGradient(gradientSeed),
    coverUrl: track?.coverUrl || imageProxyUrl(rawCover, '200x200'),
    streamUrl,
    source,
    artistId: track?.artistId || track?.artists?.[0]?.id || null,
    albumId,
    album: track?.album?.title || track?.album?.name || track?.albums?.[0]?.title || track?.albums?.[0]?.name || '',
    yandexKey: source === 'yandex' && albumId ? `${String(id)}:${albumId}` : null,
    key: track?.key || null,
    lyrics: lyricsPayload,
    lyricsText: typeof lyricsPayload === 'string' ? lyricsPayload : null,
    lrc: track?.lrc || null,
  };
}

export function normalizeArtist(artist) {
  const rawCover =
    artist?.coverUrl ||
    artist?.coverUri ||
    artist?.ogImage ||
    artist?.artworkUrl ||
    artist?.images?.[0]?.url ||
    null;

  const seed = rawCover || `${artist?.id || 'artist'}:${artist?.name || 'unknown'}`;

  return {
    id: String(artist?.id ?? artist?.kind ?? seed),
    name: artist?.name || artist?.title || 'вЂ”',
    gradients: artist?.gradients || pickGradient(seed),
    coverUrl: artist?.coverUrl || imageProxyUrl(rawCover, '200x200'),
  };
}

export function normalizeAlbum(album, fallbackArtist = 'вЂ”') {
  const artists = Array.isArray(album?.artists)
    ? album.artists.map((artist) => artist?.name).filter(Boolean).join(', ')
    : '';
  const rawCover =
    album?.coverUrl ||
    album?.coverUri ||
    album?.artworkUrl ||
    album?.ogImage ||
    album?.images?.[0]?.url ||
    album?.albums?.[0]?.coverUri ||
    null;
  const seed =
    rawCover ||
    `${album?.id || 'album'}:${album?.title || album?.name || 'unknown'}`;
  const trackCount =
    Number(
      album?.trackCount ??
      album?.track_count ??
      album?.tracksCount ??
      album?.tracks_count ??
      album?.total_tracks ??
      album?.track_total ??
      album?.tracks?.length ??
      album?.volumes?.flat?.()?.length ??
      0,
    ) || 0;

  return {
    id: String(album?.id ?? album?.kind ?? seed),
    name: album?.title || album?.name || 'вЂ”',
    artist: album?.artist || artists || fallbackArtist,
    year: album?.year || '',
    trackCount,
    artGradient: album?.artGradient || pickGradient(seed),
    coverUrl: album?.coverUrl || imageProxyUrl(rawCover, '400x400'),
  };
}

export function normalizePlaylist(playlist, fallbackName = 'вЂ”') {
  const rawCover =
    playlist?.coverUrl ||
    playlist?.coverUri ||
    playlist?.artworkUrl ||
    playlist?.ogImage ||
    playlist?.images?.[0]?.url ||
    playlist?.picture?.url ||
    null;
  const seed =
    playlist?.id ||
    playlist?.uuid ||
    playlist?.slug ||
    playlist?.name ||
    playlist?.title ||
    fallbackName;
  const owner = playlist?.owner || playlist?.author || playlist?.user || {};
  const tracksCount =
    Number(
      playlist?.tracksCount ??
      playlist?.tracks_count ??
      playlist?.trackCount ??
      playlist?.track_count ??
      playlist?.itemCount ??
      playlist?.items_count ??
      playlist?.totalTracks ??
      playlist?.track_total ??
      playlist?.tracks?.length ??
      playlist?.items?.length ??
      playlist?.entries?.length ??
      0,
    ) || 0;

  return {
    id: String(seed),
    name: playlist?.name || playlist?.title || fallbackName,
    description: playlist?.description || '',
    tracksCount,
    likesCount:
      Number(
        playlist?.likesCount ??
        playlist?.likes_count ??
        playlist?.likes ??
        playlist?.reactionsCount ??
        playlist?.favoritesCount ??
        0,
      ) || 0,
    ownerName: owner?.handle || owner?.name || playlist?.handle || playlist?.username || '',
    artColors: playlist?.artColors || [
      ...pickGradient(`${seed}:a`),
      ...pickGradient(`${seed}:b`),
    ],
    coverUrl: playlist?.coverUrl || imageProxyUrl(rawCover, '400x400'),
  };
}
