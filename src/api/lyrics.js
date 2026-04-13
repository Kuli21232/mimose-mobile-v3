const LRCLIB_BASE = 'https://lrclib.net/api/get';

function cleanTitle(title = '') {
  return String(title)
    .replace(/\s*[\(\[].*?[\)\]]\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanArtist(artist = '') {
  return String(artist)
    .split(/[,&/]/)[0]
    .trim();
}

function parseLrc(lrc = '') {
  return String(lrc)
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/);
      if (!match) return null;

      const minutes = Number(match[1] || 0);
      const seconds = Number(match[2] || 0);
      const fraction = match[3] || '0';
      const milliseconds = fraction.length === 2 ? Number(fraction) * 10 : Number(fraction);

      return {
        timeMs: (minutes * 60 + seconds) * 1000 + milliseconds,
        text: String(match[4] || '').trim(),
      };
    })
    .filter((line) => line?.text);
}

export async function fetchLyrics({ artist, title, durationMs }) {
  if (!artist || !title) return null;

  const params = new URLSearchParams({
    artist_name: cleanArtist(artist),
    track_name: cleanTitle(title),
  });

  if (durationMs) {
    params.set('duration', String(Math.round(Number(durationMs) / 1000)));
  }

  const response = await fetch(`${LRCLIB_BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'Mimose/3.0' },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`LRCLIB ${response.status}`);
  }

  const data = await response.json();
  const syncedLines = parseLrc(data?.syncedLyrics || '');
  const plainText = String(data?.plainLyrics || '').trim();

  return {
    plainText,
    syncedText: String(data?.syncedLyrics || '').trim(),
    syncedLines,
    instrumental: Boolean(data?.instrumental),
  };
}
