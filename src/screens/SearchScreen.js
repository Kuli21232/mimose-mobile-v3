import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TrackItem from '../components/TrackItem';
import SectionHeader from '../components/SectionHeader';
import Pill from '../components/Pill';
import MiniPlayer from '../components/MiniPlayer';
import TrackOptionsSheet from '../components/TrackOptionsSheet';
import usePlayerStore from '../store/playerStore';
import { yandexApi } from '../api/yandex';
import { tracksApi } from '../api/tracks';
import {
  extractResults,
  normalizeAlbum as mapAlbum,
  normalizeArtist as mapArtist,
  normalizePlaylist as mapPlaylist,
  normalizeTrack as mapTrack,
} from '../utils/media';
import { getCachedResource } from '../utils/cache';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

const FILTER_KEYS = ['all', 'tracks', 'artists', 'albums', 'playlists'];

export default function SearchScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const styles = createStyles(theme);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [trending, setTrending] = useState([]);
  const [results, setResults] = useState({ tracks: [], artists: [], albums: [], playlists: [] });
  const [loading, setLoading] = useState(false);
  const [menuTrack, setMenuTrack] = useState(null);
  const debounceRef = useRef(null);
  const playTrack = usePlayerStore((state) => state.playTrack);

  useEffect(() => {
    getCachedResource(
      'search:trending',
      async () => (await tracksApi.getTrendingSearches()).data,
      { ttlMs: 20 * 60 * 1000 },
    )
      .then((result) => {
        const list = extractResults(result.data, ['queries', 'searches']);
        setTrending(list.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  const doSearch = useCallback(async (value) => {
    if (!value.trim()) {
      setResults({ tracks: [], artists: [], albums: [], playlists: [] });
      return;
    }

    setLoading(true);

    try {
      const normalizedQuery = value.trim().toLowerCase();
      const result = await getCachedResource(
        `search:${normalizedQuery}`,
        async () => (await yandexApi.search(value)).data,
        { ttlMs: 10 * 60 * 1000 },
      );
      const data = result.data || {};

      setResults({
        tracks: extractResults(data, ['tracks']).map((track) => mapTrack(track, { source: 'yandex' })),
        artists: extractResults(data, ['artists']).map(mapArtist),
        albums: extractResults(data, ['albums']).map((album) => mapAlbum(album)),
        playlists: extractResults(data, ['playlists']).map((playlist) => mapPlaylist(playlist)),
      });
    } catch {
      setResults({ tracks: [], artists: [], albums: [], playlists: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeQuery = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 400);
  };

  const hasResults = query.trim().length > 0;
  const { tracks, artists, albums, playlists } = results;

  const handlePlayTrack = async (track) => {
    const started = await playTrack(track, tracks, tracks.indexOf(track));
    if (started) {
      navigation.navigate('Player');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top']}>
          <View style={styles.pageTitle}>
            <Text style={styles.title}>{strings.search.title}</Text>
            <Text style={styles.subtitle}>{strings.search.subtitle}</Text>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={theme.text35} />
            <TextInput
              style={styles.searchInput}
              placeholder={strings.search.placeholder}
              placeholderTextColor={theme.text20}
              value={query}
              onChangeText={onChangeQuery}
              selectionColor={theme.accent}
              returnKeyType="search"
              onSubmitEditing={() => doSearch(query)}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults({ tracks: [], artists: [], albums: [], playlists: [] }); }}>
                <Ionicons name="close-circle" size={18} color={theme.text30} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {FILTER_KEYS.map((item) => (
              <Pill key={item} label={strings.search.filters[item]} active={filter === item} onPress={() => setFilter(item)} />
            ))}
          </ScrollView>

          {loading && <ActivityIndicator color={theme.accentMuted} style={{ marginTop: 20 }} />}

          {!hasResults && !loading && trending.length > 0 && (
            <>
              <SectionHeader title={strings.search.trending} />
              <View style={styles.trendingGrid}>
                {trending.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.trendingChip}
                    onPress={() => onChangeQuery(item.query || item)}
                  >
                    <Ionicons name="trending-up-outline" size={14} color={theme.accentMuted} />
                    <Text style={styles.trendingText}>{item.query || item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {hasResults && !loading && (filter === 'all' || filter === 'tracks') && tracks.length > 0 && (
            <>
              <SectionHeader title={strings.common.tracks} linkText={strings.common.viewAll} />
              {tracks.slice(0, 6).map((track) => (
                <TrackItem
                  key={`${track.source}:${track.id}`}
                  track={track}
                  onPress={() => handlePlayTrack(track)}
                  onMore={() => setMenuTrack(track)}
                />
              ))}
            </>
          )}

          {hasResults && !loading && (filter === 'all' || filter === 'artists') && artists.length > 0 && (
            <>
              <SectionHeader title={strings.common.artists} linkText={strings.common.viewAll} />
              {artists.slice(0, 5).map((artist) => (
                <TouchableOpacity
                  key={artist.id}
                  style={styles.artistRow}
                  onPress={() => navigation.navigate('ArtistDetail', { artist })}
                  activeOpacity={0.7}
                >
                  {artist.coverUrl ? (
                    <Image source={{ uri: artist.coverUrl }} style={styles.artistAvatar} />
                  ) : (
                    <LinearGradient colors={artist.gradients} style={styles.artistAvatar} />
                  )}
                  <View style={styles.artistInfo}>
                    <Text style={styles.artistName}>{artist.name}</Text>
                    <Text style={styles.artistType}>{strings.search.artistType}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.text20} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {hasResults && !loading && (filter === 'all' || filter === 'albums') && albums.length > 0 && (
            <>
              <SectionHeader title={strings.common.albums} linkText={strings.common.viewAll} />
              {albums.slice(0, 4).map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.artistRow}
                  onPress={() => navigation.navigate('AlbumDetail', { album })}
                  activeOpacity={0.7}
                >
                  {album.coverUrl ? (
                    <Image source={{ uri: album.coverUrl }} style={[styles.artistAvatar, styles.albumAvatar]} />
                  ) : (
                    <View style={[styles.artistAvatar, styles.albumAvatar]}>
                      <Ionicons name="musical-notes" size={18} color={theme.accentMuted} style={styles.albumIcon} />
                    </View>
                  )}
                  <View style={styles.artistInfo}>
                    <Text style={styles.artistName}>{album.name}</Text>
                    <Text style={styles.artistType}>{album.artist}{album.year ? ` · ${album.year}` : ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.text20} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {hasResults && !loading && (filter === 'all' || filter === 'playlists') && playlists.length > 0 && (
            <>
              <SectionHeader title={strings.common.playlists} linkText={strings.common.viewAll} />
              {playlists.slice(0, 5).map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.playlistRow}
                  onPress={() => navigation.navigate('PlaylistDetail', { playlist })}
                  activeOpacity={0.75}
                >
                  <View style={styles.playlistArt}>
                    {playlist.coverUrl ? (
                      <Image source={{ uri: playlist.coverUrl }} style={styles.playlistArtImage} />
                    ) : (
                      playlist.artColors.slice(0, 4).map((color, index) => (
                        <View key={`${playlist.id}-${index}`} style={[styles.playlistArtCell, { backgroundColor: color }]} />
                      ))
                    )}
                  </View>
                  <View style={styles.artistInfo}>
                    <Text style={styles.artistName}>{playlist.name}</Text>
                    <Text style={styles.artistType}>
                      {playlist.tracksCount} {strings.common.tracks}
                      {playlist.ownerName ? ` · @${playlist.ownerName}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.text20} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {hasResults && !loading && tracks.length === 0 && artists.length === 0 && albums.length === 0 && playlists.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={36} color={theme.text20} />
              <Text style={styles.emptyText}>{strings.search.noResults}</Text>
              <Text style={styles.emptyHint}>{strings.search.noResultsHint}</Text>
            </View>
          )}

          <View style={{ height: 160 }} />
        </SafeAreaView>
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
    pageTitle: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 4 },
    title: { fontSize: 30 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.8 },
    subtitle: { fontSize: 14 * theme.scale, color: theme.text40, marginTop: 4 },
    searchBar: {
      marginHorizontal: 24,
      marginVertical: 12,
      paddingVertical: 14,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchInput: { flex: 1, fontSize: 15 * theme.scale, color: theme.text },
    pillsRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 4 },
    trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 24, marginTop: 4 },
    trendingChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: theme.glass,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    trendingText: { fontSize: 13 * theme.scale, color: theme.text60 },
    artistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    playlistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    artistAvatar: { width: 50, height: 50, borderRadius: radius.full, overflow: 'hidden' },
    albumAvatar: { borderRadius: radius.md, backgroundColor: theme.glass },
    albumIcon: { alignSelf: 'center', marginTop: 16 },
    playlistArt: {
      width: 50,
      height: 50,
      borderRadius: radius.md,
      overflow: 'hidden',
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: theme.glass,
    },
    playlistArtImage: { width: '100%', height: '100%' },
    playlistArtCell: { width: '50%', height: '50%' },
    artistInfo: { flex: 1 },
    artistName: { fontSize: 15 * theme.scale, fontWeight: '500', color: theme.text },
    artistType: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 2 },
    emptyBox: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyText: { fontSize: 18 * theme.scale, fontWeight: '600', color: theme.text40 },
    emptyHint: { fontSize: 13 * theme.scale, color: theme.text20 },
  });
}
