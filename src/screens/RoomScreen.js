import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/authStore';
import usePlayerStore from '../store/playerStore';
import useSocialStore from '../store/socialStore';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

function buildCopy(language) {
  return language === 'ru'
    ? {
      title: 'Комнаты',
      namePlaceholder: 'Название комнаты',
      maxMembers: 'Лимит участников',
      create: 'Создать',
      createFromTrack: 'Создать радио из текущего трека',
      join: 'Войти',
      leave: 'Выйти',
      members: 'Участники',
      chat: 'Чат комнаты',
      send: 'Отправить',
      messagePlaceholder: 'Сообщение в комнату',
      syncTrack: 'Поставить текущий трек',
      play: 'Play',
      pause: 'Pause',
      seek: 'Sync',
      noRooms: 'Активных комнат пока нет',
      noMessages: 'Чат комнаты пока пуст',
      yourRoom: 'Текущая комната',
      lobby: 'Лобби',
      host: 'Хост',
    }
    : {
      title: 'Rooms',
      namePlaceholder: 'Room name',
      maxMembers: 'Max members',
      create: 'Create',
      createFromTrack: 'Create radio from current track',
      join: 'Join',
      leave: 'Leave',
      members: 'Members',
      chat: 'Room chat',
      send: 'Send',
      messagePlaceholder: 'Message the room',
      syncTrack: 'Set current track',
      play: 'Play',
      pause: 'Pause',
      seek: 'Sync',
      noRooms: 'No active rooms yet',
      noMessages: 'Room chat is empty',
      yourRoom: 'Current room',
      lobby: 'Lobby',
      host: 'Host',
    };
}

