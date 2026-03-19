import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function Pill({ label, active, onPress }) {
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

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    backgroundColor: colors.text06,
    borderWidth: 1,
    borderColor: colors.text06,
    flexShrink: 0,
  },
  pillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text40,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.bg,
  },
});
