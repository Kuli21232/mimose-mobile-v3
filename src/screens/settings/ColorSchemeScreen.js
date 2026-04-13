import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';
import useSettingsStore from '../../store/settingsStore';
import {
  accentPresets,
  radius,
  themePresets,
  useAppTheme,
} from '../../theme';
import { useI18n } from '../../i18n';

const TEXT_SIZES = ['small', 'medium', 'large'];

export default function ColorSchemeScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const styles = createStyles(theme);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title={strings.appearance.title} onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.groupTitle}>{strings.appearance.theme}</Text>
          <View style={styles.group}>
            {Object.values(themePresets).map((themeOption) => (
              <TouchableOpacity
                key={themeOption.id}
                style={styles.themeItem}
                onPress={() => updateSettings({ theme: themeOption.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.themePreview, { backgroundColor: themeOption.bg, borderColor: `${themeOption.text}30` }]}>
                  <View style={[styles.themePreviewBar, { backgroundColor: `${accentPresets[settings.accent] || theme.accent}35` }]} />
                  <View style={[styles.themePreviewCircle, { backgroundColor: `${accentPresets[settings.accent] || theme.accent}70` }]} />
                </View>
                <Text style={styles.themeLabel}>{strings.appearance.themes[themeOption.id]}</Text>
                {settings.theme === themeOption.id && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{strings.appearance.accent}</Text>
          <View style={styles.colorGrid}>
            {Object.entries(accentPresets).map(([id, color]) => (
              <TouchableOpacity
                key={id}
                style={[styles.colorOpt, settings.accent === id && styles.colorOptActive]}
                onPress={() => updateSettings({ accent: id })}
              >
                <View style={[styles.colorCircle, { backgroundColor: color }]} />
                {settings.accent === id && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={id === 'white' ? '#000000' : '#ffffff'}
                    style={styles.colorCheck}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{strings.appearance.textSize}</Text>
          <View style={styles.sizeRow}>
            {TEXT_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeBtn, settings.textSize === size && styles.sizeBtnActive]}
                onPress={() => updateSettings({ textSize: size })}
              >
                <Text style={[styles.sizeText, settings.textSize === size && styles.sizeTextActive]}>
                  {strings.appearance.sizes[size]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{strings.appearance.preview}</Text>
          <View style={styles.previewPillRow}>
            <View style={styles.previewPillActive}>
              <Text style={styles.previewPillActiveText}>{strings.common.tracks}</Text>
            </View>
            <View style={styles.previewPill}>
              <Text style={styles.previewPillText}>{strings.common.artists}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    section: { marginHorizontal: 24, marginBottom: 24 },
    groupTitle: {
      fontSize: 10 * theme.scale,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: theme.text20,
      fontWeight: '600',
      paddingBottom: 10,
    },
    group: {
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    themeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.glassBorder,
    },
    themePreview: {
      width: 40,
      height: 30,
      borderRadius: 6,
      borderWidth: 1,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    themePreviewBar: { width: '80%', height: 4, borderRadius: 2, marginBottom: 4 },
    themePreviewCircle: { width: 12, height: 12, borderRadius: 6 },
    themeLabel: { flex: 1, fontSize: 15 * theme.scale, color: theme.text },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorOpt: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    colorOptActive: { borderColor: theme.accent },
    colorCircle: { width: 36, height: 36, borderRadius: 18 },
    colorCheck: { position: 'absolute' },
    sizeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    sizeBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: radius.full,
      backgroundColor: theme.text06,
      borderWidth: 1,
      borderColor: theme.glassBorder,
    },
    sizeBtnActive: { backgroundColor: theme.accent, borderColor: theme.accentBorder },
    sizeText: { color: theme.text40, fontSize: 13 * theme.scale },
    sizeTextActive: { color: theme.onAccent },
    previewCard: {
      marginHorizontal: 24,
      padding: 18,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    previewTitle: { fontSize: 14 * theme.scale, fontWeight: '700', color: theme.text, marginBottom: 12 },
    previewPillRow: { flexDirection: 'row', gap: 8 },
    previewPill: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: radius.full,
      backgroundColor: theme.text06,
      borderWidth: 1,
      borderColor: theme.glassBorder,
    },
    previewPillActive: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    previewPillText: { fontSize: 13 * theme.scale, color: theme.text60 },
    previewPillActiveText: { fontSize: 13 * theme.scale, color: theme.onAccent, fontWeight: '600' },
  });
}
