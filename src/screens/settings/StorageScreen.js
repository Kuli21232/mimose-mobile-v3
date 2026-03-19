import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import TopNav from '../../components/TopNav';

const STORAGE_ITEMS = [
  { id: 'cache', label: 'Кэш треков', size: '1.2 ГБ', icon: 'musical-notes-outline' },
  { id: 'downloaded', label: 'Загруженные треки', size: '3.8 ГБ', icon: 'cloud-download-outline' },
  { id: 'images', label: 'Обложки альбомов', size: '248 МБ', icon: 'image-outline' },
  { id: 'other', label: 'Прочее', size: '87 МБ', icon: 'folder-outline' },
];

const TOTAL = 5.3;
const USED = 3.8;
const FILL = USED / TOTAL;

export default function StorageScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title="Хранилище" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Usage card */}
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>Использование</Text>
            <Text style={styles.usageVal}>{USED} ГБ из {TOTAL} ГБ</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${FILL * 100}%` }]} />
          </View>
        </View>

        {/* Storage breakdown */}
        <Text style={styles.sectionTitle}>РАЗБИВКА</Text>
        <View style={styles.group}>
          {STORAGE_ITEMS.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemIcon}>
                <Ionicons name={item.icon} size={18} color={colors.text35} />
              </View>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemSize}>{item.size}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.text60} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Очистить кэш</Text>
              <Text style={styles.actionDesc}>Освободит ~1.2 ГБ</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="download-outline" size={18} color={colors.text60} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Управление загрузками</Text>
              <Text style={styles.actionDesc}>48 треков</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text20} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  usageCard: {
    marginHorizontal: 24, marginBottom: 20,
    padding: 20, backgroundColor: colors.glass,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder,
  },
  usageHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  usageTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  usageVal: { fontSize: 13, color: colors.text40 },
  progressBar: {
    height: 8, backgroundColor: colors.text06,
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: colors.text40, borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
    color: colors.text20, fontWeight: '600',
    paddingHorizontal: 24, paddingBottom: 10,
  },
  group: {
    marginHorizontal: 24, marginBottom: 20,
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 18,
    backgroundColor: colors.glass, borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
  },
  itemIcon: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.text06,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemLabel: { flex: 1, fontSize: 14, color: colors.text },
  itemSize: { fontSize: 13, color: colors.text30 },
  actionsSection: { marginHorizontal: 24 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 18,
    backgroundColor: colors.glass,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder,
    marginBottom: 10,
  },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 15, color: colors.text },
  actionDesc: { fontSize: 12, color: colors.text30, marginTop: 2 },
});
