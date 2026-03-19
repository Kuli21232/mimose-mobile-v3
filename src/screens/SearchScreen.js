import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';
import { tracks, artists, playlists } from '../data/mock';
import TrackItem from '../components/TrackItem';
import SectionHeader from '../components/SectionHeader';
import Pill from '../components/Pill';
import MiniPlayer from '../components/MiniPlayer';

const FILTERS = ['Всё', 'Треки', 'Артисты', 'Альбомы', 'Плейлисты'];

export default function SearchScreen({ navigation }) {
  const [filter, setFilter] = useState('Всё');
  const [query, setQuery] = useState('');

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Page Title */}
          <View style={styles.pageTitle}>
            <Text style={styles.title}>Поиск</Text>
            <Text style={styles.subtitle}>Найди что-нибудь новое</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.text35} />
            <TextInput
              style={styles.searchInput}
              placeholder="Артисты, треки, альбомы..."
              placeholderTextColor={colors.text20}
              value={query}
              onChangeText={setQuery}
              selectionColor={colors.text}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.text30} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {FILTERS.map((f) => (
              <Pill key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
            ))}
          </ScrollView>

          {/* Section: Треки */}
          {(filter === 'Всё' || filter === 'Треки') && (
            <>
              <SectionHeader title="Треки" linkText="Смотреть всё" />
              {tracks.slice(0, 4).map((track) => (
                <TrackItem key={track.id} track={track} onPress={() => navigation.navigate('Player')} />
              ))}
            </>
          )}

          {/* Section: Артисты */}
          {(filter === 'Всё' || filter === 'Артисты') && (
            <>
              <SectionHeader title="Артисты" linkText="Смотреть всё" />
              {artists.slice(0, 4).map((artist) => (
                <TouchableOpacity
                  key={artist.id}
                  style={styles.artistRow}
                  onPress={() => navigation.navigate('ArtistDetail', { artist })}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={artist.gradients} style={styles.artistAvatar} />
                  <View style={styles.artistInfo}>
                    <Text style={styles.artistName}>{artist.name}</Text>
                    <Text style={styles.artistType}>Артист</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.text20} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Section: Плейлисты */}
          {(filter === 'Всё' || filter === 'Плейлисты') && (
            <>
              <SectionHeader title="Плейлисты" linkText="Смотреть всё" />
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
  pageTitle: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 4 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: colors.text40, marginTop: 4 },
  searchBar: {
    marginHorizontal: 24, marginVertical: 12,
    paddingVertical: 14, paddingHorizontal: 18,
    backgroundColor: colors.glass, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  pillsRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 4 },
  artistRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  artistAvatar: { width: 50, height: 50, borderRadius: radius.full },
  artistInfo: { flex: 1 },
  artistName: { fontSize: 15, fontWeight: '500', color: colors.text },
  artistType: { fontSize: 12, color: colors.text30, marginTop: 2 },
  playlistGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
    paddingHorizontal: 24,
  },
  plCard: {
    width: '47%',
    backgroundColor: colors.glass, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden',
  },
  plArt: {
    width: '100%', aspectRatio: 1,
    flexDirection: 'row', flexWrap: 'wrap',
  },
  plArtCell: { width: '50%', height: '50%' },
  plInfo: { padding: 12 },
  plName: { fontSize: 14, fontWeight: '600', color: colors.text },
  plMeta: { fontSize: 11, color: colors.text20, marginTop: 3 },
});
