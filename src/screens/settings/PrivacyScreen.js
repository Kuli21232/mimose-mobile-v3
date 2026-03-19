import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme';
import TopNav from '../../components/TopNav';

function ToggleItem({ label, desc, value, onToggle }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.itemText}>
        <Text style={styles.itemLabel}>{label}</Text>
        {desc && <Text style={styles.itemDesc}>{desc}</Text>}
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

function GroupTitle({ title }) {
  return <Text style={styles.groupTitle}>{title}</Text>;
}

export default function PrivacyScreen({ navigation }) {
  const [state, setState] = useState({
    publicProfile: true,
    showListening: false,
    shareStats: true,
    allowRecommend: true,
    notifications: true,
    trackingOff: false,
  });

  const toggle = (key) => setState((s) => ({ ...s, [key]: !s[key] }));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title="Конфиденциальность" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <GroupTitle title="ПРОФИЛЬ" />
          <View style={styles.group}>
            <ToggleItem label="Публичный профиль" desc="Другие пользователи могут найти вас" value={state.publicProfile} onToggle={() => toggle('publicProfile')} />
            <ToggleItem label="Показывать что слушаю" desc="Друзья увидят ваши треки" value={state.showListening} onToggle={() => toggle('showListening')} />
          </View>
        </View>

        <View style={styles.section}>
          <GroupTitle title="ДАННЫЕ" />
          <View style={styles.group}>
            <ToggleItem label="Делиться статистикой" desc="Для улучшения рекомендаций" value={state.shareStats} onToggle={() => toggle('shareStats')} />
            <ToggleItem label="Персональные рекомендации" value={state.allowRecommend} onToggle={() => toggle('allowRecommend')} />
            <ToggleItem label="Отключить аналитику" value={state.trackingOff} onToggle={() => toggle('trackingOff')} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  section: { marginHorizontal: 24, marginBottom: 24 },
  groupTitle: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
    color: colors.text20, fontWeight: '600', paddingBottom: 10,
  },
  group: {
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 15, paddingHorizontal: 18,
    backgroundColor: colors.glass, borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
  },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 15, color: colors.text },
  itemDesc: { fontSize: 12, color: colors.text30, marginTop: 2 },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: colors.text12, flexShrink: 0,
  },
  toggleOn: { backgroundColor: colors.text },
  knob: {
    position: 'absolute', top: 3, left: 3,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.bg,
  },
  knobOn: { left: 21 },
});
