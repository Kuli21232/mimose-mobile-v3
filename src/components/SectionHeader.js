import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';

export default function SectionHeader({ title, linkText, onLinkPress }) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {linkText && (
        <TouchableOpacity onPress={onLinkPress}>
          <Text style={styles.link}>{linkText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 14,
    },
    title: {
      fontSize: 20 * theme.scale,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.4,
    },
    link: {
      fontSize: 12 * theme.scale,
      color: theme.accentMuted,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
  });
}
