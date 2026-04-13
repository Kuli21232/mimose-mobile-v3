import { create } from 'zustand';
import { Audio } from 'expo-av';
import { PROXY_BASE, audioUrl } from '../config';
import { tracksApi } from '../api/tracks';
import { yandexApi } from '../api/yandex';

let _sound = null;

// Configure audio session once (background playback, silent mode on iOS)
Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
}).catch(() => {});

function getDirectStreamUrl(track) {
  return (
    track?.streamUrl ||
    track?.audioUrl ||
    track?.downloadUrl ||
    track?.previewUrl ||
    track?.url ||
    null
  );
}

function resolveAudioUrl(track) {
  const source = track.source || 'yandex';
  const directStreamUrl = getDirectStreamUrl(track);

  if (directStreamUrl) {
    if (source === 'yandex') return directStreamUrl;
    return `${PROXY_BASE}/audio/${encodeURIComponent(directStreamUrl)}`;
  }

  if (source === 'yandex') return null;
  return audioUrl(track.id, source);
}

async function prepareTrackForPlayback(track) {
  const source = track?.source || 'yandex';
  if (source !== 'yandex' || getDirectStreamUrl(track)) return track;

  const streamUrl = await yandexApi.resolveYandexStreamUrl(track);
  if (!streamUrl) {
    throw new Error('Yandex playback stream could not be resolved');
  }
  return { ...track, streamUrl };
}

async function _clearSound() {
  if (_sound) {
    try {
      await _sound.stopAsync();
    } catch { /* ignore */ }
    try {
      await _sound.unloadAsync();
    } catch { /* ignore */ }
    _sound = null;
  }
}

const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  isShuffled: false,
  repeatMode: 'none',
  isLoading: false,

  // ─── Play a single track ────────────────────────────────────────────────────
  playTrack: async (track, queue = null, queueIndex = 0) => {
    const baseQueue = queue || [track];

    set({ isLoading: true });
    await _clearSound();

    // Update UI immediately so the mini-player shows the right track
    set({
      currentTrack: track,
      queue: baseQueue,
      queueIndex,
      position: 0,
      duration: 0,
      isPlaying: false,
    });

    try {
      const preparedTrack = await prepareTrackForPlayback(track);
      const preparedQueue = baseQueue.map((item, index) =>
        index === queueIndex ? preparedTrack : item,
      );

      set({ currentTrack: preparedTrack, queue: preparedQueue });

      const uri = resolveAudioUrl(preparedTrack);
      if (!uri) {
        throw new Error(`Playback URL is unavailable for source: ${preparedTrack.source || 'unknown'}`);
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (status) => {
          if (!status.isLoaded) return;
          set({
            position: status.positionMillis || 0,
            duration: status.durationMillis || 0,
            isPlaying: status.isPlaying || false,
          });
          if (status.didJustFinish) {
            set({ isPlaying: false, position: 0 });
            get().next();
          }
        },
      );

      _sound = sound;
      set({ isPlaying: true, isLoading: false });

      // Record play — non-critical
      try {
        const source = preparedTrack.source || 'yandex';
        const statusNow = await sound.getStatusAsync();
        await tracksApi.recordPlay(
          `${source}:${preparedTrack.id}`,
          source,
          statusNow.durationMillis || 0,
        );
      } catch { /* ignore */ }

      return true;

    } catch (err) {
      console.warn('[playerStore] playTrack error', err);
      set({
        currentTrack: null,
        queue: [],
        queueIndex: 0,
        position: 0,
        duration: 0,
        isLoading: false,
        isPlaying: false,
      });
      return false;
    }
  },

  // ─── Play/Pause toggle ──────────────────────────────────────────────────────
  togglePlay: async () => {
    if (!_sound) return;
    const { isPlaying } = get();
    try {
      if (isPlaying) {
        await _sound.pauseAsync();
        set({ isPlaying: false });
      } else {
        await _sound.playAsync();
        set({ isPlaying: true });
      }
    } catch (err) {
      console.warn('[playerStore] togglePlay error', err);
    }
  },

  // ─── Seek ───────────────────────────────────────────────────────────────────
  seekTo: async (ms) => {
    if (!_sound) return;
    try {
      await _sound.setPositionAsync(ms);
      set({ position: ms });
    } catch (err) {
      console.warn('[playerStore] seekTo error', err);
    }
  },

  // ─── Next / Prev ─────────────────────────────────────────────────────────────
  next: async () => {
    const { queue, queueIndex, repeatMode, isShuffled } = get();
    if (!queue.length) return;
    let next;
    if (repeatMode === 'one') {
      next = queueIndex;
    } else if (isShuffled) {
      next = Math.floor(Math.random() * queue.length);
    } else {
      next = queueIndex + 1;
      if (next >= queue.length) {
        if (repeatMode === 'all') next = 0;
        else return;
      }
    }
    await get().playTrack(queue[next], queue, next);
  },

  prev: async () => {
    const { queue, queueIndex, position } = get();
    if (position > 3000) {
      await get().seekTo(0);
      return;
    }
    const prev = Math.max(0, queueIndex - 1);
    await get().playTrack(queue[prev], queue, prev);
  },

  // ─── Queue helpers ──────────────────────────────────────────────────────────
  setQueue: (tracks, startIndex = 0) => {
    set({ queue: tracks, queueIndex: startIndex });
  },

  addToQueue: (track) => {
    set((s) => ({ queue: [...s.queue, track] }));
  },

  // ─── Shuffle / Repeat ────────────────────────────────────────────────────────
  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),

  cycleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none',
    })),
}));

export default usePlayerStore;
