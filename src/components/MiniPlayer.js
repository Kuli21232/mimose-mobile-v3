import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, useAppTheme } from '../theme';
import usePlayerStore from '../store/playerStore';

export default function MiniPlayer({ onPress }) {
  const { currentTrack, isPlaying, position, duration, togglePlay, next, prev } = usePlayerStore();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = createStyles(theme, insets);

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;
  const artGradient = currentTrack.artGradient || ['#0a0808', '#100a10'];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {currentTrack.coverUrl ? (
        <Image source={{ uri: currentTrack.coverUrl }} style={styles.art} />
      ) : (
        <LinearGradient colors={artGradient} style={styles.art} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={(event) => { event.stopPropagation(); prev(); }}
        >
          <Ionicons name="play-skip-back" size={20} color={theme.text60} />
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={(event) => { event.stopPropagation(); togglePlay(); }}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={theme.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={(event) => { event.stopPropagation(); next(); }}
        >
          <Ionicons name="play-skip-forward" size={20} color={theme.text60} />
        </TouchableOpacity>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 18 + Math.max(insets.bottom, 0),
      left: 14,
      right: 14,
      backgroundColor: theme.playerBg,
      borderRadius: radius.md,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      zIndex: 50,
    },
    art: { width: 44, height: 44, borderRadius: radius.sm, flexShrink: 0 },
    info: { flex: 1, minWidth: 0 },
    title: { fontSize: 13 * theme.scale, fontWeight: '600', color: theme.text, letterSpacing: -0.2 },
    artist: { fontSize: 11 * theme.scale, color: theme.text40, marginTop: 2 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 0 },
    progressBar: {
      position: 'absolute',
      bottom: 0,
      left: 16,
      right: 16,
      height: 2,
      backgroundColor: theme.text08,
      borderRadius: 1,
    },
    progressFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 1 },
  });
}
