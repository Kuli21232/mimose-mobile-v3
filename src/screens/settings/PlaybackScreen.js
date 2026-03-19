import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import TopNav from '../../components/TopNav';

function SelectItem({ label, value, options, onSelect }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optBtn, value === opt && styles.optBtnActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.optText, value === opt && styles.optTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ToggleItem({ label, value, onToggle }) {
  return (
    <TouchableOpacity style={styles.toggleItem} onPress={onToggle} activeOpacity={0.8}>
      <Text style={styles.itemLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

export default function PlaybackScreen({ navigation }) {
  const [quality, setQuality] = useState('Высокое');
  const [crossfade, setCrossfade] = useState('3с');
  const [normalize, setNormalize] = useState(true);
  const [gapless, setGapless] = useState(true);
  const [autoplay, setAutoplay] = useState(false);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title="Воспроизведение" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>КАЧЕСТВО ЗВУКА</Text>
          <View style={styles.group}>
            <SelectItem
              label="Качество потока"
              value={quality}
              options={['Низкое', 'Среднее', 'Высокое', 'Без потерь']}
              onSelect={setQuality}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>ПЕРЕХОДЫ</Text>
          <View style={styles.group}>
            <SelectItem
              label="Кроссфейд"
              value={crossfade}
              options={['Нет', '1с', '3с', '5с', '10с']}
              onSelect={setCrossfade}
            />
            <ToggleItem label="Воспроизведение без пауз" value={gapless} onToggle={() => setGapless(!gapless)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>ПРОЧЕЕ</Text>
          <View style={styles.group}>
            <ToggleItem label="Нормализация громкости" value={normalize} onToggle={() => setNormalize(!normalize)} />
            <ToggleItem label="Автовоспроизведение" value={autoplay} onToggle={() => setAutoplay(!autoplay)} />
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
    paddingVertical: 16, paddingHorizontal: 18,
    backgroundColor: colors.glass, borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
  },
  toggleItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, paddingHorizontal: 18,
    backgroundColor: colors.glass, borderBottomWidth: 0.5,
    borderBottomColor: colors.glassBorder,
  },
  itemLabel: { fontSize: 15, color: colors.text, marginBottom: 12 },
  optionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optBtn: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: radius.full, backgroundColor: colors.text06,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  optBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  optText: { fontSize: 13, color: colors.text40, fontWeight: '500' },
  optTextActive: { color: colors.bg },
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
