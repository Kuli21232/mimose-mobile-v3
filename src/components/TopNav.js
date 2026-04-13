import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, useAppTheme } from '../theme';

export default function TopNav({ title, onBack, rightIcon, onRight }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={18} color={theme.text60} />
      </TouchableOpacity>
      {title && <Text style={styles.title}>{title}</Text>}
      {rightIcon ? (
        <TouchableOpacity style={styles.actionBtn} onPress={onRight}>
          <Ionicons name={rightIcon} size={18} color={theme.text60} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 38 }} />
      )}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      gap: 14,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    title: {
      flex: 1,
      fontSize: 17 * theme.scale,
      fontWeight: '600',
      color: theme.text,
      letterSpacing: -0.3,
    },
    actionBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  });
}
