import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { tracks, artists } from '../data/mock';
import TrackItem from '../components/TrackItem';
import MiniPlayer from '../components/MiniPlayer';

export default function ArtistDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const artist = route.params?.artist || { name: 'Кино', gradients: ['#2a2020', '#201a28'] };
  const [following, setFollowing] = useState(false);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 60 }]}>
          {/* Background */}
          <LinearGradient
            colors={[...(artist.gradients || ['#2a2020', '#201a28']), colors.bg]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={colors.text60} />
          </TouchableOpacity>

          {/* Avatar */}
          <LinearGradient colors={artist.gradients || ['#2a2020', '#201a28']} style={styles.heroAvatar} />

          {/* Name & meta */}
          <Text style={styles.heroName}>{artist.name}</Text>
          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Ionicons name="headset-outline" size={13} color={colors.text40} />
              <Text style={styles.heroMetaText}>1.2М слушателей</Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Ionicons name="musical-notes-outline" size={13} color={colors.text40} />
              <Text style={styles.heroMetaText}>48 треков</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroBtnPrimary}>
              <Ionicons name="play" size={16} color={colors.bg} />
              <Text style={styles.heroBtnPrimaryText}>Слушать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroBtnSecondary}
              onPress={() => setFollowing(!following)}
            >
              <Ionicons name={following ? 'checkmark' : 'add'} size={16} color={colors.text80} />
              <Text style={styles.heroBtnSecondaryText}>{following ? 'Вы следите' : 'Следить'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>48</Text>
            <Text style={styles.statLbl}>Треков</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statVal}>8</Text>
            <Text style={styles.statLbl}>Альбомов</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>1.2М</Text>
            <Text style={styles.statLbl}>Слушателей</Text>
          </View>
        </View>

        {/* Popular tracks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Популярные</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Все</Text>
          </TouchableOpacity>
        </View>
        {tracks.slice(0, 5).map((track, i) => (
          <TrackItem
            key={track.id}
            track={track}
            index={i}
            showIndex
            onPress={() => navigation.navigate('Player')}
          />
        ))}

        {/* Related artists */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Похожие артисты</Text>
          <TouchableOpacity><Text style={styles.sectionLink}>Все</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
          {artists.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.relatedCard}
              onPress={() => navigation.push('ArtistDetail', { artist: a })}
              activeOpacity={0.7}
            >
              <LinearGradient colors={a.gradients} style={styles.relatedAvatar} />
              <Text style={styles.relatedName} numberOfLines={1}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 160 }} />
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  hero: { paddingHorizontal: 24, paddingBottom: 24, position: 'relative', overflow: 'hidden' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,5,0.5)',
  },
  backBtn: {
    position: 'absolute', left: 20,
    width: 38, height: 38, borderRadius: radius.full,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  heroAvatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: colors.text12, marginBottom: 16,
  },
  heroName: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.7, lineHeight: 32 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText: { fontSize: 13, color: colors.text40 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
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
  statsRow: {
    flexDirection: 'row', marginHorizontal: 24, marginTop: 8,
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  statItem: {
    flex: 1, paddingVertical: 18, paddingHorizontal: 12,
    backgroundColor: colors.glass, alignItems: 'center',
  },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.glassBorder },
  statVal: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  statLbl: { fontSize: 10, color: colors.text20, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24,
    paddingTop: 28, paddingBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  sectionLink: { fontSize: 12, color: colors.text30, fontWeight: '500' },
  relatedRow: { paddingHorizontal: 24, gap: 14 },
  relatedCard: { flexShrink: 0, width: 110, alignItems: 'center', gap: 8 },
  relatedAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, borderColor: colors.text08 },
  relatedName: { fontSize: 12, fontWeight: '500', color: colors.text60, textAlign: 'center' },
});
