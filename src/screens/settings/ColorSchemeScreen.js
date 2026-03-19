import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import TopNav from '../../components/TopNav';

const THEMES = [
  { id: 'dark', label: 'Тёмная', bg: '#050505', accent: '#ffffff' },
  { id: 'amoled', label: 'AMOLED', bg: '#000000', accent: '#ffffff' },
  { id: 'midnight', label: 'Полночь', bg: '#0a0a14', accent: '#8080ff' },
  { id: 'forest', label: 'Лес', bg: '#080e0a', accent: '#50c878' },
  { id: 'sunset', label: 'Закат', bg: '#0e0808', accent: '#ff7060' },
];

const ACCENT_COLORS = [
  { id: 'white', color: '#ffffff' },
  { id: 'blue', color: '#4080ff' },
  { id: 'purple', color: '#8060cc' },
  { id: 'green', color: '#50c878' },
  { id: 'orange', color: '#ff8040' },
  { id: 'red', color: '#ff4060' },
  { id: 'pink', color: '#ff60a0' },
  { id: 'teal', color: '#40c0c0' },
];

export default function ColorSchemeScreen({ navigation }) {
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedAccent, setSelectedAccent] = useState('white');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title="Цветовая схема" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Themes */}
        <View style={styles.section}>
          <Text style={styles.groupTitle}>ТЕМА</Text>
          <View style={styles.group}>
            {THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={styles.themeItem}
                onPress={() => setSelectedTheme(theme.id)}
                activeOpacity={0.7}
              >
                {/* Preview */}
                <View style={[styles.themePreview, { backgroundColor: theme.bg, borderColor: theme.accent + '30' }]}>
                  <View style={[styles.themePreviewBar, { backgroundColor: theme.accent + '20' }]} />
                  <View style={[styles.themePreviewCircle, { backgroundColor: theme.accent + '40' }]} />
                </View>
                <Text style={styles.themeLabel}>{theme.label}</Text>
                {selectedTheme === theme.id && (
                  <><View style={{ flex: 1 }} /><Ionicons name="checkmark-circle" size={20} color={colors.text} /></>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accent colors */}
        <View style={styles.section}>
          <Text style={styles.groupTitle}>АКЦЕНТНЫЙ ЦВЕТ</Text>
          <View style={styles.colorGrid}>
            {ACCENT_COLORS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.colorOpt, selectedAccent === item.id && styles.colorOptActive]}
                onPress={() => setSelectedAccent(item.id)}
              >
                <View style={[styles.colorCircle, { backgroundColor: item.color }]} />
                {selectedAccent === item.id && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={item.id === 'white' ? '#000' : '#fff'}
                    style={styles.colorCheck}
                  />
                )}
              </TouchableOpacity>
            ))}
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
  themeItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 18,
    backgroundColor: colors.glass, borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
  },
  themePreview: {
    width: 40, height: 30, borderRadius: 6,
    borderWidth: 1, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  themePreviewBar: { width: '80%', height: 4, borderRadius: 2, marginBottom: 4 },
  themePreviewCircle: { width: 12, height: 12, borderRadius: 6 },
  themeLabel: { flex: 1, fontSize: 15, color: colors.text },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOpt: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  colorOptActive: { borderColor: colors.text },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorCheck: { position: 'absolute' },
});
