import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNav from '../../components/TopNav';
import useSettingsStore from '../../store/settingsStore';
import { radius, useAppTheme } from '../../theme';
import { useI18n } from '../../i18n';

function SelectItem({ label, value, options, onSelect, theme }) {
  const styles = createStyles(theme);

  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optBtn, value === opt.value && styles.optBtnActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.optText, value === opt.value && styles.optTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ToggleItem({ label, value, onToggle, theme }) {
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.toggleItem} onPress={onToggle} activeOpacity={0.8}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

export default function PlaybackScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const playback = useSettingsStore((state) => state.settings.playback);
  const updatePlayback = useSettingsStore((state) => state.updatePlayback);
  const styles = createStyles(theme);

  const qualityOptions = [
    { value: 'low', label: strings.playback.options.low },
    { value: 'medium', label: strings.playback.options.medium },
    { value: 'high', label: strings.playback.options.high },
    { value: 'lossless', label: strings.playback.options.lossless },
  ];

  const crossfadeOptions = [
    { value: 'off', label: strings.playback.options.off },
    { value: '1s', label: '1s' },
    { value: '3s', label: '3s' },
    { value: '5s', label: '5s' },
    { value: '10s', label: '10s' },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title={strings.playback.title} onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.groupTitle}>{strings.playback.audioQuality}</Text>
          <View style={styles.group}>
            <SelectItem
              label={strings.playback.streamingQuality}
              value={playback.quality}
              options={qualityOptions}
              onSelect={(value) => updatePlayback('quality', value)}
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{strings.playback.transitions}</Text>
          <View style={styles.group}>
            <SelectItem
              label={strings.playback.crossfade}
              value={playback.crossfade}
              options={crossfadeOptions}
              onSelect={(value) => updatePlayback('crossfade', value)}
              theme={theme}
            />
            <ToggleItem label={strings.playback.gapless} value={playback.gapless} onToggle={() => updatePlayback('gapless', !playback.gapless)} theme={theme} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{strings.playback.other}</Text>
          <View style={styles.group}>
            <ToggleItem label={strings.playback.normalize} value={playback.normalize} onToggle={() => updatePlayback('normalize', !playback.normalize)} theme={theme} />
            <ToggleItem label={strings.playback.autoplay} value={playback.autoplay} onToggle={() => updatePlayback('autoplay', !playback.autoplay)} theme={theme} />
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
    item: {
      paddingVertical: 16,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.glassBorder,
    },
    toggleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.glassBorder,
    },
    itemLabel: { fontSize: 15 * theme.scale, color: theme.text, marginBottom: 12 },
    toggleLabel: { fontSize: 15 * theme.scale, color: theme.text },
    optionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    optBtn: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: radius.full,
      backgroundColor: theme.text06,
      borderWidth: 1,
      borderColor: theme.glassBorder,
    },
    optBtnActive: { backgroundColor: theme.accent, borderColor: theme.accentBorder },
    optText: { fontSize: 13 * theme.scale, color: theme.text40, fontWeight: '500' },
    optTextActive: { color: theme.onAccent },
    toggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.text12,
      flexShrink: 0,
    },
    toggleOn: { backgroundColor: theme.accent },
    knob: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.bg,
    },
    knobOn: { left: 21 },
  });
}
