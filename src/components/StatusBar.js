import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function AppStatusBar({ transparent = false }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 4, backgroundColor: transparent ? 'transparent' : colors.bg }]}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.right}>
        <Ionicons name="cellular" size={16} color={colors.text50} />
        <Ionicons name="wifi" size={16} color={colors.text50} />
        <Ionicons name="battery-full" size={18} color={colors.text50} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 6,
  },
  time: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    opacity: 0.5,
  },
});
