import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { currentTrack, lyrics, queue } from '../data/mock';

const { width } = Dimensions.get('window');
const TABS = ['Плеер', 'Слова', 'Очередь'];

export default function PlayerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('Плеер');
  const [liked, setLiked] = useState(false);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Background */}
      <View style={styles.bg}>
        <LinearGradient
          colors={['rgba(80,60,60,0.4)', 'rgba(40,35,45,0.5)', colors.bg]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={20} color={colors.text80} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <TouchableOpacity style={styles.topTag}>
            <Ionicons name="musical-note" size={12} color={colors.text60} />
            <Text style={styles.topTagText}>Воспроизведение</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.topBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text80} />
        </TouchableOpacity>
      </View>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ---- PLAYER TAB ---- */}
      {tab === 'Плеер' && (
        <View style={styles.playerContent}>
          {/* Artwork */}
          <View style={styles.artworkContainer}>
            <LinearGradient
              colors={currentTrack.artGradient}
              style={styles.artwork}
            >
              <View style={styles.artworkInner} />
            </LinearGradient>
          </View>

          {/* Track info + like */}
          <View style={styles.trackSection}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>{currentTrack.title}</Text>
              <Text style={styles.trackArtist}>{currentTrack.artist}</Text>
            </View>
            <TouchableOpacity onPress={() => setLiked(!liked)}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={24}
                color={liked ? colors.text : colors.text40}
              />
            </TouchableOpacity>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${currentTrack.progress * 100}%` }]} />
              <View style={[styles.progressThumb, { left: `${currentTrack.progress * 100}%` }]} />
            </View>
            <View style={styles.progressTimes}>
              <Text style={styles.timeText}>{currentTrack.currentTime}</Text>
              <Text style={styles.timeText}>{currentTrack.duration}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity>
              <Ionicons name="shuffle" size={22} color={colors.text40} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="play-skip-back" size={28} color={colors.text80} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtn}>
              <Ionicons name="pause" size={30} color={colors.bg} style={{ marginLeft: 0 }} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="play-skip-forward" size={28} color={colors.text80} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="repeat" size={22} color={colors.text40} />
            </TouchableOpacity>
          </View>

          {/* Bottom actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.bottomAction}>
              <Ionicons name="share-outline" size={20} color={colors.text40} />
              <Text style={styles.bottomActionText}>Поделиться</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomAction}>
              <Ionicons name="add-circle-outline" size={20} color={colors.text40} />
              <Text style={styles.bottomActionText}>В плейлист</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomAction}>
              <Ionicons name="radio-outline" size={20} color={colors.text40} />
              <Text style={styles.bottomActionText}>Радио</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomAction} onPress={() => navigation.navigate('ArtistDetail', { artist: { name: currentTrack.artist, gradients: currentTrack.artGradient } })}>
              <Ionicons name="person-outline" size={20} color={colors.text40} />
              <Text style={styles.bottomActionText}>Артист</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ---- LYRICS TAB ---- */}
      {tab === 'Слова' && (
        <ScrollView style={styles.lyricsScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.lyricsContainer}>
            {lyrics.map((line, index) => (
              <Text
                key={line.id}
                style={[
                  styles.lyricLine,
                  index === 7 && styles.lyricActive,
                  (index === 6 || index === 8) && styles.lyricNear,
                ]}
              >
                {line.text}
              </Text>
            ))}
          </View>

          {/* Compact player at bottom of lyrics */}
          <View style={styles.compactPlayer}>
            <LinearGradient colors={currentTrack.artGradient} style={styles.compactArt} />
            <View style={styles.compactInfo}>
              <Text style={styles.compactName}>{currentTrack.title}</Text>
              <Text style={styles.compactArtist}>{currentTrack.artist}</Text>
            </View>
            <View style={styles.compactControls}>
              <TouchableOpacity>
                <Ionicons name="play-skip-back" size={20} color={colors.text60} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.compactPlay}>
                <Ionicons name="pause" size={18} color={colors.bg} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="play-skip-forward" size={20} color={colors.text60} />
              </TouchableOpacity>
            </View>
            <View style={styles.compactProgress}>
              <View style={[styles.compactProgressFill, { width: `${currentTrack.progress * 100}%` }]} />
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ---- QUEUE TAB ---- */}
      {tab === 'Очередь' && (
        <ScrollView style={styles.queueScroll} showsVerticalScrollIndicator={false}>
          {/* Current playing */}
          <View style={styles.queueCurrentSection}>
            <LinearGradient colors={currentTrack.artGradient} style={styles.queueArt} />
            <View style={styles.queueCurrentInfo}>
              <Text style={styles.queueNowLabel}>Сейчас играет</Text>
              <Text style={styles.queueCurrentName}>{currentTrack.title}</Text>
              <Text style={styles.queueCurrentArtist}>{currentTrack.artist}</Text>
            </View>
          </View>

          {/* Queue tabs */}
          <View style={styles.queueTabsRow}>
            {['Далее', 'Похожие', 'История'].map((t) => (
              <TouchableOpacity key={t} style={styles.qTab}>
                <Text style={[styles.qTabText, t === 'Далее' && styles.qTabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Queue items */}
          {queue.map((item, index) => (
            <TouchableOpacity key={item.id} style={styles.queueItem} activeOpacity={0.7}>
              <Text style={styles.queueItemNum}>{index + 1}</Text>
              <LinearGradient colors={item.artGradient} style={styles.queueItemArt} />
              <View style={styles.queueItemInfo}>
                <Text style={styles.queueItemName}>{item.title}</Text>
                <Text style={styles.queueItemArtist}>{item.artist}</Text>
              </View>
              <Text style={styles.queueItemDur}>{item.duration}</Text>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.text20} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bg: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 16,
    justifyContent: 'space-between', zIndex: 10,
  },
  topBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  topCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topTag: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: radius.full, backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  topTagText: { fontSize: 11, fontWeight: '500', color: colors.text60, letterSpacing: 0.5 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 24,
    borderBottomWidth: 0.5, borderBottomColor: colors.text08, zIndex: 10,
  },
  tabItem: { paddingBottom: 12, paddingTop: 4, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.text30 },
  tabTextActive: { color: colors.text, fontWeight: '600' },
  tabUnderline: { height: 2, width: '100%', backgroundColor: colors.text, borderRadius: 1, marginTop: 8 },

  // Player tab
  playerContent: { flex: 1, paddingHorizontal: 24, zIndex: 10 },
  artworkContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10,
  },
  artwork: {
    width: width - 48, aspectRatio: 1,
    borderRadius: radius.lg + 4, overflow: 'hidden',
    maxHeight: 340,
  },
  artworkInner: { flex: 1, opacity: 0.3 },
  trackSection: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  trackInfo: { flex: 1, paddingRight: 16 },
  trackName: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  trackArtist: { fontSize: 15, color: colors.text40, marginTop: 4 },
  progressSection: { marginBottom: 24 },
  progressTrack: {
    height: 3, backgroundColor: colors.text12, borderRadius: 2,
    position: 'relative', overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.text, borderRadius: 2 },
  progressThumb: {
    position: 'absolute', top: -4, width: 11, height: 11,
    borderRadius: 6, backgroundColor: colors.text,
    transform: [{ translateX: -5 }],
  },
  progressTimes: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
  },
  timeText: { fontSize: 12, color: colors.text30,  },
  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 28, marginBottom: 28,
  },
  playBtn: {
    width: 64, height: 64, borderRadius: radius.full,
    backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center',
  },
  bottomActions: {
    flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 16,
  },
  bottomAction: { alignItems: 'center', gap: 6 },
  bottomActionText: { fontSize: 11, color: colors.text30 },

  // Lyrics tab
  lyricsScroll: { flex: 1, zIndex: 10 },
  lyricsContainer: { padding: 24, gap: 8 },
  lyricLine: { fontSize: 18, fontWeight: '500', color: colors.text20, lineHeight: 32 },
  lyricActive: { fontSize: 22, fontWeight: '700', color: colors.text, lineHeight: 36 },
  lyricNear: { color: colors.text60, fontSize: 18 },
  compactPlayer: {
    marginHorizontal: 24, padding: 14,
    backgroundColor: 'rgba(18,18,18,0.9)',
    borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden',
  },
  compactArt: { width: 44, height: 44, borderRadius: radius.sm },
  compactInfo: { flex: 1 },
  compactName: { fontSize: 13, fontWeight: '600', color: colors.text },
  compactArtist: { fontSize: 11, color: colors.text40, marginTop: 2 },
  compactControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  compactPlay: {
    width: 34, height: 34, borderRadius: radius.full,
    backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center',
  },
  compactProgress: {
    position: 'absolute', bottom: 0, left: 14, right: 14,
    height: 2, backgroundColor: colors.text08, borderRadius: 1,
  },
  compactProgressFill: { height: '100%', backgroundColor: colors.text60, borderRadius: 1 },

  // Queue tab
  queueScroll: { flex: 1, zIndex: 10 },
  queueCurrentSection: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 24, paddingBottom: 16,
  },
  queueArt: { width: 64, height: 64, borderRadius: radius.md },
  queueCurrentInfo: { flex: 1 },
  queueNowLabel: { fontSize: 11, color: colors.text30, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  queueCurrentName: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  queueCurrentArtist: { fontSize: 14, color: colors.text40, marginTop: 2 },
  queueTabsRow: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 8,
  },
  qTab: {
    paddingVertical: 8, paddingHorizontal: 18,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  qTabText: { fontSize: 13, color: colors.text30, fontWeight: '500' },
  qTabTextActive: { color: colors.text },
  queueItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, paddingVertical: 8,
  },
  queueItemNum: { width: 20, fontSize: 13, color: colors.text20, textAlign: 'center' },
  queueItemArt: { width: 44, height: 44, borderRadius: radius.sm, flexShrink: 0 },
  queueItemInfo: { flex: 1 },
  queueItemName: { fontSize: 14, fontWeight: '500', color: colors.text },
  queueItemArtist: { fontSize: 12, color: colors.text30, marginTop: 2 },
  queueItemDur: { fontSize: 12, color: colors.text20,  },
});
