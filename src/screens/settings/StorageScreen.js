import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';
import { clearAppCache, formatBytes, getCacheStats } from '../../utils/cache';
import { radius, useAppTheme } from '../../theme';
import { useI18n } from '../../i18n';

function formatDate(timestamp, language, strings) {
  if (!timestamp) return strings.common.never;
  return new Date(timestamp).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US');
}

function InfoRow({ icon, label, value, theme }) {
  const styles = createStyles(theme);

  return (
    <View style={styles.item}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={18} color={theme.text35} />
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemSize}>{value}</Text>
    </View>
  );
}

export default function StorageScreen({ navigation }) {
  const theme = useAppTheme();
  const { language, strings } = useI18n();
  const [stats, setStats] = useState({
    entries: 0,
    totalBytes: 0,
    oldestSavedAt: null,
    newestSavedAt: null,
  });
  const [clearing, setClearing] = useState(false);
  const styles = createStyles(theme);

  const loadStats = useCallback(async () => {
    const nextStats = await getCacheStats();
    setStats(nextStats);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const fill = Math.min(stats.totalBytes / (5 * 1024 * 1024), 1);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title={strings.storage.title} onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>{strings.storage.cachedPublicData}</Text>
            <Text style={styles.usageVal}>{formatBytes(stats.totalBytes)}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${fill * 100}%` }]} />
          </View>
          <Text style={styles.caption}>{strings.storage.approx}</Text>
        </View>

        <Text style={styles.sectionTitle}>{strings.storage.breakdown}</Text>
        <View style={styles.group}>
          <InfoRow icon="archive-outline" label={strings.storage.entries} value={String(stats.entries)} theme={theme} />
          <InfoRow icon="download-outline" label={strings.storage.totalSize} value={formatBytes(stats.totalBytes)} theme={theme} />
          <InfoRow icon="time-outline" label={strings.storage.newest} value={formatDate(stats.newestSavedAt, language, strings)} theme={theme} />
          <InfoRow icon="hourglass-outline" label={strings.storage.oldest} value={formatDate(stats.oldestSavedAt, language, strings)} theme={theme} />
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={async () => {
              setClearing(true);
              await clearAppCache();
              await loadStats();
              setClearing(false);
            }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.text60} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>{clearing ? strings.storage.clearing : strings.storage.clearCache}</Text>
              <Text style={styles.actionDesc}>{strings.storage.clearDesc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={loadStats}>
            <Ionicons name="refresh-outline" size={18} color={theme.text60} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>{strings.storage.refreshStats}</Text>
              <Text style={styles.actionDesc}>{strings.storage.refreshDesc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.text20} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    usageCard: {
      marginHorizontal: 24,
      marginBottom: 20,
      padding: 20,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    usageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    usageTitle: { fontSize: 16 * theme.scale, fontWeight: '600', color: theme.text },
    usageVal: { fontSize: 13 * theme.scale, color: theme.text40 },
    progressBar: {
      height: 8,
      backgroundColor: theme.text06,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.accent,
      borderRadius: 4,
    },
    caption: { marginTop: 10, color: theme.text30, fontSize: 12 * theme.scale, lineHeight: 18 * theme.scale },
    sectionTitle: {
      fontSize: 10 * theme.scale,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: theme.text20,
      fontWeight: '600',
      paddingHorizontal: 24,
      paddingBottom: 10,
    },
    group: {
      marginHorizontal: 24,
      marginBottom: 20,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.glassBorder,
    },
    itemIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.text06,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    itemLabel: { flex: 1, fontSize: 14 * theme.scale, color: theme.text },
    itemSize: { fontSize: 13 * theme.scale, color: theme.text30 },
    actionsSection: { marginHorizontal: 24 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      marginBottom: 10,
    },
    actionInfo: { flex: 1 },
    actionLabel: { fontSize: 15 * theme.scale, color: theme.text },
    actionDesc: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 2 },
  });
}
