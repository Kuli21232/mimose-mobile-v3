import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';

export default function AppStatusBar({ transparent = false }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4, backgroundColor: transparent ? 'transparent' : theme.bg }]}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.right}>
        <Ionicons name="cellular" size={16} color={theme.text40} />
        <Ionicons name="wifi" size={16} color={theme.text40} />
        <Ionicons name="battery-full" size={18} color={theme.text40} />
      </View>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingBottom: 6,
    },
    time: {
      fontSize: 15 * theme.scale,
      fontWeight: '600',
      color: theme.text,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      opacity: 0.5,
    },
  });
}
