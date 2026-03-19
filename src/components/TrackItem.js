import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';

export default function TrackItem({ track, index, showIndex = false, onPress, onMore }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {showIndex && (
        <Text style={styles.index}>{index + 1}</Text>
      )}
      <LinearGradient colors={track.artGradient || ['#1e1818', '#281e24']} style={styles.art} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      {track.duration && (
        <Text style={styles.duration}>{track.duration}</Text>
      )}
      <TouchableOpacity onPress={onMore} style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.text20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 7,
    paddingHorizontal: 24,
  },
  index: {
    width: 22,
    fontSize: 13,
    color: colors.text20,
    textAlign: 'center',
    
  },
  art: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.2,
  },
  artist: {
    fontSize: 12,
    color: colors.text30,
    marginTop: 2,
  },
  duration: {
    fontSize: 12,
    color: colors.text20,
    flexShrink: 0,
    
    letterSpacing: 0.3,
  },
  moreBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
