import { create } from 'zustand';
import { API_BASE } from '../config';
import { friendsApi, messengerApi, roomsApi } from '../api/community';
import { normalizeTrack } from '../utils/media';
import usePlayerStore from './playerStore';

let socket = null;
let reconnectTimer = null;
let roomPollTimer = null;
let activeUserId = null;

function getUserId(user) {
  return String(user?.uid || user?.id || '');
}

function getWsBase() {
  return String(API_BASE || '').replace(/^http/i, 'ws');
}

function mapArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.friends)) return payload.friends;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.rooms)) return payload.rooms;
  return [];
}

function normalizeConversation(conversation) {
  const participant = conversation?.participant || {};
  return {
    id: String(conversation?.id || ''),
    participant: {
      id: String(participant?.id || ''),
      handle: participant?.handle || '',
      displayName: participant?.displayName || participant?.handle || 'User',
      avatarUrl: participant?.avatarUrl || '',
      isOnline: Boolean(participant?.isOnline),
    },
    lastMessage: conversation?.lastMessage || null,
    unreadCount: Number(conversation?.unreadCount || 0) || 0,
    updatedAt: Number(conversation?.updatedAt || Date.now()) || Date.now(),
    peerLastReadAt: Number(conversation?.peerLastReadAt || 0) || 0,
  };
}

function normalizeRoomTrack(roomTrack) {
  if (!roomTrack) return null;

  return normalizeTrack({
    id: roomTrack.trackId,
    title: roomTrack.title,
    artist: roomTrack.artist,
    artworkUrl: roomTrack.artworkUrl,
    durationMs: roomTrack.duration ? Number(roomTrack.duration) * 1000 : 0,
    platform: roomTrack.platform || 'yandex',
  }, {
    source: roomTrack.platform || 'yandex',
  });
}

function toRoomTrack(track) {
  if (!track) return null;

  return {
    platform: track.source || 'yandex',
    trackId: String(track.id || ''),
    title: track.title || 'Unknown track',
    artist: track.artist || 'Unknown artist',
    artworkUrl: track.coverUrl || '',
    duration: Math.max(0, Math.round(Number(track.durationMs || 0) / 1000)),
  };
}

function applyIncomingRoomState(room, currentUserId) {
  const player = usePlayerStore.getState();
  const incomingTrack = normalizeRoomTrack(room?.track);

  if (!incomingTrack || room?.hostId === currentUserId) return;

  const current = player.currentTrack;
  const sameTrack =
    current &&
    String(current.id) === String(incomingTrack.id) &&
    String(current.source || 'yandex') === String(incomingTrack.source || 'yandex');

  const syncPlayback = async () => {
    const targetMs = Math.max(0, Number(room?.trackTime || 0) * 1000);

    if (!sameTrack) {
      await player.playTrack(incomingTrack, [incomingTrack], 0);
    }

    await player.seekTo(targetMs);

    if (room?.isPlaying) {
      if (!usePlayerStore.getState().isPlaying) {
        await usePlayerStore.getState().togglePlay();
      }
    } else if (usePlayerStore.getState().isPlaying) {
      await usePlayerStore.getState().togglePlay();
    }
  };

  syncPlayback().catch(() => {});
}

function clearSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (roomPollTimer) {
    clearInterval(roomPollTimer);
    roomPollTimer = null;
  }
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
    socket = null;
  }
}

