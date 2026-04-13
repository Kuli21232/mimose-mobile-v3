import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackItem from '../components/TrackItem';
import MiniPlayer from '../components/MiniPlayer';
import TrackOptionsSheet from '../components/TrackOptionsSheet';
import usePlayerStore from '../store/playerStore';
import { yandexApi } from '../api/yandex';
import { artistsApi } from '../api/profile';
import { getCachedResource } from '../utils/cache';
import {
  extractResults,
  normalizeAlbum as mapAlbum,
  normalizeTrack as mapTrack,
} from '../utils/media';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

export default function ArtistDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { language } = useI18n();
  const styles = createStyles(theme);
  const copy = language === 'ru'
    ? {
      fallback: 'Артист',
      listeners: 'слушателей',
      tracks: 'треков',
      listen: 'Слушать',
      follow: 'Следить',
      following: 'Вы следите',
      popular: 'Популярные',
      albums: 'Альбомы',
      all: 'Все',
      tracksStat: 'Треков',
      albumsStat: 'Альбомов',
      listenersStat: 'Слушателей',
    }
    : {
      fallback: 'Artist',
      listeners: 'listeners',
      tracks: 'tracks',
      listen: 'Play',
      follow: 'Follow',
      following: 'Following',
      popular: 'Popular',
      albums: 'Albums',
      all: 'All',
      tracksStat: 'Tracks',
      albumsStat: 'Albums',
      listenersStat: 'Listeners',
    };
  const artist = route.params?.artist || { name: copy.fallback, gradients: ['#2a2020', '#201a28'] };
  const [following, setFollowing] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuTrack, setMenuTrack] = useState(null);
  const playTrack = usePlayerStore((state) => state.playTrack);

  useEffect(() => {
    if (!artist.id) {
      setLoading(false);
      return;
    }

    Promise.all([
      getCachedResource(`artist:${artist.id}:tracks`, async () => (await yandexApi.getArtistTracks(artist.id)).data, { ttlMs: 30 * 60 * 1000 }),
      getCachedResource(`artist:${artist.id}:albums`, async () => (await yandexApi.getArtistAlbums(artist.id)).data, { ttlMs: 60 * 60 * 1000 }),
      getCachedResource(`artist:${artist.id}:info`, async () => (await yandexApi.getArtistInfo(artist.id)).data, { ttlMs: 60 * 60 * 1000 }),
    ])
      .then(([tracksRes, albumsRes, infoRes]) => {
        const tracksList = extractResults(tracksRes.data, ['tracks']);
        const albumsList = extractResults(albumsRes.data, ['albums']);
        setTracks(tracksList.map((track) => mapTrack(track, { source: 'yandex' })));
        setAlbums(albumsList.map((album) => mapAlbum(album, artist.name)));
        setInfo(infoRes.data || null);
      })
      .finally(() => setLoading(false));
  }, [artist.id, artist.name]);

  const handlePlay = async (track) => {
    const started = await playTrack(track, tracks, tracks.indexOf(track));
    if (started) {
      navigation.navigate('Player');
    }
  };

  const handleFollow = async () => {
    try {
      if (following) {
        await artistsApi.untrackArtist(`yandex:${artist.id}`);
      } else {
        await artistsApi.trackArtist({ id: artist.id, source: 'yandex', name: artist.name });
      }
      setFollowing(!following);
    } catch {
      setFollowing(!following);
    }
  };

  const listenersCount = info?.counts?.listeners || 0;
  const listenersStr = listenersCount
    ? listenersCount >= 1_000_000
      ? `${(listenersCount / 1_000_000).toFixed(1)}M ${copy.listeners}`
      : `${listenersCount.toLocaleString()} ${copy.listeners}`
    : '';

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 60 }]}>
          <LinearGradient
            colors={[...(artist.gradients || ['#2a2020', '#201a28']), theme.bg]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={theme.text60} />
          </TouchableOpacity>

          {artist.coverUrl ? (
            <Image source={{ uri: artist.coverUrl }} style={styles.heroAvatar} />
          ) : (
            <LinearGradient colors={artist.gradients || ['#2a2020', '#201a28']} style={styles.heroAvatar} />
          )}
          <Text style={styles.heroName}>{artist.name}</Text>
          <View style={styles.heroMeta}>
            {!!listenersStr && (
              <View style={styles.heroMetaItem}>
                <Ionicons name="headset-outline" size={13} color={theme.text40} />
                <Text style={styles.heroMetaText}>{listenersStr}</Text>
              </View>
            )}
            {tracks.length > 0 && (
              <View style={styles.heroMetaItem}>
                <Ionicons name="musical-notes-outline" size={13} color={theme.text40} />
                <Text style={styles.heroMetaText}>{tracks.length} {copy.tracks}</Text>
              </View>
            )}
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroBtnPrimary}
              onPress={() => tracks.length > 0 && handlePlay(tracks[0])}
            >
              <Ionicons name="play" size={16} color={theme.onAccent} />
              <Text style={styles.heroBtnPrimaryText}>{copy.listen}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnSecondary} onPress={handleFollow}>
              <Ionicons name={following ? 'checkmark' : 'add'} size={16} color={theme.text80} />
              <Text style={styles.heroBtnSecondaryText}>{following ? copy.following : copy.follow}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.accentMuted} style={{ marginTop: 30 }} />
        ) : (
          <>
            {(info?.counts || tracks.length > 0) && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{tracks.length || info?.counts?.tracks || '—'}</Text>
                  <Text style={styles.statLbl}>{copy.tracksStat}</Text>
                </View>
                <View style={[styles.statItem, styles.statBorder]}>
                  <Text style={styles.statVal}>{albums.length || info?.counts?.albums || '—'}</Text>
                  <Text style={styles.statLbl}>{copy.albumsStat}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>
                    {listenersCount
                      ? listenersCount >= 1_000_000
                        ? `${(listenersCount / 1_000_000).toFixed(1)}M`
                        : `${Math.max(1, Math.floor(listenersCount / 1000))}K`
                      : '—'}
                  </Text>
                  <Text style={styles.statLbl}>{copy.listenersStat}</Text>
                </View>
              </View>
            )}

            {tracks.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{copy.popular}</Text>
                  <TouchableOpacity><Text style={styles.sectionLink}>{copy.all}</Text></TouchableOpacity>
                </View>
                {tracks.slice(0, 5).map((track, index) => (
                  <TrackItem
                    key={`${track.source}:${track.id}:${index}`}
                    track={track}
                    index={index}
                    showIndex
                    onPress={() => handlePlay(track)}
                    onMore={() => setMenuTrack(track)}
                  />
                ))}
              </>
            )}

            {albums.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{copy.albums}</Text>
                  <TouchableOpacity><Text style={styles.sectionLink}>{copy.all}</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumsRow}>
                  {albums.map((album) => (
                    <TouchableOpacity
                      key={album.id}
                      style={styles.albumCard}
                      onPress={() => navigation.navigate('AlbumDetail', { album: { ...album, artist: artist.name } })}
                      activeOpacity={0.7}
                    >
                      {album.coverUrl ? (
                        <Image source={{ uri: album.coverUrl }} style={styles.albumArt} />
                      ) : (
                        <LinearGradient colors={album.artGradient} style={styles.albumArt} />
                      )}
                      <Text style={styles.albumName} numberOfLines={1}>{album.name}</Text>
                      {album.year ? <Text style={styles.albumYear}>{album.year}</Text> : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </>
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
    hero: { paddingHorizontal: 24, paddingBottom: 24, position: 'relative', overflow: 'hidden' },
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
    heroAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.text12,
      marginBottom: 16,
    },
    heroName: { fontSize: 28 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.7, lineHeight: 32 * theme.scale },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
    heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    heroMetaText: { fontSize: 13 * theme.scale, color: theme.text40 },
    heroActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
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
    statsRow: {
      flexDirection: 'row',
      marginHorizontal: 24,
      marginTop: 8,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    statItem: {
      flex: 1,
      paddingVertical: 18,
      paddingHorizontal: 12,
      backgroundColor: theme.glass,
      alignItems: 'center',
    },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.glassBorderStrong },
    statVal: { fontSize: 18 * theme.scale, fontWeight: '700', color: theme.text, letterSpacing: -0.3 },
    statLbl: { fontSize: 10 * theme.scale, color: theme.text20, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 12,
    },
    sectionTitle: { fontSize: 20 * theme.scale, fontWeight: '700', color: theme.text, letterSpacing: -0.4 },
    sectionLink: { fontSize: 12 * theme.scale, color: theme.accentMuted, fontWeight: '500' },
    albumsRow: { paddingHorizontal: 24, gap: 14, paddingBottom: 4 },
    albumCard: { width: 130, gap: 8 },
    albumArt: { width: 130, height: 130, borderRadius: radius.md },
    albumName: { fontSize: 13 * theme.scale, fontWeight: '500', color: theme.text },
    albumYear: { fontSize: 11 * theme.scale, color: theme.text30 },
  });
}
