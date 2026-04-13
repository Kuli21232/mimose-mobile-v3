import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackItem from '../components/TrackItem';
import Pill from '../components/Pill';
import MiniPlayer from '../components/MiniPlayer';
import TrackOptionsSheet from '../components/TrackOptionsSheet';
import usePlayerStore from '../store/playerStore';
import { communityApi, playlistsApi } from '../api/playlists';
import {
  extractResults,
  normalizePlaylist as mapPlaylist,
  normalizeTrack as mapTrack,
} from '../utils/media';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

const FILTER_KEYS = ['all', 'popular', 'new'];

export default function PlaylistDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { language } = useI18n();
  const styles = createStyles(theme);
  const copy = language === 'ru'
    ? {
      title: 'Плейлист',
      tracks: 'треков',
      type: 'Плейлист',
      listen: 'Слушать',
      shuffle: 'Случайно',
      empty: 'Треков пока нет',
      filters: { all: 'Все', popular: 'Популярные', new: 'Новинки' },
    }
    : {
      title: 'Playlist',
      tracks: 'tracks',
      type: 'Playlist',
      listen: 'Play',
      shuffle: 'Shuffle',
      empty: 'No tracks yet',
      filters: { all: 'All', popular: 'Popular', new: 'New' },
    };
  const initialPlaylist = mapPlaylist(route.params?.playlist || {
    name: copy.title,
    tracksCount: 0,
    artColors: ['#1e1818', '#281e24', '#181e18', '#1e2428'],
  }, copy.title);
  const isCommunityPlaylist = Boolean(route.params?.community);
  const [filter, setFilter] = useState('all');
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuTrack, setMenuTrack] = useState(null);
  const { playTrack, toggleShuffle } = usePlayerStore();

  useEffect(() => {
    if (!playlist.id) {
      setLoading(false);
      return;
    }

    const request = isCommunityPlaylist
      ? communityApi.getPlaylist(playlist.id)
      : playlistsApi.getPlaylist(playlist.id);

    request
      .then((response) => {
        const payload =
          response.data?.playlist ||
          response.data?.data?.playlist ||
          response.data?.data ||
          response.data ||
          {};
        const trackSource =
          extractResults(payload, ['tracks', 'items']).length > 0
            ? payload
            : response.data;
        const list = extractResults(trackSource, ['tracks', 'items']);

        setPlaylist((prev) => ({
          ...prev,
          ...mapPlaylist(payload, prev.name),
          tracksCount: Math.max(list.length, mapPlaylist(payload, prev.name).tracksCount, prev.tracksCount || 0),
        }));
        setTracks(list.map((track) => mapTrack(track, { source: track?.source || track?.platform || 'yandex' })));
      })
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, [isCommunityPlaylist, playlist.id]);

  const handlePlay = async (track, index) => {
    const started = await playTrack(track, tracks, index);
    if (started) {
      navigation.navigate('Player');
    }
  };

  const handleShuffle = async () => {
    if (tracks.length > 0) {
      toggleShuffle();
      const index = Math.floor(Math.random() * tracks.length);
      const started = await playTrack(tracks[index], tracks, index);
      if (started) {
        navigation.navigate('Player');
      }
    }
  };

  const artColors = playlist.artColors || ['#1e1818', '#281e24', '#181e18', '#1e2428'];
  const tracksCount = Math.max(tracks.length, playlist.tracksCount || 0);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 60 }]}>
          <LinearGradient
            colors={['rgba(60,50,60,0.6)', 'rgba(30,25,35,0.8)', theme.bg]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={theme.text60} />
          </TouchableOpacity>

          <View style={styles.plArt}>
            {playlist.coverUrl ? (
              <Image source={{ uri: playlist.coverUrl }} style={styles.plArtImage} />
            ) : (
              artColors.slice(0, 4).map((color, index) => (
                <View key={index} style={[styles.plArtCell, { backgroundColor: color }]} />
              ))
            )}
          </View>

          <Text style={styles.plName}>{playlist.name}</Text>
          <Text style={styles.plMeta}>{tracksCount} {copy.tracks} · {copy.type}</Text>

          <View style={styles.plActions}>
            <TouchableOpacity
              style={styles.heroBtnPrimary}
              onPress={() => tracks.length > 0 && handlePlay(tracks[0], 0)}
            >
              <Ionicons name="play" size={16} color={theme.onAccent} />
              <Text style={styles.heroBtnPrimaryText}>{copy.listen}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnSecondary} onPress={handleShuffle}>
              <Ionicons name="shuffle" size={16} color={theme.text80} />
              <Text style={styles.heroBtnSecondaryText}>{copy.shuffle}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnSecondary}>
              <Ionicons name="add" size={16} color={theme.text80} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {FILTER_KEYS.map((item) => (
            <Pill key={item} label={copy.filters[item]} active={filter === item} onPress={() => setFilter(item)} />
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={theme.accentMuted} style={{ marginTop: 30 }} />
        ) : tracks.length === 0 ? (
          <Text style={styles.emptyHint}>{copy.empty}</Text>
        ) : (
          tracks.map((track, index) => (
            <TrackItem
              key={`${track.source}:${track.id}:${index}`}
              track={track}
              index={index}
              showIndex
              onPress={() => handlePlay(track, index)}
              onMore={() => setMenuTrack(track)}
            />
          ))
        )}

        <View style={{ height: 160 }} />
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
      <TrackOptionsSheet
        visible={Boolean(menuTrack)}
        track={menuTrack}
        onClose={() => setMenuTrack(null)}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    scroll: { flex: 1 },
    hero: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
    },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,5,0.4)' },
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
    plArt: {
      width: 180,
      height: 180,
      borderRadius: radius.lg,
      flexDirection: 'row',
      flexWrap: 'wrap',
      overflow: 'hidden',
      marginBottom: 20,
    },
    plArtImage: { width: '100%', height: '100%' },
    plArtCell: { width: '50%', height: '50%' },
    plName: { fontSize: 24 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.5, textAlign: 'center' },
    plMeta: { fontSize: 13 * theme.scale, color: theme.text40, marginTop: 6, textAlign: 'center' },
    plActions: { flexDirection: 'row', gap: 10, marginTop: 18, justifyContent: 'center', alignItems: 'center' },
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
      paddingHorizontal: 16,
      backgroundColor: theme.glass,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroBtnSecondaryText: { fontSize: 13 * theme.scale, fontWeight: '600', color: theme.text80 },
    pillsRow: { paddingHorizontal: 24, gap: 8, paddingVertical: 8 },
    emptyHint: { fontSize: 13 * theme.scale, color: theme.text20, paddingHorizontal: 24, paddingVertical: 12 },
  });
}