const useSocialStore = create((set, get) => ({
  initializedFor: null,
  wsConnected: false,
  friends: [],
  friendRequests: [],
  presence: [],
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  availableRooms: [],
  room: null,
  roomMessages: [],
  roomError: '',
  bootstrapLoading: false,
  roomsLoading: false,
  conversationsLoading: false,
  pendingRoomTrack: null,

  reset: () => {
    activeUserId = null;
    clearSocket();
    set({
      initializedFor: null,
      wsConnected: false,
      friends: [],
      friendRequests: [],
      presence: [],
      conversations: [],
      activeConversationId: null,
      messagesByConversation: {},
      availableRooms: [],
      room: null,
      roomMessages: [],
      roomError: '',
      bootstrapLoading: false,
      roomsLoading: false,
      conversationsLoading: false,
      pendingRoomTrack: null,
    });
  },

  init: async (user) => {
    const userId = getUserId(user);
    if (!userId) {
      get().reset();
      return;
    }

    if (get().initializedFor === userId) return;

    activeUserId = userId;
    clearSocket();
    set({ initializedFor: userId, bootstrapLoading: true, roomMessages: [], roomError: '' });

    await Promise.allSettled([
      get().loadFriends(),
      get().loadFriendRequests(),
      get().loadPresence(),
      get().loadConversations(),
      get().loadAvailableRooms(),
    ]);

    set({ bootstrapLoading: false });
    get().connectWs();

    roomPollTimer = setInterval(() => {
      get().loadAvailableRooms();
    }, 15000);
  },

  loadFriends: async () => {
    try {
      const { data } = await friendsApi.getFriends();
      set({ friends: mapArray(data) });
    } catch {
      set({ friends: [] });
    }
  },

  loadFriendRequests: async () => {
    try {
      const { data } = await friendsApi.getRequests();
      set({ friendRequests: mapArray(data) });
    } catch {
      set({ friendRequests: [] });
    }
  },

  loadPresence: async () => {
    try {
      const { data } = await friendsApi.getPresence();
      set({ presence: mapArray(data) });
    } catch {
      set({ presence: [] });
    }
  },

  loadConversations: async () => {
    set({ conversationsLoading: true });
    try {
      const { data } = await messengerApi.getConversations();
      set({
        conversations: mapArray(data)
          .map(normalizeConversation)
          .sort((first, second) => Number(second.updatedAt || 0) - Number(first.updatedAt || 0)),
      });
    } finally {
      set({ conversationsLoading: false });
    }
  },

  loadConversationMessages: async (conversationId, before) => {
    if (!conversationId) return [];

    try {
      const { data } = await messengerApi.getMessages(conversationId, before);
      const messages = mapArray(data);

      set((state) => {
        const existing = state.messagesByConversation[conversationId] || [];
        const nextMessages = before ? [...messages, ...existing] : messages;
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: nextMessages,
          },
        };
      });

      return messages;
    } catch {
      return [];
    }
  },

  openConversation: async (conversationId) => {
    if (!conversationId) return;

    set({ activeConversationId: conversationId });
    await get().loadConversationMessages(conversationId);
    await get().markConversationRead(conversationId);
  },

  createConversation: async (participantId) => {
    const { data } = await messengerApi.createConversation(participantId);
    const conversationId = data?.id;

    await get().loadConversations();
    if (conversationId) {
      await get().openConversation(conversationId);
    }

    return conversationId;
  },

  searchUsers: async (query) => {
    if (!query || query.trim().length < 2) return [];

    try {
      const { data } = await messengerApi.searchUsers(query.trim());
      return mapArray(data);
    } catch {
      return [];
    }
  },

  markConversationRead: async (conversationId) => {
    if (!conversationId) return;

    try {
      await messengerApi.markRead(conversationId);
    } catch {
      // ignore read sync errors
    }

    set((state) => ({
      conversations: state.conversations.map((conversation) => (
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )),
    }));

    get().sendWs({ type: 'read', conversationId });
  },

  sendMessage: (conversationId, content) => {
    if (!conversationId || !content?.trim()) return;
    get().sendWs({
      type: 'send_message',
      conversationId,
      content: content.trim(),
    });
  },

  deleteConversation: async (conversationId) => {
    if (!conversationId) return;
    try {
      await messengerApi.deleteConversation(conversationId);
    } catch {
      // ignore delete errors
    }

    set((state) => {
      const nextMessages = { ...state.messagesByConversation };
      delete nextMessages[conversationId];
      return {
        conversations: state.conversations.filter((conversation) => conversation.id !== conversationId),
        activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
        messagesByConversation: nextMessages,
      };
    });
  },

  removeConversationLocal: (conversationId) => {
    if (!conversationId) return;

    set((state) => {
      const nextMessages = { ...state.messagesByConversation };
      delete nextMessages[conversationId];
      return {
        conversations: state.conversations.filter((conversation) => conversation.id !== conversationId),
        activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
        messagesByConversation: nextMessages,
      };
    });
  },

  loadAvailableRooms: async () => {
    set({ roomsLoading: true });
    try {
      const { data } = await roomsApi.getRooms();
      set({ availableRooms: mapArray(data) });
    } catch {
      set({ availableRooms: [] });
    } finally {
      set({ roomsLoading: false });
    }
  },

  createRoom: (name, options = {}) => {
    if (!name?.trim()) return;
    get().sendWs({
      type: 'room_create',
      roomName: name.trim(),
      maxMembers: Number(options.maxMembers || 10) || 10,
      isPrivate: Boolean(options.isPrivate),
    });
  },

  createRoomFromTrack: (track, options = {}) => {
    set({ pendingRoomTrack: toRoomTrack(track) });
    get().createRoom(options.name || `Radio ${track?.artist || ''}`.trim(), options);
  },

  joinRoom: (roomId) => {
    if (!roomId) return;
    get().sendWs({ type: 'room_join', roomId });
  },

  leaveRoom: () => {
    get().sendWs({ type: 'room_leave' });
    set({ room: null, roomMessages: [], roomError: '' });
  },

  sendRoomChat: (content) => {
    if (!content?.trim()) return;
    get().sendWs({ type: 'room_chat', content: content.trim() });
  },

  setRoomTrackFromPlayer: () => {
    const currentTrack = usePlayerStore.getState().currentTrack;
    const roomTrack = toRoomTrack(currentTrack);
    if (!roomTrack) return;
    get().sendWs({ type: 'room_track', track: roomTrack });
  },

  roomPlayFromPlayer: () => {
    const player = usePlayerStore.getState();
    get().sendWs({
      type: 'room_play',
      trackTime: Math.round(Number(player.position || 0) / 1000),
    });
  },

  roomPauseFromPlayer: () => {
    const player = usePlayerStore.getState();
    get().sendWs({
      type: 'room_pause',
      trackTime: Math.round(Number(player.position || 0) / 1000),
    });
  },

  roomSeekFromPlayer: () => {
    const player = usePlayerStore.getState();
    get().sendWs({
      type: 'room_seek',
      trackTime: Math.round(Number(player.position || 0) / 1000),
    });
  },

  sendWs: (payload) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  },

  handleRoomMessage: (message) => {
    const currentUserId = activeUserId;

    switch (message.type) {
      case 'room_created': {
        const pendingRoomTrack = get().pendingRoomTrack;
        set({
          room: message.room || null,
          roomMessages: [],
          roomError: '',
          pendingRoomTrack: null,
        });
        get().loadAvailableRooms();
        if (pendingRoomTrack) {
          get().sendWs({ type: 'room_track', track: pendingRoomTrack });
        }
        break;
      }

      case 'room_state': {
        set({ room: message.room || null, roomError: '' });
        get().loadAvailableRooms();
        applyIncomingRoomState(message.room, currentUserId);
        break;
      }

      case 'room_joined':
      case 'room_left':
      case 'room_host_changed': {
        get().loadAvailableRooms();
        break;
      }

      case 'room_track': {
        set((state) => ({
          room: state.room
            ? {
              ...state.room,
              track: message.track || null,
              trackTime: 0,
              isPlaying: false,
            }
            : state.room,
        }));
        applyIncomingRoomState({
          ...get().room,
          track: message.track,
          isPlaying: false,
          trackTime: 0,
        }, currentUserId);
        break;
      }

      case 'room_play': {
        if (get().room?.hostId !== currentUserId) {
          const player = usePlayerStore.getState();
          player.seekTo(Number(message.trackTime || 0) * 1000);
          if (!player.isPlaying) {
            player.togglePlay().catch(() => {});
          }
        }
        set((state) => ({
          room: state.room ? { ...state.room, isPlaying: true, trackTime: Number(message.trackTime || 0) } : state.room,
        }));
        break;
      }

      case 'room_pause': {
        if (get().room?.hostId !== currentUserId) {
          const player = usePlayerStore.getState();
          player.seekTo(Number(message.trackTime || 0) * 1000);
          if (player.isPlaying) {
            player.togglePlay().catch(() => {});
          }
        }
        set((state) => ({
          room: state.room ? { ...state.room, isPlaying: false, trackTime: Number(message.trackTime || 0) } : state.room,
        }));
        break;
      }

      case 'room_seek': {
        if (get().room?.hostId !== currentUserId) {
          usePlayerStore.getState().seekTo(Number(message.trackTime || 0) * 1000);
        }
        set((state) => ({
          room: state.room ? { ...state.room, trackTime: Number(message.trackTime || 0) } : state.room,
        }));
        break;
      }

      case 'room_chat': {
        const nextMessage = {
          msgId: message.msgId || `${message.senderId || 'user'}:${message.timestamp || Date.now()}`,
          senderId: message.senderId || '',
          senderName: message.senderName || 'User',
          content: message.content || '',
          timestamp: Number(message.timestamp || Date.now()),
          msgType: 'chat',
        };
        set((state) => ({
          roomMessages: [...state.roomMessages, nextMessage].slice(-200),
        }));
        break;
      }

      case 'room_error': {
        set({ roomError: message.error || 'Room error' });
        break;
      }

      default:
        break;
    }
  },

  handleMessengerMessage: (message) => {
    switch (message.type) {
      case 'new_message': {
        const nextMessage = message.message;
        if (!nextMessage?.conversationId) break;

        if (!get().conversations.some((conversation) => conversation.id === nextMessage.conversationId)) {
          get().loadConversations();
        }

        set((state) => {
          const conversationId = nextMessage.conversationId;
          const existing = state.messagesByConversation[conversationId] || [];
          const alreadyExists = existing.some((item) => String(item.id) === String(nextMessage.id));
          const nextMessages = alreadyExists ? existing : [...existing, nextMessage];

          const nextConversations = state.conversations
            .map((conversation) => (
              conversation.id === conversationId
                ? {
                  ...conversation,
                  lastMessage: nextMessage,
                  updatedAt: Number(nextMessage.createdAt || Date.now()),
                  unreadCount:
                    state.activeConversationId === conversationId
                      ? 0
                      : Number(conversation.unreadCount || 0) + 1,
                }
                : conversation
            ))
            .sort((first, second) => Number(second.updatedAt || 0) - Number(first.updatedAt || 0));

          return {
            conversations: nextConversations,
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: nextMessages,
            },
          };
        });
        break;
      }

      case 'read': {
        if (!message.conversationId) break;
        set((state) => ({
          conversations: state.conversations.map((conversation) => (
            conversation.id === message.conversationId
              ? { ...conversation, peerLastReadAt: Number(message.timestamp || Date.now()) }
              : conversation
          )),
        }));
        break;
      }

      case 'conversation_deleted': {
        if (!message.conversationId) break;
        get().removeConversationLocal(message.conversationId);
        break;
      }

      default:
        break;
    }
  },

  connectWs: async () => {
    if (!activeUserId) return;

    try {
      const { data } = await messengerApi.createWsTicket();
      const ticket = data?.ticket;
      if (!ticket) return;

      clearSocket();

      socket = new WebSocket(`${getWsBase()}/api/v3/ws/chat?ticket=${encodeURIComponent(ticket)}`);

      socket.onopen = () => {
        set({ wsConnected: true, roomError: '' });
      };

      socket.onclose = () => {
        set({ wsConnected: false });
        socket = null;

        if (!activeUserId) return;
        reconnectTimer = setTimeout(() => {
          get().connectWs();
        }, 2000);
      };

      socket.onerror = () => {
        set({ wsConnected: false });
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (String(message?.type || '').startsWith('room_')) {
            get().handleRoomMessage(message);
            return;
          }

          if (String(message?.type || '').startsWith('friend_')) {
            get().loadFriends();
            get().loadFriendRequests();
            return;
          }

          if (message?.type === 'presence_update') {
            get().loadPresence();
            return;
          }

          get().handleMessengerMessage(message);
        } catch {
          // ignore malformed ws payloads
        }
      };
    } catch {
      set({ wsConnected: false });
    }
  },

  sendFriendRequest: async (userId) => {
    await friendsApi.sendRequest(userId);
    await get().loadFriendRequests();
  },

  acceptFriendRequest: async (id) => {
    await friendsApi.acceptRequest(id);
    await Promise.all([get().loadFriends(), get().loadFriendRequests()]);
  },

  declineFriendRequest: async (id) => {
    await friendsApi.declineRequest(id);
    await get().loadFriendRequests();
  },

  removeFriend: async (id) => {
    await friendsApi.removeFriend(id);
    await get().loadFriends();
  },

  getFriendshipStatus: async (userId) => {
    try {
      const { data } = await friendsApi.getStatus(userId);
      return data;
    } catch {
      return { status: 'none' };
    }
  },
}));

export default useSocialStore;