export default function RoomScreen({ navigation, route }) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { language } = useI18n();
  const copy = buildCopy(language);
  const user = useAuthStore((state) => state.user);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const availableRooms = useSocialStore((state) => state.availableRooms);
  const room = useSocialStore((state) => state.room);
  const roomMessages = useSocialStore((state) => state.roomMessages);
  const roomError = useSocialStore((state) => state.roomError);
  const createRoom = useSocialStore((state) => state.createRoom);
  const createRoomFromTrack = useSocialStore((state) => state.createRoomFromTrack);
  const joinRoom = useSocialStore((state) => state.joinRoom);
  const leaveRoom = useSocialStore((state) => state.leaveRoom);
  const sendRoomChat = useSocialStore((state) => state.sendRoomChat);
  const setRoomTrackFromPlayer = useSocialStore((state) => state.setRoomTrackFromPlayer);
  const roomPlayFromPlayer = useSocialStore((state) => state.roomPlayFromPlayer);
  const roomPauseFromPlayer = useSocialStore((state) => state.roomPauseFromPlayer);
  const roomSeekFromPlayer = useSocialStore((state) => state.roomSeekFromPlayer);
  const loadAvailableRooms = useSocialStore((state) => state.loadAvailableRooms);
  const [roomName, setRoomName] = useState(currentTrack?.title ? `${currentTrack.title} radio` : '');
  const [maxMembers, setMaxMembers] = useState('10');
  const [chatMessage, setChatMessage] = useState('');
  const [autoCreated, setAutoCreated] = useState(false);

  const currentUserId = String(user?.uid || user?.id || '');
  const isHost = String(room?.hostId || '') === currentUserId;
  const routeRoomId = route?.params?.roomId;
  const createFromPlayer = Boolean(route?.params?.createFromPlayer);

  useEffect(() => {
    loadAvailableRooms().catch(() => {});
  }, [loadAvailableRooms]);

  useEffect(() => {
    if (routeRoomId && !room) {
      joinRoom(String(routeRoomId));
    }
  }, [joinRoom, room, routeRoomId]);

  useEffect(() => {
    if (!createFromPlayer || autoCreated || room) return;
    if (!currentTrack) return;

    createRoomFromTrack(currentTrack, {
      name: roomName || `${currentTrack.artist || 'Radio'} room`,
      maxMembers: Number(maxMembers || 10),
      isPrivate: false,
    });
    setAutoCreated(true);
  }, [autoCreated, createFromPlayer, createRoomFromTrack, currentTrack, maxMembers, room, roomName]);

  const members = useMemo(() => room?.members || [], [room?.members]);

  const submitCreate = () => {
    if (!roomName.trim()) return;
    createRoom(roomName.trim(), {
      maxMembers: Number(maxMembers || 10),
      isPrivate: false,
    });
  };

  const submitChat = () => {
    if (!chatMessage.trim()) return;
    sendRoomChat(chatMessage.trim());
    setChatMessage('');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <TopNav title={copy.title} onBack={() => navigation.goBack()} />

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {room ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{copy.yourRoom}</Text>
                <View style={styles.heroCard}>
                  <View style={styles.heroHeader}>
                    <View style={styles.heroText}>
                      <Text style={styles.heroTitle}>{room.name}</Text>
                      <Text style={styles.heroMeta}>
                        {members.length || room.memberCount || 0} · {copy.members}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.leaveBtn} onPress={leaveRoom}>
                      <Text style={styles.leaveBtnText}>{copy.leave}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.trackLine}>
                    {room.track?.title
                      ? `${room.track.title} - ${room.track.artist || ''}`.trim()
                      : copy.lobby}
                  </Text>

                  {isHost && (
                    <View style={styles.hostActions}>
                      <TouchableOpacity style={styles.controlBtn} onPress={setRoomTrackFromPlayer}>
                        <Text style={styles.controlBtnText}>{copy.syncTrack}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.controlBtn} onPress={roomPlayFromPlayer}>
                        <Text style={styles.controlBtnText}>{copy.play}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.controlBtn} onPress={roomPauseFromPlayer}>
                        <Text style={styles.controlBtnText}>{copy.pause}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.controlBtn} onPress={roomSeekFromPlayer}>
                        <Text style={styles.controlBtnText}>{copy.seek}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{copy.members}</Text>
                <View style={styles.panel}>
                  {members.map((member) => (
                    <TouchableOpacity
                      key={member.userId}
                      style={styles.memberRow}
                      onPress={() => navigation.navigate('Profile', { userId: member.userId })}
                    >
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {String(member.displayName || member.handle || '?').slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberMeta}>
                        <Text style={styles.memberName}>{member.displayName || member.handle}</Text>
                        <Text style={styles.memberHandle}>
                          @{member.handle} {String(member.userId) === String(room.hostId) ? `· ${copy.host}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{copy.chat}</Text>
                <View style={styles.panel}>
                  {roomMessages.length > 0 ? (
                    roomMessages.map((message) => (
                      <View key={message.msgId || `${message.senderId}:${message.timestamp}`} style={styles.chatBubble}>
                        <Text style={styles.chatAuthor}>{message.senderName}</Text>
                        <Text style={styles.chatText}>{message.content}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>{copy.noMessages}</Text>
                  )}

                  <View style={styles.chatComposer}>
                    <TextInput
                      value={chatMessage}
                      onChangeText={setChatMessage}
                      placeholder={copy.messagePlaceholder}
                      placeholderTextColor={theme.text20}
                      style={styles.input}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={submitChat}>
                      <Text style={styles.sendBtnText}>{copy.send}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{copy.create}</Text>
                <View style={styles.panel}>
                  <TextInput
                    value={roomName}
                    onChangeText={setRoomName}
                    placeholder={copy.namePlaceholder}
                    placeholderTextColor={theme.text20}
                    style={styles.input}
                  />
                  <TextInput
                    value={maxMembers}
                    onChangeText={setMaxMembers}
                    placeholder={copy.maxMembers}
                    placeholderTextColor={theme.text20}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <TouchableOpacity style={styles.primaryBtn} onPress={submitCreate}>
                    <Text style={styles.primaryBtnText}>{copy.create}</Text>
                  </TouchableOpacity>
                  {!!currentTrack && (
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => createRoomFromTrack(currentTrack, {
                        name: roomName.trim() || `${currentTrack.title} radio`,
                        maxMembers: Number(maxMembers || 10),
                      })}
                    >
                      <Text style={styles.secondaryBtnText}>{copy.createFromTrack}</Text>
                    </TouchableOpacity>
                  )}
                  {!!roomError && <Text style={styles.errorText}>{roomError}</Text>}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{copy.title}</Text>
                {availableRooms.length > 0 ? (
                  availableRooms.map((availableRoom) => (
                    <TouchableOpacity
                      key={availableRoom.id}
                      style={styles.roomCard}
                      onPress={() => joinRoom(availableRoom.id)}
                    >
                      <View style={styles.heroHeader}>
                        <View style={styles.heroText}>
                          <Text style={styles.heroTitle}>{availableRoom.name}</Text>
                          <Text style={styles.heroMeta}>
                            {availableRoom.memberCount || availableRoom.members?.length || 0} · {copy.members}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.joinBtn} onPress={() => joinRoom(availableRoom.id)}>
                          <Text style={styles.joinBtnText}>{copy.join}</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.trackLine}>
                        {availableRoom.track?.title
                          ? `${availableRoom.track.title} - ${availableRoom.track.artist || ''}`.trim()
                          : copy.lobby}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.panel}>
                    <Text style={styles.emptyText}>{copy.noRooms}</Text>
                  </View>
                )}
              </View>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    scroll: { flex: 1 },
    section: { paddingHorizontal: 24, marginBottom: 18 },
    sectionLabel: {
      color: theme.text,
      fontSize: 18 * theme.scale,
      fontWeight: '700',
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    heroCard: {
      padding: 16,
      borderRadius: radius.lg,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    heroText: { flex: 1 },
    heroTitle: {
      color: theme.text,
      fontSize: 18 * theme.scale,
      fontWeight: '700',
    },
    heroMeta: {
      color: theme.text30,
      fontSize: 12 * theme.scale,
      marginTop: 4,
    },
    leaveBtn: {
      height: 38,
      borderRadius: radius.full,
      paddingHorizontal: 14,
      backgroundColor: theme.text08,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leaveBtnText: { color: theme.text, fontWeight: '700', fontSize: 12 * theme.scale },
    trackLine: {
      color: theme.text40,
      fontSize: 13 * theme.scale,
      marginTop: 10,
    },
    hostActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 16,
    },
    controlBtn: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
    },
    controlBtnText: {
      color: theme.accent,
      fontWeight: '700',
      fontSize: 12 * theme.scale,
    },
    panel: {
      padding: 16,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberAvatarText: {
      color: theme.text,
      fontWeight: '700',
    },
    memberMeta: { flex: 1 },
    memberName: { color: theme.text, fontWeight: '600', fontSize: 14 * theme.scale },
    memberHandle: { color: theme.text30, fontSize: 12 * theme.scale, marginTop: 2 },
    chatBubble: {
      padding: 12,
      borderRadius: radius.md,
      backgroundColor: theme.text08,
      marginBottom: 10,
    },
    chatAuthor: {
      color: theme.text,
      fontWeight: '700',
      fontSize: 12 * theme.scale,
      marginBottom: 4,
    },
    chatText: {
      color: theme.text80,
      fontSize: 14 * theme.scale,
      lineHeight: 20 * theme.scale,
    },
    chatComposer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
    },
    input: {
      flex: 1,
      height: 46,
      borderRadius: radius.full,
      backgroundColor: theme.text08,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      paddingHorizontal: 14,
      color: theme.text,
      marginBottom: 10,
    },
    sendBtn: {
      height: 46,
      paddingHorizontal: 16,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
      marginBottom: 10,
    },
    sendBtnText: {
      color: theme.onAccent,
      fontWeight: '700',
      fontSize: 13 * theme.scale,
    },
    primaryBtn: {
      height: 46,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
      marginBottom: 10,
    },
    primaryBtnText: {
      color: theme.onAccent,
      fontWeight: '700',
      fontSize: 13 * theme.scale,
    },
    secondaryBtn: {
      height: 46,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.text08,
    },
    secondaryBtnText: {
      color: theme.text,
      fontWeight: '700',
      fontSize: 13 * theme.scale,
    },
    roomCard: {
      padding: 16,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      marginBottom: 12,
    },
    joinBtn: {
      height: 38,
      paddingHorizontal: 14,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accentSoft,
    },
    joinBtnText: {
      color: theme.accent,
      fontWeight: '700',
      fontSize: 12 * theme.scale,
    },
    emptyText: { color: theme.text30, fontSize: 13 * theme.scale },
    errorText: {
      color: theme.error,
      fontSize: 13 * theme.scale,
      marginTop: 4,
    },
  });
}
