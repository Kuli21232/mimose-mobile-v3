import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { tracks } from '../data/mock';
import MiniPlayer from '../components/MiniPlayer';

export default function AlbumDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const album = route.params?.album || {
    name: 'Последний герой',
    artist: 'Кино',
    year: '1989',
    trackCount: 10,
    artGradient: ['#1a1518', '#050505'],
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 60 }]}>
          <LinearGradient
            colors={album.artGradient || ['#1a1518', colors.bg]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={colors.text60} />
          </TouchableOpacity>

          {/* Album art */}
          <LinearGradient colors={album.artGradient || ['#1e1818', '#281e24']} style={styles.albumArt} />

          {/* Album info */}
          <Text style={styles.albumName}>{album.name}</Text>
          <Text style={styles.albumArtist}>{album.artist}</Text>
          <View style={styles.albumInfo}>
            <Text style={styles.albumInfoText}>{album.year}</Text>
            <Text style={styles.albumInfoText}>·</Text>
            <Text style={styles.albumInfoText}>{album.trackCount || tracks.length} треков</Text>
          </View>

          {/* Actions */}
          <View style={styles.albumActions}>
            <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => navigation.navigate('Player')}>
              <Ionicons name="play" size={16} color={colors.bg} />
              <Text style={styles.heroBtnPrimaryText}>Слушать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnSecondary}>
              <Ionicons name="add" size={16} color={colors.text80} />
              <Text style={styles.heroBtnSecondaryText}>В библиотеку</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tracks */}
        {tracks.map((track, i) => (
          <TouchableOpacity
            key={track.id}
            style={styles.trackItem}
            onPress={() => navigation.navigate('Player')}
            activeOpacity={0.7}
          >
            <Text style={styles.trackNum}>{i + 1}</Text>
            <View style={styles.trackInfo}>
              <Text style={styles.trackName} numberOfLines={1}>{track.title}</Text>
              <Text style={styles.trackArtist}>{track.artist}</Text>
            </View>
            <Text style={styles.trackDur}>{track.duration}</Text>
            <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="ellipsis-horizontal" size={16} color={colors.text20} />
            </TouchableOpacity>
          </TouchableOpacity>
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
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,5,0.5)' },
  backBtn: {
    position: 'absolute', left: 20,
    width: 38, height: 38, borderRadius: radius.full,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  albumArt: {
    width: 200, height: 200, borderRadius: radius.lg,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 50,
  },
  albumName: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5, textAlign: 'center' },
  albumArtist: { fontSize: 14, color: colors.text40, marginTop: 4, textAlign: 'center' },
  albumInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  albumInfoText: { fontSize: 12, color: colors.text20 },
  albumActions: { flexDirection: 'row', gap: 10, marginTop: 18, justifyContent: 'center' },
  heroBtnPrimary: {
    paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: colors.text, borderRadius: radius.full,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  heroBtnPrimaryText: { fontSize: 13, fontWeight: '600', color: colors.bg },
  heroBtnSecondary: {
    paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: colors.glass, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  heroBtnSecondaryText: { fontSize: 13, fontWeight: '600', color: colors.text80 },
  trackItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 24, paddingVertical: 8,
  },
  trackNum: {
    width: 22, fontSize: 13, color: colors.text20,
    textAlign: 'center', 
  },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 15, fontWeight: '500', color: colors.text, letterSpacing: -0.2 },
  trackArtist: { fontSize: 12, color: colors.text30, marginTop: 2 },
  trackDur: { fontSize: 12, color: colors.text20,  },
  moreBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});
