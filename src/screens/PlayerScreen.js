import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackOptionsSheet from '../components/TrackOptionsSheet';
import usePlayerStore from '../store/playerStore';
import useSocialStore from '../store/socialStore';
import { fetchLyrics } from '../api/lyrics';
import { currentTrack as mockCurrentTrack, lyrics as mockLyrics } from '../data/mock';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

const { width } = Dimensions.get('window');

function formatMs(ms) {
  if (!ms || Number.isNaN(ms)) return '0:00';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const tail = seconds % 60;
  return `${minutes}:${tail.toString().padStart(2, '0')}`;
}

function parseEmbeddedLyrics(track) {
  const payload = track?.lyrics || track?.lyricsText || track?.lrc || track?.text || track?.fullLyrics;

  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload
      .map((line) => (typeof line === 'string' ? { text: line.trim(), timeMs: null } : {
        text: String(line?.text || '').trim(),
        timeMs: Number(line?.timeMs || line?.time || 0) || null,
      }))
      .filter((line) => line.text);
  }

  return String(payload)
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/);
      if (match) {
        const minutes = Number(match[1] || 0);
        const seconds = Number(match[2] || 0);
        const fraction = match[3] || '0';
        const milliseconds = fraction.length === 2 ? Number(fraction) * 10 : Number(fraction);
        return {
          text: String(match[4] || '').trim(),
          timeMs: (minutes * 60 + seconds) * 1000 + milliseconds,
        };
      }

      return {
        text: line.trim(),
        timeMs: null,
      };
    })
    .filter((line) => line.text);
}

function getFallbackLyrics(track) {
  if (track?.title === mockCurrentTrack?.title) {
    return mockLyrics
      .filter((line) => line?.text)
      .map((line) => ({ text: line.text, timeMs: null }));
  }

  return [];
}

function getActiveLyricIndex(lines, positionMs) {
  if (!lines?.length) return -1;

  let activeIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]?.timeMs == null) continue;
    if (lines[index].timeMs <= positionMs) {
      activeIndex = index;
    } else {
      break;
    }
  }

  return activeIndex;
}

function Artwork({ coverUrl, gradient, style, imageStyle }) {
  if (coverUrl) {
    return <Image source={{ uri: coverUrl }} style={[style, imageStyle]} />;
  }

  return <LinearGradient colors={gradient} style={style} />;
}

