import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';
import { rooms, tracks, artists } from '../data/mock';
import SectionHeader from '../components/SectionHeader';
import MiniPlayer from '../components/MiniPlayer';

const WAVE_HEIGHTS = [20, 32, 18, 40, 24, 28, 16, 36, 22, 30, 14, 38];

function RoomCard({ room, onPress }) {
  return (
    <TouchableOpacity style={styles.roomCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.roomHeader}>
        <LinearGradient colors={room.hostGradient} style={styles.roomHostAv} />
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomListeners}>
            <Ionicons name="headset-outline" size={12} color={colors.text30} /> {room.listeners} слушателей
          </Text>
        </View>
        <TouchableOpacity style={styles.joinBtn}>
          <Text style={styles.joinBtnText}>Войти</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.roomTrack} numberOfLines={1}>{room.currentTrack}</Text>
      {/* Wave animation decoration */}
      <View style={styles.roomWave}>
        {WAVE_HEIGHTS.map((h, i) => (
          <View key={i} style={[styles.roomWaveBar, { height: h }]} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

function FriendItem({ name, track, gradients }) {
  return (
    <View style={styles.friendItem}>
      <LinearGradient colors={gradients} style={styles.friendAv} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{name}</Text>
        <Text style={styles.friendTrack} numberOfLines={1}>{track}</Text>
      </View>
      <Ionicons name="musical-note" size={14} color={colors.text20} />
    </View>
  );
}

export default function CommunityScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Page Title */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Сообщество</Text>
              <Text style={styles.subtitle}>Что слушают прямо сейчас</Text>
            </View>
            <TouchableOpacity style={styles.createBtn}>
              <Ionicons name="add" size={20} color={colors.text60} />
            </TouchableOpacity>
          </View>

          {/* Active Rooms */}
          <SectionHeader title="Активные комнаты" linkText="Все комнаты" />
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onPress={() => {}} />
          ))}

          {/* Friends */}
          <View style={styles.friendsCard}>
            <View style={styles.friendsHead}>
              <View style={styles.friendsTitle}>
                <Ionicons name="people-outline" size={18} color={colors.text45} />
                <Text style={styles.friendsTitleText}>Друзья слушают</Text>
              </View>
              <View style={styles.friendsActions}>
                <TouchableOpacity>
                  <Ionicons name="person-add-outline" size={18} color={colors.text30} />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.text30} />
                </TouchableOpacity>
              </View>
            </View>
            <FriendItem
              name="Алиса"
              track="Кино — Перемен"
              gradients={['#2a2020', '#201a28']}
            />
            <View style={styles.divider} />
            <FriendItem
              name="Михаил"
              track="Земфира — Малиновка"
              gradients={['#202a20', '#1a2028']}
            />
            <View style={styles.divider} />
            <FriendItem
              name="Надя"
              track="Сплин — Ночной патруль"
              gradients={['#20202a', '#281a20']}
            />
            <TouchableOpacity style={styles.addFriendBtn}>
              <Text style={styles.addFriendText}>Пригласить друзей</Text>
            </TouchableOpacity>
          </View>

          {/* Statistics */}
          <SectionHeader title="Ваша статистика" />
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>247</Text>
              <Text style={styles.statLbl}>Треков</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statVal}>18</Text>
              <Text style={styles.statLbl}>Часов</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>34</Text>
              <Text style={styles.statLbl}>Артистов</Text>
            </View>
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
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 6, paddingBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: colors.text40, marginTop: 4 },
  createBtn: {
    width: 38, height: 38, borderRadius: radius.full,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  roomCard: {
    marginHorizontal: 24, marginBottom: 12,
    padding: 18, backgroundColor: colors.glass,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  roomHostAv: { width: 44, height: 44, borderRadius: radius.full, flexShrink: 0 },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: '600', color: colors.text, letterSpacing: -0.2 },
  roomListeners: { fontSize: 12, color: colors.text30, marginTop: 2 },
  joinBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: colors.text, borderRadius: radius.full,
  },
  joinBtnText: { fontSize: 12, fontWeight: '600', color: colors.bg },
  roomTrack: { fontSize: 13, color: colors.text40 },
  roomWave: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 3,
    height: 40, marginTop: 12, opacity: 0.1,
  },
  roomWaveBar: { flex: 1, backgroundColor: colors.text, borderRadius: 2 },
  friendsCard: {
    marginHorizontal: 24, marginBottom: 8,
    padding: 18, backgroundColor: colors.glass,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder,
  },
  friendsHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  friendsTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  friendsTitleText: { fontSize: 15, fontWeight: '600', color: colors.text },
  friendsActions: { flexDirection: 'row', gap: 14 },
  friendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8,
  },
  friendAv: { width: 40, height: 40, borderRadius: radius.full, flexShrink: 0 },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 14, fontWeight: '500', color: colors.text80 },
  friendTrack: { fontSize: 12, color: colors.text30, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.text06, marginVertical: 2 },
  addFriendBtn: {
    marginTop: 12, paddingVertical: 12,
    backgroundColor: colors.text06, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.text06,
    alignItems: 'center',
  },
  addFriendText: { fontSize: 13, fontWeight: '500', color: colors.text80 },
  stats: {
    flexDirection: 'row', marginHorizontal: 24,
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  statItem: {
    flex: 1, paddingVertical: 18, paddingHorizontal: 12,
    backgroundColor: colors.glass, alignItems: 'center',
  },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.glassBorder },
  statVal: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  statLbl: {
    fontSize: 10, color: colors.text30, textTransform: 'uppercase',
    letterSpacing: 1, fontWeight: '500', marginTop: 4,
  },
});
