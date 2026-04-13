import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Pill from '../components/Pill';
import TopNav from '../components/TopNav';
import MiniPlayer from '../components/MiniPlayer';
import TrackOptionsSheet from '../components/TrackOptionsSheet';
import usePlayerStore from '../store/playerStore';
import { yandexApi } from '../api/yandex';
import { spotifyApi } from '../api/spotify';
import { normalizeTrack as mapTrack } from '../utils/media';
import { getCachedResource } from '../utils/cache';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

const SOURCES = ['yandex', 'spotify'];

function formatPlays(value) {
  if (!value) return '';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

function ChartItem({ item, onPress, onMore, theme }) {
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.chartItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.chartNum}>
        <Text style={styles.chartNumText}>{item.rank}</Text>
      </View>
      <LinearGradient colors={item.artGradient} style={styles.chartArt} />
      <View style={styles.chartInfo}>
        <Text style={styles.chartName} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.chartArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      {!!item.plays && <Text style={styles.chartPlays}>{item.plays}</Text>}
      <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={onMore}>
        <Ionicons name="ellipsis-horizontal" size={16} color={theme.text20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ChartsScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const styles = createStyles(theme);
  const [source, setSource] = useState('yandex');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuTrack, setMenuTrack] = useState(null);
  const playTrack = usePlayerStore((state) => state.playTrack);

  const load = async (nextSource = source, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const cacheKey = nextSource === 'spotify' ? 'charts:spotify' : 'charts:yandex';
      const fetcher = nextSource === 'spotify'
        ? async () => (await spotifyApi.getChart()).data
        : async () => (await yandexApi.getChart()).data;
      const trackSource = nextSource === 'spotify' ? 'spotify' : 'yandex';

      const result = await getCachedResource(cacheKey, fetcher, { ttlMs: 10 * 60 * 1000 });
      const rawTracks = result.data?.tracks || result.data || [];

      setTracks(
        rawTracks.map((track, index) => ({
          ...mapTrack(track, { source: trackSource }),
          rank: index + 1,
          plays: formatPlays(track.plays || track.playCount || track.popularity || track.chart?.listeners),
        })),
      );
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(source);
  }, [source]);

  const handlePlay = (track) => {
    playTrack(track, tracks, tracks.indexOf(track));
    navigation.navigate('Player');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(source, true)} tintColor={theme.accentMuted} />}
      >
        <SafeAreaView edges={['top']}>
          <TopNav title={strings.charts.title} onBack={() => navigation.goBack()} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {SOURCES.map((item) => (
              <Pill key={item} label={strings.charts.sources[item]} active={source === item} onPress={() => setSource(item)} />
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator color={theme.accentMuted} style={{ marginTop: 30 }} />
          ) : tracks.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {tracks.map((item) => (
                <ChartItem
                  key={`${item.source}:${item.id}`}
                  item={item}
                  onPress={() => handlePlay(item)}
                  onMore={() => setMenuTrack(item)}
                  theme={theme}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{strings.charts.empty}</Text>
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
    pillsRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 8 },
    chartItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      paddingHorizontal: 24,
    },
    chartNum: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: theme.text06,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    chartNumText: { fontSize: 11 * theme.scale, fontWeight: '700', color: theme.text40 },
    chartArt: { width: 46, height: 46, borderRadius: radius.xs, flexShrink: 0 },
    chartInfo: { flex: 1, minWidth: 0 },
    chartName: { fontSize: 14 * theme.scale, fontWeight: '500', color: theme.text },
    chartArtist: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 2 },
    chartPlays: { fontSize: 12 * theme.scale, color: theme.text20, flexShrink: 0 },
    moreBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    emptyText: { paddingHorizontal: 24, paddingTop: 24, fontSize: 14 * theme.scale, color: theme.text30 },
  });
}
