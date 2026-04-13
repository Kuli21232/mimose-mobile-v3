import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme';

export default function ArtistCard({ artist, onPress }) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        {artist.coverUrl ? (
          <Image source={{ uri: artist.coverUrl }} style={styles.avatar} />
        ) : (
          <LinearGradient colors={artist.gradients || ['#1a1010', '#100a18']} style={styles.avatar} />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{artist.name}</Text>
    </TouchableOpacity>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
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
      borderColor: theme.accentBorder,
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    name: {
      fontSize: 11 * theme.scale,
      fontWeight: '500',
      color: theme.text60,
      textAlign: 'center',
      width: '100%',
    },
  });
}
