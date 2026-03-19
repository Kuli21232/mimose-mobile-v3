import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';
import { currentTrack } from '../data/mock';

export default function MiniPlayer({ onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient colors={currentTrack.artGradient} style={styles.art} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="play-skip-back" size={20} color={colors.text60} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pause" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="play-skip-forward" size={20} color={colors.text60} />
        </TouchableOpacity>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${currentTrack.progress * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(18,18,18,0.92)',
    borderRadius: radius.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    zIndex: 50,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  artist: {
    fontSize: 11,
    color: colors.text40,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 0,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: colors.text08,
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text60,
    borderRadius: 1,
  },
});
