import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import TopNav from '../../components/TopNav';

const LANGUAGES = [
  { code: 'ru', name: 'Русский', native: 'Русский' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'de', name: 'Немецкий', native: 'Deutsch' },
  { code: 'fr', name: 'Французский', native: 'Français' },
  { code: 'es', name: 'Испанский', native: 'Español' },
  { code: 'zh', name: 'Китайский', native: '中文' },
  { code: 'ja', name: 'Японский', native: '日本語' },
  { code: 'ko', name: 'Корейский', native: '한국어' },
];

export default function LanguageScreen({ navigation }) {
  const [selected, setSelected] = useState('ru');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title="Язык" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.group}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.item}
              onPress={() => setSelected(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{lang.name}</Text>
                <Text style={styles.itemNative}>{lang.native}</Text>
              </View>
              {selected === lang.code && (
                <Ionicons name="checkmark" size={18} color={colors.text} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  group: {
    marginHorizontal: 24, marginTop: 8,
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 18,
    backgroundColor: colors.glass, borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, color: colors.text },
  itemNative: { fontSize: 12, color: colors.text30, marginTop: 2 },
});
