import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MiniPlayer from '../components/MiniPlayer';
import usePlayerStore from '../store/playerStore';
import { yandexApi } from '../api/yandex';
import { getCachedResource } from '../utils/cache';
import {
  extractResults,
  normalizeAlbum as mapAlbum,
  normalizeTrack as mapTrack,
} from '../utils/media';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

export default function AlbumDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { language } = useI18n();
  const styles = createStyles(theme);
  const copy = language === 'ru'
    ? { album: 'Альбом', tracks: 'треков', listen: 'Слушать', save: 'В библиотеку' }
    : { album: 'Album', tracks: 'tracks', listen: 'Play', save: 'Save to library' };
  const routeAlbum = route.params?.album || {
    name: copy.album,
    artist: '—',
    year: '',
    artGradient: ['#0a0808', '#000000'],
  };
  const [album, setAlbum] = useState(mapAlbum(routeAlbum, routeAlbum.artist));
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const playTrack = usePlayerStore((state) => state.playTrack);

  useEffect(() => {
    if (!album.id) {
      setLoading(false);
      return;
    }

    getCachedResource(`album:${album.id}:details`, async () => (await yandexApi.getAlbumWithTracks(album.id)).data, {
      ttlMs: 60 * 60 * 1000,
    })
      .then((result) => {
        const payload = result.data || {};
        const normalizedAlbum = mapAlbum(payload, routeAlbum.artist || album.artist);
        const list = payload?.volumes?.flat?.() || extractResults(payload, ['tracks']);

        setAlbum((prev) => ({
          ...prev,
          ...normalizedAlbum,
          artist: normalizedAlbum.artist || prev.artist || routeAlbum.artist,
          trackCount: Math.max(list.length, normalizedAlbum.trackCount || 0, prev.trackCount || 0),
        }));
        setTracks(list.map((track) => mapTrack(track, { source: 'yandex' })));
      })
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, [album.id, routeAlbum.artist]);

  const handlePlay = async (track, index) => {
    const started = await playTrack(track, tracks, index);
    if (started) {
      navigation.navigate('Player');
    }
  };

  const artGradient = album.artGradient || ['#0a0808', '#000000'];
  const trackCount = Math.max(tracks.length, album.trackCount || 0);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 60 }]}>
          <LinearGradient colors={[artGradient[0], theme.bg]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={theme.text60} />
          </TouchableOpacity>

          {album.coverUrl ? (
            <Image source={{ uri: album.coverUrl }} style={styles.albumArt} />
          ) : (
            <LinearGradient colors={artGradient} style={styles.albumArt} />
          )}
          <Text style={styles.albumName}>{album.name}</Text>
          <Text style={styles.albumArtist}>{album.artist}</Text>
          <View style={styles.albumInfo}>
            {!!album.year && <Text style={styles.albumInfoText}>{album.year}</Text>}
            {!!album.year && <Text style={styles.albumInfoText}>·</Text>}
            <Text style={styles.albumInfoText}>{trackCount} {copy.tracks}</Text>
          </View>

          <View style={styles.albumActions}>
            <TouchableOpacity
              style={styles.heroBtnPrimary}
              onPress={() => tracks.length > 0 && handlePlay(tracks[0], 0)}
            >
              <Ionicons name="play" size={16} color={theme.onAccent} />
              <Text style={styles.heroBtnPrimaryText}>{copy.listen}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnSecondary}>
              <Ionicons name="add" size={16} color={theme.text80} />
              <Text style={styles.heroBtnSecondaryText}>{copy.save}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.accentMuted} style={{ marginTop: 30 }} />
        ) : (
          tracks.map((track, index) => (
            <TouchableOpacity
              key={`${track.source}:${track.id}:${index}`}
              style={styles.trackItem}
              onPress={() => handlePlay(track, index)}
              activeOpacity={0.7}
            >
              <Text style={styles.trackNum}>{index + 1}</Text>
              <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.trackArtist}>{track.artist}</Text>
              </View>
              <Text style={styles.trackDur}>{track.duration}</Text>
              <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={16} color={theme.text20} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 160 }} />
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    scroll: { flex: 1 },
    hero: { paddingHorizontal: 24, paddingBottom: 24, position: 'relative', overflow: 'hidden', alignItems: 'center' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,5,0.5)' },
    backBtn: {
      position: 'absolute',
      left: 20,
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    albumArt: {
      width: 200,
      height: 200,
      borderRadius: radius.lg,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.5,
      shadowRadius: 50,
    },
    albumName: { fontSize: 24 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.5, textAlign: 'center' },
    albumArtist: { fontSize: 14 * theme.scale, color: theme.text40, marginTop: 4, textAlign: 'center' },
    albumInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    albumInfoText: { fontSize: 12 * theme.scale, color: theme.text20 },
    albumActions: { flexDirection: 'row', gap: 10, marginTop: 18, justifyContent: 'center' },
    heroBtnPrimary: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: theme.accent,
      borderRadius: radius.full,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroBtnPrimaryText: { fontSize: 13 * theme.scale, fontWeight: '600', color: theme.onAccent },
    heroBtnSecondary: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: theme.glass,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroBtnSecondaryText: { fontSize: 13 * theme.scale, fontWeight: '600', color: theme.text80 },
    trackItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 24,
      paddingVertical: 8,
    },
    trackNum: { width: 22, fontSize: 13 * theme.scale, color: theme.text20, textAlign: 'center' },
    trackInfo: { flex: 1 },
    trackName: { fontSize: 15 * theme.scale, fontWeight: '500', color: theme.text, letterSpacing: -0.2 },
    trackArtist: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 2 },
    trackDur: { fontSize: 12 * theme.scale, color: theme.text20 },
    moreBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  });
}
