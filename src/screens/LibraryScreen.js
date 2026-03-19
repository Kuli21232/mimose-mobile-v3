import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { tracks, playlists } from '../data/mock';
import TrackItem from '../components/TrackItem';
import SectionHeader from '../components/SectionHeader';
import Pill from '../components/Pill';
import MiniPlayer from '../components/MiniPlayer';

const FILTERS = ['Все', 'Плейлисты', 'Загрузки'];

export default function LibraryScreen({ navigation }) {
  const [filter, setFilter] = useState('Все');

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Библиотека</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={20} color={colors.text60} />
            </TouchableOpacity>
          </View>

          {/* Liked tracks banner */}
          <TouchableOpacity style={styles.likedBanner} activeOpacity={0.85}>
            <View style={styles.likedIcon}>
              <Ionicons name="heart" size={22} color={colors.text80} />
            </View>
            <View style={styles.likedInfo}>
              <Text style={styles.likedTitle}>Понравившиеся</Text>
              <Text style={styles.likedMeta}>{tracks.length} треков</Text>
            </View>
            <TouchableOpacity style={styles.likedPlay}>
              <Ionicons name="play" size={18} color={colors.bg} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {FILTERS.map((f) => (
              <Pill key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
            ))}
          </ScrollView>

          {/* Playlists grid */}
          {(filter === 'Все' || filter === 'Плейлисты') && (
            <>
              <SectionHeader title="Плейлисты" linkText="Создать" />
              <View style={styles.playlistGrid}>
                {playlists.map((pl) => (
                  <TouchableOpacity
                    key={pl.id}
                    style={styles.plCard}
                    onPress={() => navigation.navigate('PlaylistDetail', { playlist: pl })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.plArt}>
                      {pl.artColors.map((c, i) => (
                        <View key={i} style={[styles.plArtCell, { backgroundColor: c }]} />
                      ))}
                    </View>
                    <View style={styles.plInfo}>
                      <Text style={styles.plName} numberOfLines={1}>{pl.name}</Text>
                      <Text style={styles.plMeta}>{pl.tracks} треков</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Recent tracks */}
          {(filter === 'Все' || filter === 'Загрузки') && (
            <>
              <SectionHeader title="Загруженные" linkText="Смотреть всё" />
              {tracks.slice(0, 6).map((track) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  onPress={() => navigation.navigate('Player')}
                />
              ))}
            </>
          )}

          <View style={{ height: 160 }} />
        </SafeAreaView>
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 6, paddingBottom: 14,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  addBtn: {
    width: 38, height: 38, borderRadius: radius.full,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  likedBanner: {
    marginHorizontal: 24, marginBottom: 8,
    paddingVertical: 18, paddingHorizontal: 20,
    backgroundColor: colors.glass, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  likedIcon: {
    width: 54, height: 54, borderRadius: radius.md,
    backgroundColor: colors.text06,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  likedInfo: { flex: 1 },
  likedTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  likedMeta: { fontSize: 12, color: colors.text30, marginTop: 3 },
  likedPlay: {
    width: 46, height: 46, borderRadius: radius.full,
    backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  pillsRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 4 },
  playlistGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
    paddingHorizontal: 24,
  },
  plCard: {
    width: '47%',
    backgroundColor: colors.glass, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden',
  },
  plArt: { width: '100%', aspectRatio: 1, flexDirection: 'row', flexWrap: 'wrap' },
  plArtCell: { width: '50%', height: '50%' },
  plInfo: { padding: 12 },
  plName: { fontSize: 14, fontWeight: '600', color: colors.text },
  plMeta: { fontSize: 11, color: colors.text20, marginTop: 3 },
});
