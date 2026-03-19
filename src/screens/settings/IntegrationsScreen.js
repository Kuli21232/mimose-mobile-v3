import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import TopNav from '../../components/TopNav';

const INTEGRATIONS = [
  {
    id: 'lastfm',
    name: 'Last.fm',
    desc: 'Скробблинг треков',
    icon: 'radio-outline',
    connected: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    desc: 'Показывать активность',
    icon: 'logo-discord',
    connected: true,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    desc: 'Импорт плейлистов',
    icon: 'musical-note-outline',
    connected: false,
  },
  {
    id: 'applemusic',
    name: 'Apple Music',
    desc: 'Синхронизация библиотеки',
    icon: 'logo-apple',
    connected: false,
  },
  {
    id: 'vk',
    name: 'ВКонтакте',
    desc: 'Импорт музыки',
    icon: 'logo-vk',
    connected: false,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    desc: 'Поделиться треком',
    icon: 'paper-plane-outline',
    connected: false,
  },
];

export default function IntegrationsScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title="Интеграции" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>ПОДКЛЮЧЁННЫЕ</Text>
        <View style={styles.list}>
          {INTEGRATIONS.filter((i) => i.connected).map((item) => (
            <IntegrationItem key={item.id} item={item} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>ДОСТУПНЫЕ</Text>
        <View style={styles.list}>
          {INTEGRATIONS.filter((i) => !i.connected).map((item) => (
            <IntegrationItem key={item.id} item={item} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function IntegrationItem({ item }) {
  return (
    <View style={styles.item}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={20} color={colors.text50} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc}>{item.desc}</Text>
      </View>
      <TouchableOpacity
        style={[styles.statusBadge, item.connected ? styles.connectedBadge : styles.disconnectedBadge]}
      >
        <Text style={[styles.statusText, item.connected ? styles.connectedText : styles.disconnectedText]}>
          {item.connected ? 'Подключено' : 'Подключить'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
    color: colors.text20, fontWeight: '600',
    paddingHorizontal: 24, paddingBottom: 10, paddingTop: 4,
  },
  list: { marginHorizontal: 24, marginBottom: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: colors.glass, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.text06,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  desc: { fontSize: 12, color: colors.text20, marginTop: 1 },
  statusBadge: {
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 10, flexShrink: 0,
  },
  connectedBadge: { backgroundColor: colors.successBg },
  disconnectedBadge: { backgroundColor: colors.text06 },
  statusText: { fontSize: 11, fontWeight: '500' },
  connectedText: { color: colors.success },
  disconnectedText: { color: colors.text20 },
});
