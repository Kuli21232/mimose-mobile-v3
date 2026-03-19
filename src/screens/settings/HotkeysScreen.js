import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme';
import TopNav from '../../components/TopNav';

const HOTKEYS = [
  { label: 'Пауза / Воспроизведение', keys: ['Space'] },
  { label: 'Следующий трек', keys: ['→'] },
  { label: 'Предыдущий трек', keys: ['←'] },
  { label: 'Увеличить громкость', keys: ['↑'] },
  { label: 'Уменьшить громкость', keys: ['↓'] },
  { label: 'Лайк трека', keys: ['L'] },
  { label: 'Перемешать', keys: ['S'] },
  { label: 'Повтор', keys: ['R'] },
  { label: 'Открыть очередь', keys: ['Q'] },
  { label: 'Открыть текст', keys: ['T'] },
  { label: 'Поиск', keys: ['Ctrl', 'F'] },
  { label: 'Настройки', keys: ['Ctrl', ','] },
];

export default function HotkeysScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title="Горячие клавиши" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.desc}>
          Используйте клавиатуру для быстрого управления плеером
        </Text>
        <View style={styles.list}>
          {HOTKEYS.map((hk, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemLabel}>{hk.label}</Text>
              <View style={styles.keysRow}>
                {hk.keys.map((key, ki) => (
                  <View key={ki} style={styles.keyBadge}>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  desc: {
    paddingHorizontal: 24, paddingBottom: 16,
    fontSize: 13, color: colors.text30, lineHeight: 20,
  },
  list: { paddingHorizontal: 24, gap: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
    backgroundColor: colors.glass,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.glassBorder,
  },
  itemLabel: { fontSize: 14, color: colors.text60, flex: 1 },
  keysRow: { flexDirection: 'row', gap: 4 },
  keyBadge: {
    paddingVertical: 4, paddingHorizontal: 10,
    backgroundColor: colors.text08,
    borderRadius: 6, borderWidth: 1, borderColor: colors.text06,
  },
  keyText: { fontSize: 12, color: colors.text40, fontWeight: '500', letterSpacing: 0.3 },
});
