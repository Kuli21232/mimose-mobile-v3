import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MiniPlayer from '../components/MiniPlayer';
import TrackItem from '../components/TrackItem';
import ArtistCard from '../components/ArtistCard';
import SectionHeader from '../components/SectionHeader';
import TrackOptionsSheet from '../components/TrackOptionsSheet';
import useAuthStore from '../store/authStore';
import usePlayerStore from '../store/playerStore';
import useSocialStore from '../store/socialStore';
import { tracksApi } from '../api/tracks';
import { yandexApi } from '../api/yandex';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';
import { extractResults, normalizeArtist, normalizeTrack, pickGradient } from '../utils/media';

function buildCopy(language) {
  return language === 'ru'
    ? {
      title: 'Сообщество',
      subtitle: 'Чаты, друзья, комнаты и живые профили',
      guestTitle: 'Социальные разделы доступны после входа',
      guestText: 'После авторизации откроются друзья, комнаты, мессенджер и профили из вашего backend.',
      signIn: 'Войти',
      openChats: 'Чаты',
      openRooms: 'Комнаты',
      openProfile: 'Профиль',
      requests: 'Заявки',
      rooms: 'Активные комнаты',
      friends: 'Друзья',
      chats: 'Последние диалоги',
      publicTracks: 'Публичный пульс',
      artists: 'Топ-артисты',
      createRoom: 'Создать комнату',
      accept: 'Принять',
      decline: 'Отклонить',
      join: 'Войти',
      noRequests: 'Новых заявок нет',
      noRooms: 'Комнат пока нет',
      noFriends: 'Друзья пока не добавлены',
      noChats: 'Диалогов пока нет',
      noPublic: 'Публичная лента пока пуста',
      searchPlaceholder: 'Поиск людей в чатах',
      online: 'онлайн',
      members: 'участников',
    }
    : {
      title: 'Community',
      subtitle: 'Chats, friends, rooms and live profiles',
      guestTitle: 'Social sections unlock after sign in',
      guestText: 'After authentication you will see friends, rooms, messenger and profiles from your backend.',
      signIn: 'Sign in',
      openChats: 'Chats',
      openRooms: 'Rooms',
      openProfile: 'Profile',
      requests: 'Requests',
      rooms: 'Active rooms',
      friends: 'Friends',
      chats: 'Recent chats',
      publicTracks: 'Public pulse',
      artists: 'Top artists',
      createRoom: 'Create room',
      accept: 'Accept',
      decline: 'Decline',
      join: 'Join',
      noRequests: 'No pending requests',
      noRooms: 'No rooms yet',
      noFriends: 'No friends yet',
      noChats: 'No conversations yet',
      noPublic: 'Public feed is empty',
      searchPlaceholder: 'Search people in chats',
      online: 'online',
      members: 'members',
    };
}

