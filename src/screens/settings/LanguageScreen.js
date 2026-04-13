import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';
import useSettingsStore from '../../store/settingsStore';
import { radius, useAppTheme } from '../../theme';
import { useI18n } from '../../i18n';

export default function LanguageScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const language = useSettingsStore((state) => state.settings.language);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const styles = createStyles(theme);

  const languages = Object.entries(strings.language.options).map(([code, value]) => ({
    code,
    ...value,
  }));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title={strings.language.title} onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.group}>
          {languages.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={styles.item}
              onPress={() => updateSettings({ language: item.code })}
              activeOpacity={0.7}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemNative}>{item.native}</Text>
              </View>
              {language === item.code && <Ionicons name="checkmark" size={18} color={theme.accent} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    group: {
      marginHorizontal: 24,
      marginTop: 8,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.glassBorder,
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15 * theme.scale, color: theme.text },
    itemNative: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 2 },
  });
}
