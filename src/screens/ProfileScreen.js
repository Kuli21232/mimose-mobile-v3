import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/authStore';
import useSocialStore from '../store/socialStore';
import { profileApi } from '../api/profile';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

function buildCopy(language) {
  return language === 'ru'
    ? {
      myProfile: 'Профиль',
      displayName: 'Имя',
      handle: 'Handle',
      bio: 'О себе',
      save: 'Сохранить',
      saving: 'Сохранение...',
      message: 'Написать',
      addFriend: 'Добавить в друзья',
      removeFriend: 'Удалить из друзей',
      requestSent: 'Заявка отправлена',
      privateStats: 'Статистика скрыта',
      tracks: 'Треков',
      artists: 'Артистов',
      hours: 'Часов',
      memberSince: 'В Mimose с',
      noBio: 'Пользователь пока ничего не написал о себе',
    }
    : {
      myProfile: 'Profile',
      displayName: 'Display name',
      handle: 'Handle',
      bio: 'Bio',
      save: 'Save',
      saving: 'Saving...',
      message: 'Message',
      addFriend: 'Add friend',
      removeFriend: 'Remove friend',
      requestSent: 'Request sent',
      privateStats: 'Stats are private',
      tracks: 'Tracks',
      artists: 'Artists',
      hours: 'Hours',
      memberSince: 'Member since',
      noBio: 'This user has not added a bio yet',
    };
}

function formatHours(stats) {
  const rawHours = Number(stats?.hours || stats?.hours_listened || stats?.listening_hours || 0);
  if (rawHours) return rawHours;
  const minutes = Number(stats?.minutes || stats?.minutes_listened || 0);
  return minutes ? Math.round(minutes / 60) : 0;
}

