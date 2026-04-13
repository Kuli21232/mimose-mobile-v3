import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MiniPlayer from '../components/MiniPlayer';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

function SettingItem({ icon, label, value, arrow = true, onPress, toggle, toggleOn, theme }) {
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={theme.text35} style={{ flexShrink: 0 }} />
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {toggle && (
        <View style={[styles.toggle, toggleOn && styles.toggleOn]}>
          <View style={[styles.toggleKnob, toggleOn && styles.toggleKnobOn]} />
        </View>
      )}
      {arrow && !toggle && <Ionicons name="chevron-forward" size={16} color={theme.text20} />}
    </TouchableOpacity>
  );
}

function SettingsGroup({ title, children, theme }) {
  const styles = createStyles(theme);

  return (
    <View style={styles.group}>
      {title && <Text style={styles.groupTitle}>{title}</Text>}
      <View style={styles.groupItems}>{children}</View>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const theme = useAppTheme();
  const { language, strings } = useI18n();
  const { user, isAuthenticated, logout } = useAuthStore();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const styles = createStyles(theme);
  const activeIntegrations = Number(Boolean(settings.integrations.lastfm.connected))
    + Number(Boolean(settings.integrations.yandexMusic?.connected && settings.integrations.yandexMusic?.token));
  const integrationsValue = activeIntegrations > 0
    ? activeIntegrations === 1
      ? strings.settings.values.activeOne
      : `${activeIntegrations} ${language === 'ru' ? 'активно' : 'active'}`
    : strings.settings.values.activeNone;

  const profileName = user?.handle || user?.name || strings.settings.guest;
  const profileMeta = isAuthenticated
    ? `${user?.email || '@account'} · ${strings.settings.connectedMeta}`
    : strings.settings.guestMeta;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={styles.pageTitle}>
            <Text style={styles.title}>{strings.settings.title}</Text>
          </View>

          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.7}
            onPress={() => {
              if (!isAuthenticated) navigation.navigate('Login');
              else navigation.navigate('Profile');
            }}
          >
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={24} color={theme.accent} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileName}</Text>
              <Text style={styles.profileHandle}>{profileMeta}</Text>
            </View>
            {!isAuthenticated && <Ionicons name="chevron-forward" size={18} color={theme.text20} />}
          </TouchableOpacity>

          <View style={styles.statusCard}>
            <View style={styles.statusBadge}>
              <Ionicons name="flash-outline" size={12} color={theme.accentMuted} />
              <Text style={styles.statusBadgeText}>{strings.settings.liveBadge}</Text>
            </View>
            <Text style={styles.statusText}>
              {strings.settings.liveText}
            </Text>
          </View>

          <SettingsGroup title={strings.settings.groups.general} theme={theme}>
            <SettingItem
              icon="language-outline"
              label={strings.settings.items.language}
              value={strings.settings.values.languages[settings.language] || settings.language}
              onPress={() => navigation.navigate('Language')}
              theme={theme}
            />
            <SettingItem
              icon="lock-closed-outline"
              label={strings.settings.items.privacy}
              value={settings.privacy.publicProfile ? strings.settings.values.public : strings.settings.values.private}
              onPress={() => navigation.navigate('Privacy')}
              theme={theme}
            />
            <SettingItem
              icon="musical-notes-outline"
              label={strings.settings.items.playback}
              value={strings.settings.values.quality[settings.playback.quality] || settings.playback.quality}
              onPress={() => navigation.navigate('Playback')}
              theme={theme}
            />
          </SettingsGroup>

          <SettingsGroup title={strings.settings.groups.appearance} theme={theme}>
            <SettingItem
              icon="color-palette-outline"
              label={strings.settings.items.theme}
              value={strings.settings.values.themes[settings.theme] || settings.theme}
              onPress={() => navigation.navigate('ColorScheme')}
              theme={theme}
            />
            <SettingItem
              icon="text-outline"
              label={strings.settings.items.textSize}
              value={strings.settings.values.textSize[settings.textSize] || settings.textSize}
              onPress={() => navigation.navigate('ColorScheme')}
              theme={theme}
            />
          </SettingsGroup>

          <SettingsGroup title={strings.settings.groups.connections} theme={theme}>
            <SettingItem
              icon="radio-outline"
              label={strings.settings.items.integrations}
              value={integrationsValue}
              onPress={() => navigation.navigate('Integrations')}
              theme={theme}
            />
            <SettingItem
              icon="cloud-outline"
              label={strings.settings.items.storage}
              onPress={() => navigation.navigate('Storage')}
              theme={theme}
            />
            <SettingItem
              icon="keypad-outline"
              label={strings.settings.items.hotkeys}
              onPress={() => navigation.navigate('Hotkeys')}
              theme={theme}
            />
          </SettingsGroup>

          <SettingsGroup title={strings.settings.groups.other} theme={theme}>
            <SettingItem
              icon="notifications-outline"
              label={strings.settings.items.notifications}
              toggle
              toggleOn={settings.notificationsEnabled}
              arrow={false}
              onPress={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              theme={theme}
            />
            <SettingItem icon="information-circle-outline" label={strings.settings.items.about} value={strings.settings.values.version} onPress={() => {}} theme={theme} />
            <SettingItem
              icon={isAuthenticated ? 'exit-outline' : 'log-in-outline'}
              label={isAuthenticated ? strings.settings.items.signOut : strings.settings.items.signIn}
              arrow={false}
              onPress={() => {
                if (isAuthenticated) logout();
                else navigation.navigate('Login');
              }}
              theme={theme}
            />
          </SettingsGroup>

          <View style={{ height: 160 }} />
        </SafeAreaView>
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    scroll: { flex: 1 },
    pageTitle: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 14 },
    title: { fontSize: 30 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.8 },
    profileCard: {
      marginHorizontal: 24,
      marginBottom: 8,
      padding: 20,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    profileAvatar: {
      width: 50,
      height: 50,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 17 * theme.scale, fontWeight: '700', color: theme.text, letterSpacing: -0.3 },
    profileHandle: { fontSize: 13 * theme.scale, color: theme.text30, marginTop: 1 },
    statusCard: {
      marginHorizontal: 24,
      marginBottom: 20,
      padding: 18,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 12,
      backgroundColor: theme.accentSoft,
      borderRadius: radius.xs,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    statusBadgeText: { fontSize: 11 * theme.scale, fontWeight: '700', color: theme.accentMuted, letterSpacing: 0.5 },
    statusText: { fontSize: 13 * theme.scale, color: theme.text40, lineHeight: 20 * theme.scale },
    group: { marginHorizontal: 24, marginBottom: 24 },
    groupTitle: {
      fontSize: 10 * theme.scale,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: theme.text20,
      fontWeight: '600',
      paddingBottom: 10,
    },
    groupItems: {
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 15,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.glassBorder,
    },
    settingLabel: { flex: 1, fontSize: 15 * theme.scale, color: theme.text },
    settingValue: { fontSize: 13 * theme.scale, color: theme.text30, textTransform: 'capitalize' },
    toggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.text12,
      position: 'relative',
    },
    toggleOn: { backgroundColor: theme.accent },
    toggleKnob: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.bg,
    },
    toggleKnobOn: { left: 21 },
  });
}
