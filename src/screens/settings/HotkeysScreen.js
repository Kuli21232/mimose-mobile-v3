import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNav from '../../components/TopNav';
import useSettingsStore from '../../store/settingsStore';
import { radius, useAppTheme } from '../../theme';
import { useI18n } from '../../i18n';

export default function HotkeysScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const enabled = useSettingsStore((state) => state.settings.hotkeys.enabled);
  const updateHotkeys = useSettingsStore((state) => state.updateHotkeys);
  const styles = createStyles(theme);

  const hotkeys = [
    { label: strings.hotkeys.items.playPause, keys: ['Space'] },
    { label: strings.hotkeys.items.nextTrack, keys: ['Right'] },
    { label: strings.hotkeys.items.prevTrack, keys: ['Left'] },
    { label: strings.hotkeys.items.volUp, keys: ['Up'] },
    { label: strings.hotkeys.items.volDown, keys: ['Down'] },
    { label: strings.hotkeys.items.like, keys: ['L'] },
    { label: strings.hotkeys.items.shuffle, keys: ['S'] },
    { label: strings.hotkeys.items.repeat, keys: ['R'] },
    { label: strings.hotkeys.items.queue, keys: ['Q'] },
    { label: strings.hotkeys.items.lyrics, keys: ['T'] },
    { label: strings.hotkeys.items.search, keys: ['Ctrl', 'F'] },
    { label: strings.hotkeys.items.settings, keys: ['Ctrl', ','] },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title={strings.hotkeys.title} onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{strings.hotkeys.heroTitle}</Text>
          <Text style={styles.heroText}>
            {strings.hotkeys.heroText}
          </Text>
          <TouchableOpacity
            style={[styles.toggleBtn, enabled && styles.toggleBtnActive]}
            onPress={() => updateHotkeys('enabled', !enabled)}
          >
            <Text style={[styles.toggleBtnText, enabled && styles.toggleBtnTextActive]}>
              {enabled ? strings.hotkeys.enabled : strings.hotkeys.disabled}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {hotkeys.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.item}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <View style={styles.keysRow}>
                {item.keys.map((key) => (
                  <View key={key} style={styles.keyBadge}>
                    <Text style={styles.keyText}>{key}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    hero: {
      marginHorizontal: 24,
      marginBottom: 16,
      padding: 18,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    heroTitle: { fontSize: 16 * theme.scale, fontWeight: '700', color: theme.text },
    heroText: { marginTop: 6, fontSize: 13 * theme.scale, color: theme.text30, lineHeight: 20 * theme.scale },
    toggleBtn: {
      marginTop: 14,
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: radius.full,
      backgroundColor: theme.text06,
      borderWidth: 1,
      borderColor: theme.glassBorder,
    },
    toggleBtnActive: { backgroundColor: theme.accent },
    toggleBtnText: { fontSize: 13 * theme.scale, color: theme.text60 },
    toggleBtnTextActive: { color: theme.onAccent },
    list: { paddingHorizontal: 24, gap: 8 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: theme.glass,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    itemLabel: { fontSize: 14 * theme.scale, color: theme.text60, flex: 1 },
    keysRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
    keyBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: theme.text08,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.text06,
    },
    keyText: { fontSize: 12 * theme.scale, color: theme.text40, fontWeight: '500', letterSpacing: 0.3 },
  });
}
