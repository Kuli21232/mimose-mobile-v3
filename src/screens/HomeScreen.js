import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MiniPlayer from '../components/MiniPlayer';
import TrackItem from '../components/TrackItem';
import ArtistCard from '../components/ArtistCard';
import SectionHeader from '../components/SectionHeader';
import TrackOptionsSheet from '../components/TrackOptionsSheet';
import usePlayerStore from '../store/playerStore';
import useAuthStore from '../store/authStore';
import { yandexApi } from '../api/yandex';
import { tracksApi } from '../api/tracks';
import { normalizeArtist, normalizeTrack } from '../utils/media';
import { getCachedResource } from '../utils/cache';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

const WAVE_HEIGHTS = [18, 28, 22, 36, 24, 30, 16, 34, 26, 20, 32, 18, 28, 22, 36, 24];

export default function HomeScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const styles = createStyles(theme);
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [popularTracks, setPopularTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuTrack, setMenuTrack] = useState(null);
  const { user } = useAuthStore();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const waveAnimRefs = useRef(WAVE_HEIGHTS.map(() => new Animated.Value(0.45)));

  const greet = () => {
    const hour = new Date().getHours();
    if (hour < 6) return strings.home.greetings.night;
    if (hour < 12) return strings.home.greetings.morning;
    if (hour < 18) return strings.home.greetings.day;
    return strings.home.greetings.evening;
  };

  const load = useCallback(async () => {
    try {
      const [chartRes, artistsRes, topRes] = await Promise.all([
        getCachedResource('home:chart', async () => (await yandexApi.getChart()).data, { ttlMs: 10 * 60 * 1000 }),
        getCachedResource('home:artists', async () => (await yandexApi.getTopArtists()).data, { ttlMs: 30 * 60 * 1000 }),
        getCachedResource('home:top-tracks', async () => (await tracksApi.getTopTracks()).data, { ttlMs: 10 * 60 * 1000 }),
      ]);

      const chart = chartRes.data?.tracks || chartRes.data || [];
      const artList = artistsRes.data?.artists || artistsRes.data || [];
      const top = topRes.data?.tracks || topRes.data || [];

      setTracks(chart.slice(0, 5).map((track) => normalizeTrack(track, { source: 'yandex' })));
      setArtists(artList.slice(0, 8).map(normalizeArtist));
      setPopularTracks(
        top.length > 0
          ? top.slice(0, 6).map((track) => normalizeTrack(track, { source: track.platform || 'yandex' }))
          : chart.slice(5, 11).map((track) => normalizeTrack(track, { source: 'yandex' })),
      );
    } catch (error) {
      console.warn('[HomeScreen] load error', error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const animations = waveAnimRefs.current.map((value, index) => (
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 70),
          Animated.timing(value, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.45,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      )
    ));

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handlePlay = async (track, list) => {
    const queue = list || tracks;
    const idx = queue.findIndex((item) => item.id === track.id);
    const started = await playTrack(track, queue, idx >= 0 ? idx : 0);
    if (started) {
      navigation.navigate('Player');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accentMuted} />}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="leaf-outline" size={22} color={theme.accent} />
              <Text style={styles.logoText}>{strings.appName}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn}>
                <Ionicons name="notifications-outline" size={18} color={theme.text60} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search-outline" size={18} color={theme.text60} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.pageTitle}>
            <Text style={styles.titleMain}>{greet()}</Text>
            <Text style={styles.titleSub}>
              {user?.handle ? `@${user.handle}` : strings.home.subtitleGuest}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.waveHero}
            activeOpacity={0.85}
            onPress={() => {
              if (tracks.length > 0) handlePlay(tracks[0], tracks);
            }}
          >
            <View style={styles.wavePlayBtn}>
              <Ionicons name="play" size={18} color={theme.onAccent} style={{ marginLeft: 2 }} />
            </View>
            <Text style={styles.waveTitle}>{strings.home.waveTitle}</Text>
            <Text style={styles.waveDesc}>{strings.home.waveDesc}</Text>
            <View style={styles.waveDeco}>
              {WAVE_HEIGHTS.map((height, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveBar,
                    {
                      height,
                      opacity: waveAnimRefs.current[index],
                      transform: [
                        {
                          scaleY: waveAnimRefs.current[index].interpolate({
                            inputRange: [0.45, 1],
                            outputRange: [0.72, 1.18],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </TouchableOpacity>

          <Text style={styles.qpLabel}>{strings.home.quickPick}</Text>

          {loading ? (
            <ActivityIndicator color={theme.accentMuted} style={{ marginTop: 20 }} />
          ) : (
            <>
              {tracks.map((track) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  onPress={() => handlePlay(track, tracks)}
                  onMore={() => setMenuTrack(track)}
                />
              ))}

              {artists.length > 0 && (
                <>
                  <SectionHeader title={strings.home.artists} linkText={strings.common.viewAll} onLinkPress={() => {}} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistsRow}>
                    {artists.map((artist) => (
                      <ArtistCard
                        key={artist.id}
                        artist={artist}
                        onPress={() => navigation.navigate('ArtistDetail', { artist })}
                      />
                    ))}
                  </ScrollView>
                </>
              )}

              {popularTracks.length > 0 && (
                <>
                  <SectionHeader title={strings.home.popular} linkText={strings.home.charts} onLinkPress={() => navigation.navigate('Charts')} />
                  {popularTracks.map((track) => (
                    <TrackItem
                      key={track.id}
                      track={track}
                      onPress={() => handlePlay(track, popularTracks)}
                      onMore={() => setMenuTrack(track)}
                    />
                  ))}
                </>
              )}
            </>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 6,
      paddingBottom: 14,
    },
    logo: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    logoText: { fontSize: 17 * theme.scale, fontWeight: '700', color: theme.text, letterSpacing: -0.4 },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageTitle: { paddingHorizontal: 24, paddingBottom: 4 },
    titleMain: { fontSize: 30 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.8, lineHeight: 36 * theme.scale },
    titleSub: { fontSize: 14 * theme.scale, color: theme.text40, marginTop: 4, lineHeight: 20 * theme.scale },
    waveHero: {
      margin: 24,
      marginTop: 16,
      padding: 24,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      overflow: 'hidden',
    },
    wavePlayBtn: {
      width: 50,
      height: 50,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    waveTitle: { fontSize: 24 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.5, marginBottom: 6 },
    waveDesc: { fontSize: 13 * theme.scale, color: theme.text40, lineHeight: 20 * theme.scale },
    waveDeco: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      height: 50,
      paddingTop: 12,
      opacity: 0.12,
      position: 'absolute',
      bottom: 0,
      left: 24,
      right: 24,
    },
    waveBar: { flex: 1, backgroundColor: theme.accent, borderRadius: 2 },
    qpLabel: { paddingHorizontal: 24, fontSize: 13 * theme.scale, color: theme.text40, lineHeight: 20 * theme.scale, marginTop: -4, marginBottom: 4 },
    artistsRow: { paddingHorizontal: 24, gap: 16, paddingBottom: 8 },
  });
}
