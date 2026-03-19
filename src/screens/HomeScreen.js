import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';
import { tracks, artists } from '../data/mock';
import MiniPlayer from '../components/MiniPlayer';
import TrackItem from '../components/TrackItem';
import ArtistCard from '../components/ArtistCard';
import SectionHeader from '../components/SectionHeader';

const WAVE_HEIGHTS = [18, 28, 22, 36, 24, 30, 16, 34, 26, 20, 32, 18, 28, 22, 36, 24];

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="leaf-outline" size={22} color={colors.text} />
              <Text style={styles.logoText}>Мимоза</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn}>
                <Ionicons name="notifications-outline" size={18} color={colors.text60} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search-outline" size={18} color={colors.text60} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Page Title */}
          <View style={styles.pageTitle}>
            <Text style={styles.titleMain}>Добрый вечер</Text>
            <Text style={styles.titleSub}>Ваша волна готова</Text>
          </View>

          {/* Wave Hero */}
          <TouchableOpacity style={styles.waveHero} activeOpacity={0.85} onPress={() => navigation.navigate('Player')}>
            <View style={styles.wavePlayBtn}>
              <Ionicons name="play" size={18} color={colors.text80} style={{ marginLeft: 2 }} />
            </View>
            <Text style={styles.waveTitle}>Моя волна</Text>
            <Text style={styles.waveDesc}>Персональная подборка на основе вашего вкуса</Text>
            {/* Wave decoration */}
            <View style={styles.waveDeco}>
              {WAVE_HEIGHTS.map((h, i) => (
                <View key={i} style={[styles.waveBar, { height: h }]} />
              ))}
            </View>
          </TouchableOpacity>

          {/* Quick pick label */}
          <Text style={styles.qpLabel}>Быстрый выбор на сегодня</Text>

          {/* Tracks */}
          {tracks.slice(0, 5).map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              onPress={() => navigation.navigate('Player')}
            />
          ))}

          {/* Artists Section */}
          <SectionHeader
            title="Артисты"
            linkText="Смотреть всё"
            onLinkPress={() => {}}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistsRow}>
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onPress={() => navigation.navigate('ArtistDetail', { artist })}
              />
            ))}
          </ScrollView>

          {/* Popular tracks */}
          <SectionHeader
            title="Популярные"
            linkText="Чарты"
            onLinkPress={() => navigation.navigate('Charts')}
          />
          {tracks.slice(5).map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              onPress={() => navigation.navigate('Player')}
            />
          ))}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 14,
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoText: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38, height: 38, borderRadius: radius.full,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { paddingHorizontal: 24, paddingBottom: 4 },
  titleMain: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.8, lineHeight: 36 },
  titleSub: { fontSize: 14, color: colors.text40, marginTop: 4, lineHeight: 20 },
  waveHero: {
    margin: 24,
    marginTop: 16,
    padding: 24,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  wavePlayBtn: {
    width: 50, height: 50, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.text30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  waveTitle: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 6 },
  waveDesc: { fontSize: 13, color: colors.text40, lineHeight: 20 },
  waveDeco: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 3, height: 50, paddingTop: 12, opacity: 0.06,
    position: 'absolute', bottom: 0, left: 24, right: 24,
  },
  waveBar: { flex: 1, backgroundColor: colors.text, borderRadius: 2 },
  qpLabel: { paddingHorizontal: 24, fontSize: 13, color: colors.text40, lineHeight: 20, marginTop: -4, marginBottom: 4 },
  artistsRow: { paddingHorizontal: 24, gap: 16, paddingBottom: 8 },
});
