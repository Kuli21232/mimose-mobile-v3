import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';
import { chartTracks } from '../data/mock';
import Pill from '../components/Pill';
import TopNav from '../components/TopNav';
import MiniPlayer from '../components/MiniPlayer';

const FILTERS = ['Все', 'Популярные', 'Новинки', 'Мои'];

function ChartItem({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.chartItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.chartNum}>
        <Text style={styles.chartNumText}>{item.rank}</Text>
      </View>
      <LinearGradient colors={item.artGradient} style={styles.chartArt} />
      <View style={styles.chartInfo}>
        <Text style={styles.chartName} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.chartArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={styles.chartPlays}>{item.plays}</Text>
      <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.text20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ChartsScreen({ navigation }) {
  const [filter, setFilter] = useState('Все');

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <TopNav title="Чарты" onBack={() => navigation.goBack()} />

          {/* Filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {FILTERS.map((f) => (
              <Pill key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
            ))}
          </ScrollView>

          {/* Chart list */}
          <View style={{ marginTop: 8 }}>
            {chartTracks.map((item) => (
              <ChartItem
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('Player')}
              />
            ))}
          </View>

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
  pillsRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 8 },
  chartItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8, paddingHorizontal: 24,
  },
  chartNum: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: colors.text06,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  chartNumText: { fontSize: 11, fontWeight: '700', color: colors.text40 },
  chartArt: { width: 46, height: 46, borderRadius: radius.xs, flexShrink: 0 },
  chartInfo: { flex: 1, minWidth: 0 },
  chartName: { fontSize: 14, fontWeight: '500', color: colors.text },
  chartArtist: { fontSize: 12, color: colors.text30, marginTop: 2 },
  chartPlays: { fontSize: 12, color: colors.text20, flexShrink: 0 },
  moreBtn: {
    width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});