function AvatarBubble({ name, colorSeed, size = 42, theme }) {
  const gradient = pickGradient(colorSeed || name || 'user');
  const styles = StyleSheet.create({
    avatar: {
      width: size,
      height: size,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: gradient[0],
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    text: {
      color: theme.text,
      fontSize: Math.max(12, size * 0.34),
      fontWeight: '700',
    },
  });

  return (
    <View style={styles.avatar}>
      <Text style={styles.text}>{String(name || '?').slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

function EmptyState({ text, theme }) {
  const styles = createStyles(theme);
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export default function CommunityScreen({ navigation }) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { language } = useI18n();
  const copy = buildCopy(language);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const room = useSocialStore((state) => state.room);
  const friends = useSocialStore((state) => state.friends);
  const friendRequests = useSocialStore((state) => state.friendRequests);
  const conversations = useSocialStore((state) => state.conversations);
  const availableRooms = useSocialStore((state) => state.availableRooms);
  const bootstrapLoading = useSocialStore((state) => state.bootstrapLoading);
  const loadFriends = useSocialStore((state) => state.loadFriends);
  const loadFriendRequests = useSocialStore((state) => state.loadFriendRequests);
  const loadPresence = useSocialStore((state) => state.loadPresence);
  const loadConversations = useSocialStore((state) => state.loadConversations);
  const loadAvailableRooms = useSocialStore((state) => state.loadAvailableRooms);
  const acceptFriendRequest = useSocialStore((state) => state.acceptFriendRequest);
  const declineFriendRequest = useSocialStore((state) => state.declineFriendRequest);
  const openConversation = useSocialStore((state) => state.openConversation);
  const searchUsers = useSocialStore((state) => state.searchUsers);
  const [publicTracks, setPublicTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuTrack, setMenuTrack] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const myUserId = String(user?.uid || user?.id || '');

  const refreshAll = async () => {
    setRefreshing(true);

    const publicRequests = Promise.allSettled([
      tracksApi.getTopTracks(),
      yandexApi.getTopArtists(),
    ]);

    const protectedRequests = isAuthenticated
      ? Promise.allSettled([
        loadFriends(),
        loadFriendRequests(),
        loadPresence(),
        loadConversations(),
        loadAvailableRooms(),
      ])
      : Promise.resolve([]);

    const [publicResults] = await Promise.all([publicRequests, protectedRequests]);

    const tracksPayload = publicResults[0]?.status === 'fulfilled' ? publicResults[0].value.data : [];
    const artistsPayload = publicResults[1]?.status === 'fulfilled' ? publicResults[1].value.data : [];

    setPublicTracks(
      extractResults(tracksPayload, ['tracks'])
        .slice(0, 5)
        .map((track) => normalizeTrack(track, { source: track?.platform || 'yandex' })),
    );

    setTopArtists(
      extractResults(artistsPayload, ['artists'])
        .slice(0, 8)
        .map(normalizeArtist),
    );

    setRefreshing(false);
  };

  useEffect(() => {
    refreshAll();
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      if (!isAuthenticated || userSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      const results = await searchUsers(userSearch.trim());
      if (!cancelled) {
        setSearchResults(results.slice(0, 6));
      }
    };

    const timeoutId = setTimeout(runSearch, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, searchUsers, userSearch]);

  const visibleFriends = useMemo(() => friends.slice(0, 6), [friends]);
  const visibleConversations = useMemo(() => conversations.slice(0, 4), [conversations]);
  const visibleRooms = useMemo(() => availableRooms.slice(0, 4), [availableRooms]);

  const handleTrackPress = (track) => {
    const queue = publicTracks.length > 0 ? publicTracks : [track];
    const index = Math.max(queue.findIndex((item) => `${item.source}:${item.id}` === `${track.source}:${track.id}`), 0);
    playTrack(track, queue, index);
    navigation.navigate('Player');
  };

  const handleOpenConversation = async (conversationId) => {
    await openConversation(conversationId);
    navigation.navigate('Messenger', { conversationId });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing || bootstrapLoading}
            onRefresh={refreshAll}
            tintColor={theme.accent}
          />
        )}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
            </View>
            <TouchableOpacity style={styles.headerAction} onPress={refreshAll}>
              <Ionicons name="refresh-outline" size={18} color={theme.text60} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Messenger')}>
              <Ionicons name="chatbubbles-outline" size={18} color={theme.accent} />
              <Text style={styles.quickActionText}>{copy.openChats}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Room')}>
              <Ionicons name="radio-outline" size={18} color={theme.accent} />
              <Text style={styles.quickActionText}>{room ? copy.openRooms : copy.createRoom}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Profile', myUserId ? { userId: myUserId } : undefined)}
            >
              <Ionicons name="person-outline" size={18} color={theme.accent} />
              <Text style={styles.quickActionText}>{copy.openProfile}</Text>
            </TouchableOpacity>
          </View>

          {!isAuthenticated ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy.guestTitle}</Text>
              <Text style={styles.cardText}>{copy.guestText}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.primaryButtonText}>{copy.signIn}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <SectionHeader title={copy.requests} />
              {friendRequests.length > 0 ? (
                <View style={styles.card}>
                  {friendRequests.slice(0, 4).map((request, index) => {
                    const requester = request?.user || {};
                    return (
                      <View key={request.id}>
                        <View style={styles.row}>
                          <TouchableOpacity
                            style={styles.rowMain}
                            onPress={() => navigation.navigate('Profile', { userId: requester.id })}
                          >
                            <AvatarBubble
                              name={requester.displayName || requester.handle}
                              colorSeed={requester.id || requester.handle}
                              theme={theme}
                            />
                            <View style={styles.rowTextWrap}>
                              <Text style={styles.rowTitle}>{requester.displayName || requester.handle}</Text>
                              <Text style={styles.rowMeta}>@{requester.handle}</Text>
                            </View>
                          </TouchableOpacity>
                          <View style={styles.inlineActions}>
                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => acceptFriendRequest(request.id).catch(() => {})}
                            >
                              <Text style={styles.acceptBtnText}>{copy.accept}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.ghostBtn}
                              onPress={() => declineFriendRequest(request.id).catch(() => {})}
                            >
                              <Text style={styles.ghostBtnText}>{copy.decline}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {index < Math.min(friendRequests.length, 4) - 1 && <View style={styles.divider} />}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <EmptyState text={copy.noRequests} theme={theme} />
              )}

              <SectionHeader title={copy.rooms} />
              {visibleRooms.length > 0 ? (
                visibleRooms.map((activeRoom) => (
                  <TouchableOpacity
                    key={activeRoom.id}
                    style={styles.card}
                    onPress={() => navigation.navigate('Room', { roomId: activeRoom.id })}
                  >
                    <View style={styles.roomTop}>
                      <View style={styles.roomHeading}>
                        <Text style={styles.cardTitle}>{activeRoom.name}</Text>
                        <Text style={styles.cardMeta}>
                          {activeRoom.memberCount || activeRoom.members?.length || 0} {copy.members}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => navigation.navigate('Room', { roomId: activeRoom.id })}
                      >
                        <Text style={styles.joinBtnText}>{copy.join}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.roomTrack} numberOfLines={1}>
                      {activeRoom.track?.title
                        ? `${activeRoom.track.title} - ${activeRoom.track.artist || ''}`.trim()
                        : copy.noPublic}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <EmptyState text={copy.noRooms} theme={theme} />
              )}

              <SectionHeader title={copy.friends} />
              <View style={styles.card}>
                <TextInput
                  value={userSearch}
                  onChangeText={setUserSearch}
                  placeholder={copy.searchPlaceholder}
                  placeholderTextColor={theme.text20}
                  style={styles.searchInput}
                />
                {searchResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {searchResults.map((result) => (
                      <TouchableOpacity
                        key={result.id}
                        style={styles.searchResult}
                        onPress={() => {
                          setUserSearch('');
                          setSearchResults([]);
                          navigation.navigate('Profile', { userId: result.id });
                        }}
                      >
                        <AvatarBubble
                          name={result.displayName || result.handle}
                          colorSeed={result.id || result.handle}
                          size={34}
                          theme={theme}
                        />
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle}>{result.displayName || result.handle}</Text>
                          <Text style={styles.rowMeta}>@{result.handle}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {visibleFriends.length > 0 ? (
                  visibleFriends.map((friend, index) => (
                    <View key={friend.id}>
                      <View style={styles.row}>
                        <TouchableOpacity
                          style={styles.rowMain}
                          onPress={() => navigation.navigate('Profile', { userId: friend.id })}
                        >
                          <AvatarBubble
                            name={friend.displayName || friend.handle}
                            colorSeed={friend.id || friend.handle}
                            theme={theme}
                          />
                          <View style={styles.rowTextWrap}>
                            <Text style={styles.rowTitle}>{friend.displayName || friend.handle}</Text>
                            <Text style={styles.rowMeta}>
                              @{friend.handle} {friend.isOnline ? `· ${copy.online}` : ''}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => navigation.navigate('Messenger', { participantId: friend.id })}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.text60} />
                        </TouchableOpacity>
                      </View>
                      {index < visibleFriends.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))
                ) : (
                  <EmptyState text={copy.noFriends} theme={theme} />
                )}
              </View>

              <SectionHeader title={copy.chats} />
              {visibleConversations.length > 0 ? (
                visibleConversations.map((conversation) => (
                  <TouchableOpacity
                    key={conversation.id}
                    style={styles.card}
                    onPress={() => handleOpenConversation(conversation.id)}
                  >
                    <View style={styles.row}>
                      <AvatarBubble
                        name={conversation.participant.displayName || conversation.participant.handle}
                        colorSeed={conversation.participant.id || conversation.participant.handle}
                        theme={theme}
                      />
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowTitle}>
                          {conversation.participant.displayName || conversation.participant.handle}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {conversation.lastMessage?.content || '@' + conversation.participant.handle}
                        </Text>
                      </View>
                      {conversation.unreadCount > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <EmptyState text={copy.noChats} theme={theme} />
              )}
            </>
          )}

          <SectionHeader title={copy.publicTracks} />
          {publicTracks.length > 0 ? (
            publicTracks.map((track) => (
              <TrackItem
                key={`${track.source}:${track.id}`}
                track={track}
                onPress={() => handleTrackPress(track)}
                onMore={() => setMenuTrack(track)}
              />
            ))
          ) : (
            <EmptyState text={copy.noPublic} theme={theme} />
          )}

          <SectionHeader title={copy.artists} />
          {topArtists.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistsRow}>
              {topArtists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  onPress={() => navigation.navigate('ArtistDetail', { artist })}
                />
              ))}
            </ScrollView>
          ) : (
            <EmptyState text={copy.noPublic} theme={theme} />
          )}

          <View style={{ height: 160 }} />
        </SafeAreaView>
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
      <TrackOptionsSheet
        visible={Boolean(menuTrack)}
        track={menuTrack}
        onClose={() => setMenuTrack(null)}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    scroll: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 6,
      paddingBottom: 10,
    },
    headerText: { flex: 1, paddingRight: 16 },
    title: {
      fontSize: 30 * theme.scale,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.8,
    },
    subtitle: {
      marginTop: 4,
      color: theme.text40,
      fontSize: 14 * theme.scale,
    },
    headerAction: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickRow: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      gap: 10,
      marginBottom: 6,
    },
    quickAction: {
      flex: 1,
      minHeight: 74,
      padding: 14,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      justifyContent: 'space-between',
    },
    quickActionText: {
      marginTop: 12,
      color: theme.text,
      fontSize: 13 * theme.scale,
      fontWeight: '700',
    },
    card: {
      marginHorizontal: 24,
      marginBottom: 12,
      padding: 16,
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 16 * theme.scale,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    cardMeta: {
      color: theme.text30,
      fontSize: 12 * theme.scale,
      marginTop: 4,
    },
    cardText: {
      color: theme.text40,
      fontSize: 13 * theme.scale,
      lineHeight: 20 * theme.scale,
      marginTop: 10,
    },
    primaryButton: {
      marginTop: 14,
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
    },
    primaryButtonText: {
      color: theme.onAccent,
      fontWeight: '700',
      fontSize: 13 * theme.scale,
    },
    roomTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    roomHeading: { flex: 1 },
    roomTrack: {
      marginTop: 10,
      color: theme.text40,
      fontSize: 13 * theme.scale,
    },
    joinBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
    },
    joinBtnText: {
      color: theme.accent,
      fontSize: 12 * theme.scale,
      fontWeight: '700',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rowMain: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rowTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: theme.text,
      fontSize: 14 * theme.scale,
      fontWeight: '600',
    },
    rowMeta: {
      marginTop: 2,
      color: theme.text30,
      fontSize: 12 * theme.scale,
    },
    inlineActions: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    acceptBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
    },
    acceptBtnText: {
      color: theme.onAccent,
      fontSize: 12 * theme.scale,
      fontWeight: '700',
    },
    ghostBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: theme.text08,
    },
    ghostBtnText: {
      color: theme.text60,
      fontSize: 12 * theme.scale,
      fontWeight: '700',
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: theme.text08,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      minWidth: 24,
      height: 24,
      paddingHorizontal: 7,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: theme.onAccent,
      fontWeight: '700',
      fontSize: 11 * theme.scale,
    },
    divider: {
      height: 1,
      backgroundColor: theme.text08,
      marginVertical: 12,
    },
    emptyCard: {
      marginHorizontal: 24,
      marginBottom: 12,
      padding: 16,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    emptyText: {
      color: theme.text30,
      fontSize: 13 * theme.scale,
    },
    searchInput: {
      height: 44,
      borderRadius: radius.md,
      backgroundColor: theme.text08,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      color: theme.text,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    searchResults: {
      marginBottom: 12,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.glassBorder,
    },
    searchResult: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.text04,
      borderBottomWidth: 1,
      borderBottomColor: theme.text06,
    },
    artistsRow: {
      paddingHorizontal: 24,
      paddingBottom: 8,
      gap: 16,
    },
  });
}
