import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/authStore';
import useSocialStore from '../store/socialStore';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

function buildCopy(language) {
  return language === 'ru'
    ? {
      title: 'Чаты',
      startTitle: 'Новый диалог',
      searchPlaceholder: 'Найти пользователя',
      conversations: 'Диалоги',
      noConversations: 'Диалогов пока нет',
      noMessages: 'Сообщений пока нет',
      typeMessage: 'Сообщение',
      send: 'Отправить',
      openProfile: 'Профиль',
    }
    : {
      title: 'Chats',
      startTitle: 'New conversation',
      searchPlaceholder: 'Find a user',
      conversations: 'Conversations',
      noConversations: 'No conversations yet',
      noMessages: 'No messages yet',
      typeMessage: 'Message',
      send: 'Send',
      openProfile: 'Profile',
    };
}

function Avatar({ label, seed, theme }) {
  const styles = StyleSheet.create({
    avatar: {
      width: 42,
      height: 42,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accentSoft,
    },
    text: {
      color: theme.text,
      fontWeight: '700',
      fontSize: 14 * theme.scale,
    },
  });

  return (
    <View style={styles.avatar}>
      <Text style={styles.text}>{String(seed || label || '?').slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export default function MessengerScreen({ navigation, route }) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { language } = useI18n();
  const copy = buildCopy(language);
  const user = useAuthStore((state) => state.user);
  const conversations = useSocialStore((state) => state.conversations);
  const activeConversationId = useSocialStore((state) => state.activeConversationId);
  const messagesByConversation = useSocialStore((state) => state.messagesByConversation);
  const openConversation = useSocialStore((state) => state.openConversation);
  const createConversation = useSocialStore((state) => state.createConversation);
  const sendMessage = useSocialStore((state) => state.sendMessage);
  const deleteConversation = useSocialStore((state) => state.deleteConversation);
  const searchUsers = useSocialStore((state) => state.searchUsers);
  const [composer, setComposer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const currentUserId = String(user?.uid || user?.id || '');

  useEffect(() => {
    const conversationId = route?.params?.conversationId;
    const participantId = route?.params?.participantId;

    if (conversationId) {
      openConversation(conversationId).catch(() => {});
      return;
    }

    if (participantId) {
      createConversation(participantId)
        .then((id) => {
          if (id) {
            openConversation(id).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [createConversation, openConversation, route?.params?.conversationId, route?.params?.participantId]);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      const results = await searchUsers(searchQuery);
      if (!cancelled) {
        setSearchResults(results.slice(0, 6));
      }
    };

    const timer = setTimeout(runSearch, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchUsers]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) || null,
    [activeConversationId, conversations],
  );

  const activeMessages = activeConversationId
    ? (messagesByConversation[activeConversationId] || [])
    : [];

  const handleSend = () => {
    if (!activeConversationId || !composer.trim()) return;
    sendMessage(activeConversationId, composer);
    setComposer('');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <TopNav title={copy.title} onBack={() => navigation.goBack()} />

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.startTitle}</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={copy.searchPlaceholder}
              placeholderTextColor={theme.text20}
              style={styles.searchInput}
            />
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.searchRow}
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  createConversation(result.id)
                    .then((id) => id && openConversation(id))
                    .catch(() => {});
                }}
              >
                <Avatar label={result.displayName || result.handle} seed={result.id} theme={theme} />
                <View style={styles.searchMeta}>
                  <Text style={styles.searchName}>{result.displayName || result.handle}</Text>
                  <Text style={styles.searchHandle}>@{result.handle}</Text>
                </View>
                <TouchableOpacity
                  style={styles.inlineButton}
                  onPress={() => navigation.navigate('Profile', { userId: result.id })}
                >
                  <Text style={styles.inlineButtonText}>{copy.openProfile}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.conversations}</Text>
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.id}
                  style={[
                    styles.conversationCard,
                    activeConversationId === conversation.id && styles.conversationCardActive,
                  ]}
                  onPress={() => openConversation(conversation.id)}
                >
                  <Avatar
                    label={conversation.participant.displayName || conversation.participant.handle}
                    seed={conversation.participant.id}
                    theme={theme}
                  />
                  <View style={styles.conversationInfo}>
                    <Text style={styles.searchName}>
                      {conversation.participant.displayName || conversation.participant.handle}
                    </Text>
                    <Text style={styles.searchHandle} numberOfLines={1}>
                      {conversation.lastMessage?.content || '@' + conversation.participant.handle}
                    </Text>
                  </View>
                  {conversation.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteConversation(conversation.id).catch(() => {})}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.text30} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{copy.noConversations}</Text>
              </View>
            )}
          </View>

          {activeConversation && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.chatHeader}
                onPress={() => navigation.navigate('Profile', { userId: activeConversation.participant.id })}
              >
                <Avatar
                  label={activeConversation.participant.displayName || activeConversation.participant.handle}
                  seed={activeConversation.participant.id}
                  theme={theme}
                />
                <View>
                  <Text style={styles.sectionTitle}>
                    {activeConversation.participant.displayName || activeConversation.participant.handle}
                  </Text>
                  <Text style={styles.searchHandle}>@{activeConversation.participant.handle}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.messagesWrap}>
                {activeMessages.length > 0 ? (
                  activeMessages.map((message) => {
                    const isMine = String(message.senderId || '') === currentUserId;
                    return (
                      <View
                        key={message.id || `${message.senderId}:${message.createdAt}`}
                        style={[styles.messageRow, isMine && styles.messageRowMine]}
                      >
                        <View style={[styles.messageBubble, isMine && styles.messageBubbleMine]}>
                          <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                            {message.content || '...'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>{copy.noMessages}</Text>
                )}
              </View>

              <View style={styles.composerRow}>
                <TextInput
                  value={composer}
                  onChangeText={setComposer}
                  placeholder={copy.typeMessage}
                  placeholderTextColor={theme.text20}
                  style={styles.composerInput}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                  <Text style={styles.sendBtnText}>{copy.send}</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    section: { paddingHorizontal: 24, paddingBottom: 20 },
    sectionTitle: {
      color: theme.text,
      fontSize: 18 * theme.scale,
      fontWeight: '700',
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    searchInput: {
      height: 46,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      paddingHorizontal: 14,
      color: theme.text,
      marginBottom: 12,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      marginBottom: 10,
    },
    searchMeta: { flex: 1, minWidth: 0 },
    searchName: { color: theme.text, fontSize: 14 * theme.scale, fontWeight: '600' },
    searchHandle: { color: theme.text30, fontSize: 12 * theme.scale, marginTop: 2 },
    inlineButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
    },
    inlineButtonText: { color: theme.accent, fontSize: 12 * theme.scale, fontWeight: '700' },
    conversationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      marginBottom: 10,
    },
    conversationCardActive: {
      borderColor: theme.accentBorder,
      backgroundColor: theme.glassStrong,
    },
    conversationInfo: { flex: 1, minWidth: 0 },
    unreadBadge: {
      minWidth: 24,
      height: 24,
      paddingHorizontal: 6,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    unreadBadgeText: {
      color: theme.onAccent,
      fontWeight: '700',
      fontSize: 11 * theme.scale,
    },
    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      padding: 16,
      borderRadius: radius.md,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    emptyText: { color: theme.text30, fontSize: 13 * theme.scale },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    messagesWrap: {
      borderRadius: radius.lg,
      padding: 14,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      gap: 10,
    },
    messageRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    messageRowMine: {
      justifyContent: 'flex-end',
    },
    messageBubble: {
      maxWidth: '82%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: theme.text08,
    },
    messageBubbleMine: {
      backgroundColor: theme.accent,
    },
    messageText: {
      color: theme.text,
      fontSize: 14 * theme.scale,
      lineHeight: 20 * theme.scale,
    },
    messageTextMine: {
      color: theme.onAccent,
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 14,
    },
    composerInput: {
      flex: 1,
      height: 46,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      paddingHorizontal: 16,
      color: theme.text,
    },
    sendBtn: {
      paddingHorizontal: 16,
      height: 46,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    sendBtnText: {
      color: theme.onAccent,
      fontWeight: '700',
      fontSize: 13 * theme.scale,
    },
  });
}
