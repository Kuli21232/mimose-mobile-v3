import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, useAppTheme } from '../theme';
import usePlayerStore from '../store/playerStore';

export default function TrackItem({ track, index, showIndex = false, onPress, onMore }) {
  const { currentTrack, isPlaying } = usePlayerStore();
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const isActive = currentTrack?.id === track.id && currentTrack?.source === track.source;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {showIndex && (
        <Text style={[styles.index, isActive && styles.indexActive]}>
          {isActive ? (isPlaying ? '▶' : '❚❚') : index + 1}
        </Text>
      )}
      {track.coverUrl ? (
        <Image source={{ uri: track.coverUrl }} style={styles.art} />
      ) : (
        <LinearGradient colors={track.artGradient || ['#1e1818', '#281e24']} style={styles.art} />
      )}
      <View style={styles.info}>
        <Text style={[styles.title, isActive && styles.titleActive]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      {track.duration && (
        <Text style={styles.duration}>{track.duration}</Text>
      )}
      {onMore ? (
        <TouchableOpacity
          onPress={onMore}
          style={styles.moreBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={theme.text20} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 7,
      paddingHorizontal: 24,
    },
    index: { width: 22, fontSize: 13 * theme.scale, color: theme.text20, textAlign: 'center' },
    indexActive: { color: theme.accent, fontSize: 11 * theme.scale, fontWeight: '700' },
    art: { width: 50, height: 50, borderRadius: radius.sm, flexShrink: 0 },
    info: { flex: 1, minWidth: 0 },
    title: { fontSize: 15 * theme.scale, fontWeight: '500', color: theme.text, letterSpacing: -0.2 },
    titleActive: { color: theme.accent, fontWeight: '700' },
    artist: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 2 },
    duration: { fontSize: 12 * theme.scale, color: theme.text20, flexShrink: 0, letterSpacing: 0.3 },
    moreBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  });
}
