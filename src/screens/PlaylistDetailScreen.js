import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { tracks } from '../data/mock';
import TrackItem from '../components/TrackItem';
import Pill from '../components/Pill';
import MiniPlayer from '../components/MiniPlayer';

const FILTERS = ['Все', 'Популярные', 'Новинки', 'Мои'];

export default function PlaylistDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const playlist = route.params?.playlist || {
    name: 'Моя волна',
    tracks: 24,
    artColors: ['#1e1818', '#281e24', '#181e18', '#1e2428'],
  };
  const [filter, setFilter] = useState('Все');

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 60 }]}>
          <LinearGradient
            colors={['rgba(60,50,60,0.6)', 'rgba(30,25,35,0.8)', colors.bg]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={colors.text60} />
          </TouchableOpacity>

          {/* Playlist art */}
          <View style={styles.plArt}>
            {playlist.artColors.map((c, i) => (
              <View key={i} style={[styles.plArtCell, { backgroundColor: c }]} />
            ))}
          </View>

          {/* Playlist info */}
          <Text style={styles.plName}>{playlist.name}</Text>
          <Text style={styles.plMeta}>{playlist.tracks} треков · Публичный</Text>

          {/* Actions */}
          <View style={styles.plActions}>
            <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => navigation.navigate('Player')}>
              <Ionicons name="play" size={16} color={colors.bg} />
              <Text style={styles.heroBtnPrimaryText}>Слушать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnSecondary}>
              <Ionicons name="shuffle" size={16} color={colors.text80} />
              <Text style={styles.heroBtnSecondaryText}>Случайно</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnSecondary}>
              <Ionicons name="add" size={16} color={colors.text80} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {FILTERS.map((f) => (
            <Pill key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>

        {/* Tracks */}
        {tracks.map((track, i) => (
          <TrackItem
            key={track.id}
            track={track}
            index={i}
            showIndex
            onPress={() => navigation.navigate('Player')}
          />
        ))}

        <View style={{ height: 160 }} />
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  hero: {
    paddingHorizontal: 24, paddingBottom: 24,
    position: 'relative', overflow: 'hidden',
    alignItems: 'center',
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,5,0.4)' },
  backBtn: {
    position: 'absolute', left: 20,
    width: 38, height: 38, borderRadius: radius.full,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  plArt: {
    width: 180, height: 180, borderRadius: radius.lg,
    flexDirection: 'row', flexWrap: 'wrap',
    overflow: 'hidden', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 50,
  },
  plArtCell: { width: '50%', height: '50%' },
  plName: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5, textAlign: 'center' },
  plMeta: { fontSize: 13, color: colors.text40, marginTop: 6, textAlign: 'center' },
  plActions: { flexDirection: 'row', gap: 10, marginTop: 18, justifyContent: 'center', alignItems: 'center' },
  heroBtnPrimary: {
    paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: colors.text, borderRadius: radius.full,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  heroBtnPrimaryText: { fontSize: 13, fontWeight: '600', color: colors.bg },
  heroBtnSecondary: {
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: colors.glass, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  heroBtnSecondaryText: { fontSize: 13, fontWeight: '600', color: colors.text80 },
  pillsRow: { paddingHorizontal: 24, gap: 8, paddingVertical: 8 },
});
