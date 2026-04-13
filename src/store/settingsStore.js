import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mimose_settings';

const DEFAULT_SETTINGS = {
  language: 'ru',
  textSize: 'medium',
  accent: 'white',
  theme: 'dark',
  notificationsEnabled: true,
  privacy: {
    publicProfile: true,
    showListening: false,
    shareStats: true,
    allowRecommend: true,
    trackingOff: false,
  },
  playback: {
    quality: 'high',
    crossfade: '3s',
    normalize: true,
    gapless: true,
    autoplay: false,
  },
  integrations: {
    lastfm: {
      connected: false,
      username: '',
      scrobble: true,
      nowPlaying: true,
    },
    yandexMusic: {
      connected: false,
      token: '',
      enablePlayback: true,
    },
  },
  hotkeys: {
    enabled: true,
  },
};

function normalizeLanguage(language) {
  return ['ru', 'en'].includes(language) ? language : DEFAULT_SETTINGS.language;
}

function normalizeLastFm(lastfmValue) {
  if (typeof lastfmValue === 'boolean') {
    return {
      ...DEFAULT_SETTINGS.integrations.lastfm,
      connected: lastfmValue,
    };
  }

  return {
    ...DEFAULT_SETTINGS.integrations.lastfm,
    ...(lastfmValue || {}),
  };
}

function normalizeYandexMusic(value) {
  if (typeof value === 'string') {
    return {
      ...DEFAULT_SETTINGS.integrations.yandexMusic,
      connected: Boolean(value.trim()),
      token: value,
    };
  }

  return {
    ...DEFAULT_SETTINGS.integrations.yandexMusic,
    ...(value || {}),
    connected: Boolean(value?.connected || value?.token),
    token: value?.token || '',
  };
}

function normalizeSettings(parsed = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    language: normalizeLanguage(parsed.language),
    privacy: { ...DEFAULT_SETTINGS.privacy, ...parsed?.privacy },
    playback: { ...DEFAULT_SETTINGS.playback, ...parsed?.playback },
    integrations: {
      lastfm: normalizeLastFm(parsed?.integrations?.lastfm),
      yandexMusic: normalizeYandexMusic(parsed?.integrations?.yandexMusic),
    },
    hotkeys: { ...DEFAULT_SETTINGS.hotkeys, ...parsed?.hotkeys },
  };
}

async function persistSettings(settings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export const useSettingsStore = create((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isReady: false,

  init: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ isReady: true });
        return;
      }

      const parsed = JSON.parse(raw);
      set({
        settings: normalizeSettings(parsed),
        isReady: true,
      });
    } catch {
      set({ settings: DEFAULT_SETTINGS, isReady: true });
    }
  },

  updateSettings: async (patch) => {
    const nextSettings = normalizeSettings({
      ...get().settings,
      ...patch,
    });
    set({ settings: nextSettings });
    await persistSettings(nextSettings);
  },

  updatePrivacy: async (key, value) => {
    const nextSettings = normalizeSettings({
      ...get().settings,
      privacy: {
        ...get().settings.privacy,
        [key]: value,
      },
    });
    set({ settings: nextSettings });
    await persistSettings(nextSettings);
  },

  updatePlayback: async (key, value) => {
    const nextSettings = normalizeSettings({
      ...get().settings,
      playback: {
        ...get().settings.playback,
        [key]: value,
      },
    });
    set({ settings: nextSettings });
    await persistSettings(nextSettings);
  },

  updateIntegration: async (key, value) => {
    const currentValue = get().settings.integrations[key];
    const nextValue = typeof currentValue === 'object' && typeof value === 'object'
      ? { ...currentValue, ...value }
      : value;

    const nextSettings = normalizeSettings({
      ...get().settings,
      integrations: {
        ...get().settings.integrations,
        [key]: nextValue,
      },
    });
    set({ settings: nextSettings });
    await persistSettings(nextSettings);
  },

  updateHotkeys: async (key, value) => {
    const nextSettings = normalizeSettings({
      ...get().settings,
      hotkeys: {
        ...get().settings.hotkeys,
        [key]: value,
      },
    });
    set({ settings: nextSettings });
    await persistSettings(nextSettings);
  },

  reset: async () => {
    set({ settings: DEFAULT_SETTINGS });
    await persistSettings(DEFAULT_SETTINGS);
  },
}));

export default useSettingsStore;