export default function PlayerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { language } = useI18n();
  const styles = createStyles(theme);
  const room = useSocialStore((state) => state.room);
  const copy = language === 'ru'
    ? {
      tabs: { player: 'Плеер', lyrics: 'Слова', queue: 'Очередь' },
      playback: 'Воспроизведение',
      playlist: 'В плейлист',
      radio: 'Радио',
      artist: 'Артист',
      noLyrics: 'Текст не найден',
      loadingLyrics: 'Загрузка текста...',
      nowPlaying: 'Сейчас играет',
      queueTabs: ['Далее', 'Похоже', 'История'],
    }
    : {
      tabs: { player: 'Player', lyrics: 'Lyrics', queue: 'Queue' },
      playback: 'Playback',
      playlist: 'Add to playlist',
      radio: 'Radio',
      artist: 'Artist',
      noLyrics: 'Lyrics not found',
      loadingLyrics: 'Loading lyrics...',
      nowPlaying: 'Now playing',
      queueTabs: ['Next', 'Related', 'History'],
    };
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [tab, setTab] = useState(copy.tabs.player);
  const [lyrics, setLyrics] = useState([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuMode, setMenuMode] = useState('menu');

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    queue,
    queueIndex,
    isShuffled,
    repeatMode,
    isLoading,
    togglePlay,
    seekTo,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
    playTrack,
  } = usePlayerStore();

  const track = currentTrack || {
    title: '—',
    artist: '—',
    artGradient: ['#1e1818', '#281e24'],
  };

  const progress = duration > 0 ? position / duration : 0;
  const artGradient = track.artGradient || ['#1e1818', '#281e24'];
  const activeLyricIndex = useMemo(() => getActiveLyricIndex(lyrics, position), [lyrics, position]);

  useEffect(() => {
    setTab((currentTab) => (
      Object.values(copy.tabs).includes(currentTab) ? currentTab : copy.tabs.player
    ));
  }, [copy.tabs]);

  useEffect(() => {
    let cancelled = false;

    async function loadLyrics() {
      const embeddedLyrics = parseEmbeddedLyrics(track);
      if (embeddedLyrics.length > 0) {
        setLyrics(embeddedLyrics);
        setLyricsLoading(false);
        return;
      }

      if (!track?.title || !track?.artist) {
        setLyrics(getFallbackLyrics(track));
        setLyricsLoading(false);
        return;
      }

      setLyrics([]);
      setLyricsLoading(true);

      try {
        const payload = await fetchLyrics({
          artist: track.artist,
          title: track.title,
          durationMs: track.durationMs,
        });

        if (cancelled) return;

        if (payload?.instrumental) {
          setLyrics([{ text: '♪ Instrumental', timeMs: null }]);
          return;
        }

        const nextLyrics =
          payload?.syncedLines?.length > 0
            ? payload.syncedLines
            : String(payload?.plainText || '')
              .split(/\r?\n/)
              .map((line) => ({ text: line.trim(), timeMs: null }))
              .filter((line) => line.text);

        setLyrics(nextLyrics.length > 0 ? nextLyrics : getFallbackLyrics(track));
      } catch {
        if (!cancelled) {
          setLyrics(getFallbackLyrics(track));
        }
      } finally {
        if (!cancelled) {
          setLyricsLoading(false);
        }
      }
    }

    loadLyrics();

    return () => {
      cancelled = true;
    };
  }, [track]);

  const onSeek = useCallback((event) => {
    if (!progressBarWidth || !duration) return;
    const ratio = Math.min(Math.max(event.nativeEvent.locationX / progressBarWidth, 0), 1);
    seekTo(ratio * duration);
  }, [duration, progressBarWidth, seekTo]);

  const repeatColor =
    repeatMode === 'none' ? theme.text30
      : repeatMode === 'one' ? theme.accent : theme.text80;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={styles.bg}>
        <LinearGradient
          colors={[`${artGradient[0]}88`, `${artGradient[1]}66`, theme.bg]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={20} color={theme.text80} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <TouchableOpacity style={styles.topTag}>
            <Ionicons name="musical-note" size={12} color={theme.accentMuted} />
            <Text style={styles.topTagText}>{copy.playback}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => {
            setMenuMode('menu');
            setMenuVisible(true);
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.text80} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {Object.values(copy.tabs).map((tabName) => (
          <TouchableOpacity key={tabName} style={styles.tabItem} onPress={() => setTab(tabName)}>
            <Text style={[styles.tabText, tab === tabName && styles.tabTextActive]}>{tabName}</Text>
            {tab === tabName && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {tab === copy.tabs.player && (
        <View style={styles.playerContent}>
          <View style={styles.artworkContainer}>
            <Artwork
              coverUrl={track.coverUrl}
              gradient={artGradient}
              style={styles.artwork}
              imageStyle={styles.artwork}
            />
          </View>

          <View style={styles.trackSection}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>{track.title}</Text>
              <Text style={styles.trackArtist}>{track.artist}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="heart-outline" size={24} color={theme.text40} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressSection}>
            <TouchableOpacity
              style={styles.progressTrack}
              onPress={onSeek}
              onLayout={(event) => setProgressBarWidth(event.nativeEvent.layout.width)}
              activeOpacity={1}
            >
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
            </TouchableOpacity>
            <View style={styles.progressTimes}>
              <Text style={styles.timeText}>{formatMs(position)}</Text>
              <Text style={styles.timeText}>{formatMs(duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={toggleShuffle}>
              <Ionicons
                name="shuffle"
                size={22}
                color={isShuffled ? theme.accent : theme.text30}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={prev}>
              <Ionicons name="play-skip-back" size={28} color={theme.text80} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
              {isLoading
                ? <Ionicons name="hourglass-outline" size={24} color={theme.onAccent} />
                : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={30}
                    color={theme.onAccent}
                    style={isPlaying ? undefined : { marginLeft: 3 }}
                  />
                )}
            </TouchableOpacity>
            <TouchableOpacity onPress={next}>
              <Ionicons name="play-skip-forward" size={28} color={theme.text80} />
            </TouchableOpacity>
            <TouchableOpacity onPress={cycleRepeat}>
              <View>
                <Ionicons name="repeat" size={22} color={repeatColor} />
                {repeatMode === 'one' && <View style={styles.repeatOneDot} />}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.bottomAction}
              onPress={() => {
                setMenuMode('playlist');
                setMenuVisible(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.text40} />
              <Text style={styles.bottomActionText}>{copy.playlist}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomAction}
              onPress={() => navigation.navigate('Room', room ? undefined : { createFromPlayer: true })}
            >
              <Ionicons name="radio-outline" size={20} color={theme.text40} />
              <Text style={styles.bottomActionText}>{copy.radio}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomAction}
              onPress={() => navigation.navigate('ArtistDetail', {
                artist: {
                  name: track.artist,
                  gradients: artGradient,
                  id: track.artistId,
                  coverUrl: track.coverUrl,
                },
              })}
            >
              <Ionicons name="person-outline" size={20} color={theme.text40} />
              <Text style={styles.bottomActionText}>{copy.artist}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {tab === copy.tabs.lyrics && (
        <ScrollView style={styles.lyricsScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.lyricsContainer}>
            {lyricsLoading ? (
              <Text style={styles.noLyrics}>{copy.loadingLyrics}</Text>
            ) : lyrics.length > 0 ? (
              lyrics.map((line, index) => (
                <Text
                  key={`${line.text}-${index}`}
                  style={[
                    styles.lyricLine,
                    activeLyricIndex === index && styles.lyricLineActive,
                  ]}
                >
                  {line.text}
                </Text>
              ))
            ) : (
              <Text style={styles.noLyrics}>{copy.noLyrics}</Text>
            )}
          </View>

          <View style={styles.compactPlayer}>
            <Artwork
              coverUrl={track.coverUrl}
              gradient={artGradient}
              style={styles.compactArt}
              imageStyle={styles.compactArt}
            />
            <View style={styles.compactInfo}>
              <Text style={styles.compactName}>{track.title}</Text>
              <Text style={styles.compactArtist}>{track.artist}</Text>
            </View>
            <View style={styles.compactControls}>
              <TouchableOpacity onPress={prev}>
                <Ionicons name="play-skip-back" size={20} color={theme.text60} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.compactPlay} onPress={togglePlay}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={theme.onAccent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={next}>
                <Ionicons name="play-skip-forward" size={20} color={theme.text60} />
              </TouchableOpacity>
            </View>
            <View style={styles.compactProgress}>
              <View style={[styles.compactProgressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {tab === copy.tabs.queue && (
        <ScrollView style={styles.queueScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.queueCurrentSection}>
            <Artwork
              coverUrl={track.coverUrl}
              gradient={artGradient}
              style={styles.queueArt}
              imageStyle={styles.queueArt}
            />
            <View style={styles.queueCurrentInfo}>
              <Text style={styles.queueNowLabel}>{copy.nowPlaying}</Text>
              <Text style={styles.queueCurrentName}>{track.title}</Text>
              <Text style={styles.queueCurrentArtist}>{track.artist}</Text>
            </View>
          </View>

          <View style={styles.queueTabsRow}>
            {copy.queueTabs.map((tabName, index) => (
              <TouchableOpacity key={tabName} style={styles.qTab}>
                <Text style={[styles.qTabText, index === 0 && styles.qTabTextActive]}>{tabName}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {queue.map((item, index) => (
            <TouchableOpacity
              key={`${item.id}-${index}`}
              style={[styles.queueItem, index === queueIndex && styles.queueItemActive]}
              activeOpacity={0.7}
              onPress={() => playTrack(item, queue, index)}
            >
              <Text style={styles.queueItemNum}>{index + 1}</Text>
              <Artwork
                coverUrl={item.coverUrl}
                gradient={item.artGradient || ['#1e1818', '#281e24']}
                style={styles.queueItemArt}
                imageStyle={styles.queueItemArt}
              />
              <View style={styles.queueItemInfo}>
                <Text style={styles.queueItemName}>{item.title}</Text>
                <Text style={styles.queueItemArtist}>{item.artist}</Text>
              </View>
              <Text style={styles.queueItemDur}>{item.duration || ''}</Text>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={16} color={theme.text20} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      <TrackOptionsSheet
        visible={menuVisible}
        track={track}
        initialMode={menuMode}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    bg: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 16,
      justifyContent: 'space-between',
      zIndex: 10,
    },
    topBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    topTag: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    topTagText: { fontSize: 11 * theme.scale, fontWeight: '500', color: theme.text60, letterSpacing: 0.5 },
    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      gap: 24,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.text08,
      zIndex: 10,
    },
    tabItem: { paddingBottom: 12, paddingTop: 4, alignItems: 'center' },
    tabText: { fontSize: 14 * theme.scale, fontWeight: '500', color: theme.text30 },
    tabTextActive: { color: theme.accent, fontWeight: '600' },
    tabUnderline: { height: 2, width: '100%', backgroundColor: theme.accent, borderRadius: 1, marginTop: 8 },
    playerContent: { flex: 1, paddingHorizontal: 24, zIndex: 10 },
    artworkContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
    artwork: {
      width: width - 48,
      aspectRatio: 1,
      borderRadius: radius.lg + 4,
      overflow: 'hidden',
      maxHeight: 340,
    },
    trackSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    trackInfo: { flex: 1, paddingRight: 16 },
    trackName: { fontSize: 22 * theme.scale, fontWeight: '700', color: theme.text, letterSpacing: -0.4 },
    trackArtist: { fontSize: 15 * theme.scale, color: theme.text40, marginTop: 4 },
    progressSection: { marginBottom: 24 },
    progressTrack: {
      height: 3,
      backgroundColor: theme.text12,
      borderRadius: 2,
      position: 'relative',
      overflow: 'visible',
    },
    progressFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 2 },
    progressThumb: {
      position: 'absolute',
      top: -4,
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: theme.accent,
      transform: [{ translateX: -5 }],
    },
    progressTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeText: { fontSize: 12 * theme.scale, color: theme.text30 },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
      marginBottom: 28,
    },
    playBtn: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    repeatOneDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.accent,
      position: 'absolute',
      bottom: -5,
      alignSelf: 'center',
    },
    bottomActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingBottom: 16,
    },
    bottomAction: { alignItems: 'center', gap: 6, maxWidth: 84 },
    bottomActionText: { fontSize: 11 * theme.scale, color: theme.text30, textAlign: 'center' },
    lyricsScroll: { flex: 1, zIndex: 10 },
    lyricsContainer: { padding: 24, gap: 8 },
    lyricLine: {
      fontSize: 18 * theme.scale,
      fontWeight: '500',
      color: theme.text35,
      lineHeight: 32 * theme.scale,
    },
    lyricLineActive: {
      color: theme.text,
    },
    noLyrics: { fontSize: 15 * theme.scale, color: theme.text20, textAlign: 'center', marginTop: 40 },
    compactPlayer: {
      marginHorizontal: 24,
      padding: 14,
      backgroundColor: theme.playerBg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      overflow: 'hidden',
    },
    compactArt: { width: 44, height: 44, borderRadius: radius.sm },
    compactInfo: { flex: 1 },
    compactName: { fontSize: 13 * theme.scale, fontWeight: '600', color: theme.text },
    compactArtist: { fontSize: 11 * theme.scale, color: theme.text40, marginTop: 2 },
    compactControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    compactPlay: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactProgress: {
      position: 'absolute',
      bottom: 0,
      left: 14,
      right: 14,
      height: 2,
      backgroundColor: theme.text08,
      borderRadius: 1,
    },
    compactProgressFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 1 },
    queueScroll: { flex: 1, zIndex: 10 },
    queueCurrentSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 24,
      paddingBottom: 16,
    },
    queueArt: { width: 64, height: 64, borderRadius: radius.md },
    queueCurrentInfo: { flex: 1 },
    queueNowLabel: {
      fontSize: 11 * theme.scale,
      color: theme.text30,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    queueCurrentName: { fontSize: 18 * theme.scale, fontWeight: '700', color: theme.text, letterSpacing: -0.3 },
    queueCurrentArtist: { fontSize: 14 * theme.scale, color: theme.text40, marginTop: 2 },
    queueTabsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 8 },
    qTab: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      backgroundColor: theme.glass,
    },
    qTabText: { fontSize: 13 * theme.scale, color: theme.text30, fontWeight: '500' },
    qTabTextActive: { color: theme.accent },
    queueItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 8,
    },
    queueItemActive: { backgroundColor: theme.glass },
    queueItemNum: { width: 20, fontSize: 13 * theme.scale, color: theme.text20, textAlign: 'center' },
    queueItemArt: { width: 44, height: 44, borderRadius: radius.sm, flexShrink: 0 },
    queueItemInfo: { flex: 1 },
    queueItemName: { fontSize: 14 * theme.scale, fontWeight: '500', color: theme.text },
    queueItemArtist: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 2 },
    queueItemDur: { fontSize: 12 * theme.scale, color: theme.text20 },
  });
}
