import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNav from '../../components/TopNav';
import useSettingsStore from '../../store/settingsStore';
import { radius, useAppTheme } from '../../theme';
import { useI18n } from '../../i18n';

function ToggleItem({ label, desc, value, onToggle, theme }) {
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.item} onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.itemText}>
        <Text style={styles.itemLabel}>{label}</Text>
        {desc ? <Text style={styles.itemDesc}>{desc}</Text> : null}
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

export default function PrivacyScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const privacy = useSettingsStore((state) => state.settings.privacy);
  const updatePrivacy = useSettingsStore((state) => state.updatePrivacy);
  const styles = createStyles(theme);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title={strings.privacy.title} onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.groupTitle}>{strings.privacy.profile}</Text>
          <View style={styles.group}>
            <ToggleItem
              label={strings.privacy.publicProfile}
              desc={strings.privacy.publicProfileDesc}
              value={privacy.publicProfile}
              onToggle={() => updatePrivacy('publicProfile', !privacy.publicProfile)}
              theme={theme}
            />
            <ToggleItem
              label={strings.privacy.listening}
              desc={strings.privacy.listeningDesc}
              value={privacy.showListening}
              onToggle={() => updatePrivacy('showListening', !privacy.showListening)}
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{strings.privacy.data}</Text>
          <View style={styles.group}>
            <ToggleItem
              label={strings.privacy.stats}
              desc={strings.privacy.statsDesc}
              value={privacy.shareStats}
              onToggle={() => updatePrivacy('shareStats', !privacy.shareStats)}
              theme={theme}
            />
            <ToggleItem
              label={strings.privacy.recommend}
              value={privacy.allowRecommend}
              onToggle={() => updatePrivacy('allowRecommend', !privacy.allowRecommend)}
              theme={theme}
            />
            <ToggleItem
              label={strings.privacy.analytics}
              value={privacy.trackingOff}
              onToggle={() => updatePrivacy('trackingOff', !privacy.trackingOff)}
              theme={theme}
            />
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 15,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.glassBorder,
    },
    itemText: { flex: 1 },
    itemLabel: { fontSize: 15 * theme.scale, color: theme.text },
    itemDesc: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 2 },
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
