import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

export default function ArtistCard({ artist, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        <LinearGradient colors={artist.gradients || ['#2a2020', '#201a28']} style={styles.avatar} />
      </View>
      <Text style={styles.name} numberOfLines={1}>{artist.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    width: 80,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.text08,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text60,
    textAlign: 'center',
    width: '100%',
  },
});
