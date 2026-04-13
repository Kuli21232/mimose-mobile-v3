import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { radius, useAppTheme } from '../theme';

export default function Pill({ label, active, onPress }) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      flexShrink: 0,
    },
    pillActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accentBorder,
    },
    label: {
      fontSize: 13 * theme.scale,
      fontWeight: '500',
      color: theme.text60,
      letterSpacing: 0.1,
    },
    labelActive: {
      color: theme.onAccent,
    },
  });
}
