import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import MiniPlayer from '../components/MiniPlayer';

function SettingItem({ icon, label, value, arrow = true, onPress, toggle, toggleOn }) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={colors.text35} style={{ flexShrink: 0 }} />
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {toggle && (
        <View style={[styles.toggle, toggleOn && styles.toggleOn]}>
          <View style={[styles.toggleKnob, toggleOn && styles.toggleKnobOn]} />
        </View>
      )}
      {arrow && !toggle && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <View style={styles.group}>
      {title && <Text style={styles.groupTitle}>{title}</Text>}
      <View style={styles.groupItems}>{children}</View>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Page Title */}
          <View style={styles.pageTitle}>
            <Text style={styles.title}>Настройки</Text>
          </View>

          {/* Profile card */}
          <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={24} color={colors.text35} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Максим</Text>
              <Text style={styles.profileHandle}>@maxim · Бесплатный план</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text20} />
          </TouchableOpacity>

          {/* Premium card */}
          <View style={styles.premiumCard}>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color={colors.text60} />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
            <Text style={styles.premiumStatus}>Откройте всё без ограничений</Text>
            <View style={styles.premiumInactive}>
              <Ionicons name="close-circle" size={12} color={colors.error} />
              <Text style={[styles.premiumInactiveText, { color: colors.error }]}>Неактивно</Text>
            </View>
          </View>

          {/* Main settings */}
          <SettingsGroup title="Основное">
            <SettingItem icon="language-outline" label="Язык" value="Русский" onPress={() => navigation.navigate('Language')} />
            <SettingItem icon="lock-closed-outline" label="Конфиденциальность" onPress={() => navigation.navigate('Privacy')} />
            <SettingItem icon="musical-notes-outline" label="Воспроизведение" onPress={() => navigation.navigate('Playback')} />
          </SettingsGroup>

          <SettingsGroup title="Внешний вид">
            <SettingItem icon="color-palette-outline" label="Цветовая схема" value="Тёмная" onPress={() => navigation.navigate('ColorScheme')} />
            <SettingItem icon="text-outline" label="Размер шрифта" value="Средний" onPress={() => {}} />
          </SettingsGroup>

          <SettingsGroup title="Интеграции">
            <SettingItem icon="logo-github" label="Интеграции" onPress={() => navigation.navigate('Integrations')} />
            <SettingItem icon="cloud-outline" label="Хранилище" onPress={() => navigation.navigate('Storage')} />
            <SettingItem icon="keypad-outline" label="Горячие клавиши" onPress={() => navigation.navigate('Hotkeys')} />
          </SettingsGroup>

          <SettingsGroup title="Прочее">
            <SettingItem icon="notifications-outline" label="Уведомления" toggle toggleOn={true} onPress={() => {}} arrow={false} />
            <SettingItem icon="information-circle-outline" label="О приложении" value="v1.0.0" onPress={() => {}} />
            <SettingItem icon="exit-outline" label="Выйти" arrow={false} onPress={() => {}} />
          </SettingsGroup>

          <View style={{ height: 160 }} />
        </SafeAreaView>
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  pageTitle: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 14 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  profileCard: {
    marginHorizontal: 24, marginBottom: 8,
    padding: 20, backgroundColor: colors.glass,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  profileAvatar: {
    width: 50, height: 50, borderRadius: radius.full,
    backgroundColor: colors.text06,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  profileHandle: { fontSize: 13, color: colors.text30, marginTop: 1 },
  premiumCard: {
    marginHorizontal: 24, marginBottom: 20,
    padding: 18, backgroundColor: colors.glass,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder,
  },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5, paddingHorizontal: 12,
    backgroundColor: colors.text06, borderRadius: radius.xs,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  premiumBadgeText: { fontSize: 11, fontWeight: '700', color: colors.text60, letterSpacing: 0.5 },
  premiumStatus: { fontSize: 13, color: colors.text20 },
  premiumInactive: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    position: 'absolute', right: 18, top: 18,
  },
  premiumInactiveText: { fontSize: 11, fontWeight: '500' },
  group: { marginHorizontal: 24, marginBottom: 24 },
  groupTitle: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
    color: colors.text20, fontWeight: '600', paddingBottom: 10,
  },
  groupItems: {
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 15, paddingHorizontal: 18,
    backgroundColor: colors.glass, borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
  },
  settingLabel: { flex: 1, fontSize: 15, color: colors.text },
  settingValue: { fontSize: 13, color: colors.text30 },
  arrow: { fontSize: 18, color: colors.text20 },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: colors.text12, position: 'relative',
  },
  toggleOn: { backgroundColor: colors.text },
  toggleKnob: {
    position: 'absolute', top: 3, left: 3,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.bg,
  },
  toggleKnobOn: { left: 21 },
});