export default function ProfileScreen({ navigation, route }) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { language } = useI18n();
  const copy = buildCopy(language);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const createConversation = useSocialStore((state) => state.createConversation);
  const getFriendshipStatus = useSocialStore((state) => state.getFriendshipStatus);
  const sendFriendRequest = useSocialStore((state) => state.sendFriendRequest);
  const removeFriend = useSocialStore((state) => state.removeFriend);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState({ status: 'none' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');

  const targetUserId = String(route?.params?.userId || user?.uid || user?.id || '');
  const currentUserId = String(user?.uid || user?.id || '');
  const isOwnProfile = !route?.params?.userId || targetUserId === currentUserId;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const profileRequest = isOwnProfile
          ? profileApi.getMe()
          : profileApi.getPublicProfileById(targetUserId);

        const statsRequest = isOwnProfile
          ? profileApi.getMyStats()
          : profileApi.getUserStats(targetUserId);

        const [profileResponse, statsResponse, friendshipStatus] = await Promise.all([
          profileRequest,
          statsRequest.catch(() => ({ data: null })),
          isOwnProfile ? Promise.resolve({ status: 'accepted' }) : getFriendshipStatus(targetUserId),
        ]);

        if (cancelled) return;

        const nextProfile = profileResponse?.data || null;
        setProfile(nextProfile);
        setStats(statsResponse?.data || null);
        setStatus(friendshipStatus || { status: 'none' });
        setDisplayName(nextProfile?.displayName || nextProfile?.handle || '');
        setHandle(nextProfile?.handle || '');
        setBio(nextProfile?.bio || '');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [getFriendshipStatus, isOwnProfile, targetUserId]);

  const statCards = useMemo(() => ([
    {
      label: copy.tracks,
      value: Number(stats?.tracks || stats?.tracks_count || stats?.uniqueTracks || 0) || 0,
    },
    {
      label: copy.hours,
      value: formatHours(stats),
    },
    {
      label: copy.artists,
      value: Number(stats?.artists || stats?.artists_count || stats?.uniqueArtists || 0) || 0,
    },
  ]), [copy.artists, copy.hours, copy.tracks, stats]);

  const saveProfile = async () => {
    if (!isOwnProfile) return;
    setSaving(true);

    try {
      await profileApi.updateMe({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });

      if (handle.trim() && handle.trim() !== profile?.handle) {
        await profileApi.updateHandle(handle.trim());
      }

      const { data } = await profileApi.getMe();
      setProfile(data);
      setUser({ ...user, ...data });
    } finally {
      setSaving(false);
    }
  };

  const openChat = () => {
    createConversation(targetUserId)
      .then((conversationId) => {
        if (conversationId) {
          navigation.navigate('Messenger', { conversationId });
        }
      })
      .catch(() => {});
  };

  const requestFriendship = () => {
    sendFriendRequest(targetUserId)
      .then(() => setStatus({ status: 'pending', direction: 'outgoing' }))
      .catch(() => {});
  };

  const unfriend = () => {
    removeFriend(targetUserId)
      .then(() => setStatus({ status: 'none' }))
      .catch(() => {});
  };

  const registeredAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')
    : '';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <TopNav title={copy.myProfile} onBack={() => navigation.goBack()} />

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {String(profile?.displayName || profile?.handle || '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.name}>{profile?.displayName || profile?.handle || '...'}</Text>
            <Text style={styles.handle}>@{profile?.handle || '...'}</Text>
            {!!registeredAt && <Text style={styles.memberSince}>{copy.memberSince} {registeredAt}</Text>}
          </View>

          {loading ? (
            <View style={styles.block}>
              <Text style={styles.blockText}>...</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                {statCards.map((item) => (
                  <View key={item.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {stats?.private === true && (
                <View style={styles.block}>
                  <Text style={styles.blockText}>{copy.privateStats}</Text>
                </View>
              )}

              <View style={styles.block}>
                <Text style={styles.blockLabel}>{copy.bio}</Text>
                {isOwnProfile ? (
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    placeholder={copy.bio}
                    placeholderTextColor={theme.text20}
                    style={[styles.input, styles.bioInput]}
                  />
                ) : (
                  <Text style={styles.blockText}>{profile?.bio || copy.noBio}</Text>
                )}
              </View>

              {isOwnProfile ? (
                <View style={styles.block}>
                  <Text style={styles.blockLabel}>{copy.displayName}</Text>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder={copy.displayName}
                    placeholderTextColor={theme.text20}
                    style={styles.input}
                  />
                  <Text style={styles.blockLabel}>{copy.handle}</Text>
                  <TextInput
                    value={handle}
                    onChangeText={setHandle}
                    placeholder={copy.handle}
                    placeholderTextColor={theme.text20}
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <TouchableOpacity style={styles.primaryBtn} onPress={saveProfile}>
                    <Text style={styles.primaryBtnText}>{saving ? copy.saving : copy.save}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={openChat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.text} />
                    <Text style={styles.secondaryBtnText}>{copy.message}</Text>
                  </TouchableOpacity>
                  {status?.status === 'accepted' ? (
                    <TouchableOpacity style={styles.primaryBtnWide} onPress={unfriend}>
                      <Text style={styles.primaryBtnText}>{copy.removeFriend}</Text>
                    </TouchableOpacity>
                  ) : status?.status === 'pending' ? (
                    <View style={styles.pendingPill}>
                      <Text style={styles.pendingPillText}>{copy.requestSent}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.primaryBtnWide} onPress={requestFriendship}>
                      <Text style={styles.primaryBtnText}>{copy.addFriend}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
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
    hero: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    avatar: {
      width: 94,
      height: 94,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    avatarText: {
      color: theme.text,
      fontSize: 32 * theme.scale,
      fontWeight: '800',
    },
    name: {
      color: theme.text,
      fontSize: 24 * theme.scale,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    handle: {
      color: theme.text40,
      fontSize: 14 * theme.scale,
      marginTop: 4,
    },
    memberSince: {
      color: theme.text30,
      fontSize: 12 * theme.scale,
      marginTop: 10,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 24,
      marginBottom: 18,
    },
    statCard: {
      flex: 1,
      paddingVertical: 18,
      paddingHorizontal: 10,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    statValue: {
      color: theme.text,
      fontSize: 24 * theme.scale,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    statLabel: {
      color: theme.text30,
      fontSize: 11 * theme.scale,
      textTransform: 'uppercase',
      marginTop: 4,
      letterSpacing: 1,
    },
    block: {
      marginHorizontal: 24,
      marginBottom: 16,
      padding: 16,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    blockLabel: {
      color: theme.text60,
      fontSize: 12 * theme.scale,
      fontWeight: '700',
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    blockText: {
      color: theme.text,
      fontSize: 14 * theme.scale,
      lineHeight: 22 * theme.scale,
    },
    input: {
      height: 46,
      borderRadius: radius.md,
      backgroundColor: theme.text08,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      paddingHorizontal: 14,
      color: theme.text,
      marginBottom: 12,
    },
    bioInput: {
      minHeight: 104,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    secondaryBtnText: {
      color: theme.text,
      fontSize: 13 * theme.scale,
      fontWeight: '700',
    },
    primaryBtn: {
      marginTop: 6,
      height: 46,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnWide: {
      flex: 1,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: {
      color: theme.onAccent,
      fontSize: 13 * theme.scale,
      fontWeight: '700',
    },
    pendingPill: {
      flex: 1,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: theme.text08,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pendingPillText: {
      color: theme.text60,
      fontSize: 13 * theme.scale,
      fontWeight: '700',
    },
  });
}
