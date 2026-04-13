import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@mimose_cache:';

function buildCacheStorageKey(key) {
  return `${CACHE_PREFIX}${key}`;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function readCache(key) {
  const raw = await AsyncStorage.getItem(buildCacheStorageKey(key));
  return raw ? safeParse(raw) : null;
}

export async function writeCache(key, data) {
  const entry = {
    savedAt: Date.now(),
    data,
  };
  await AsyncStorage.setItem(buildCacheStorageKey(key), JSON.stringify(entry));
  return entry;
}

export async function getCachedResource(key, fetcher, options = {}) {
  const { ttlMs = 5 * 60 * 1000, allowStale = true } = options;
  const cached = await readCache(key);

  if (cached && Date.now() - cached.savedAt < ttlMs) {
    return {
      data: cached.data,
      cached: true,
      stale: false,
      savedAt: cached.savedAt,
    };
  }

  try {
    const freshData = await fetcher();
    const saved = await writeCache(key, freshData);
    return {
      data: freshData,
      cached: false,
      stale: false,
      savedAt: saved.savedAt,
    };
  } catch (error) {
    if (cached && allowStale) {
      return {
        data: cached.data,
        cached: true,
        stale: true,
        savedAt: cached.savedAt,
        error,
      };
    }
    throw error;
  }
}

export async function clearAppCache() {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

  if (cacheKeys.length) {
    await AsyncStorage.multiRemove(cacheKeys);
  }

  return cacheKeys.length;
}

export async function getCacheStats() {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

  if (!cacheKeys.length) {
    return {
      entries: 0,
      totalBytes: 0,
      oldestSavedAt: null,
      newestSavedAt: null,
    };
  }

  const pairs = await AsyncStorage.multiGet(cacheKeys);
  const parsedEntries = pairs
    .map(([, value]) => safeParse(value))
    .filter(Boolean);

  const timestamps = parsedEntries
    .map((entry) => entry.savedAt)
    .filter(Boolean);

  const totalBytes = pairs.reduce((sum, [, value]) => sum + (value ? value.length : 0), 0);

  return {
    entries: cacheKeys.length,
    totalBytes,
    oldestSavedAt: timestamps.length ? Math.min(...timestamps) : null,
    newestSavedAt: timestamps.length ? Math.max(...timestamps) : null,
  };
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
}
