import client from './client';

export const roomsApi = {
  getRooms: () =>
    client.get('/api/v3/rooms'),
};

export const friendsApi = {
  getFriends: () =>
    client.get('/api/v3/friends/'),

  getRequests: () =>
    client.get('/api/v3/friends/requests'),

  getStatus: (userId) =>
    client.get(`/api/v3/friends/status/${userId}`),

  sendRequest: (userId) =>
    client.post('/api/v3/friends/request', { userId }),

  acceptRequest: (id) =>
    client.post(`/api/v3/friends/accept/${id}`),

  declineRequest: (id) =>
    client.post(`/api/v3/friends/decline/${id}`),

  removeFriend: (id) =>
    client.delete(`/api/v3/friends/${id}`),

  getPresence: () =>
    client.get('/api/v3/friends/presence'),
};

export const messengerApi = {
  getConversations: () =>
    client.get('/api/v3/messenger/conversations'),

  createConversation: (participantId) =>
    client.post('/api/v3/messenger/conversations', { participantId }),

  getMessages: (conversationId, before) =>
    client.get(`/api/v3/messenger/conversations/${conversationId}/messages`, {
      params: before ? { before, limit: 50 } : { limit: 50 },
    }),

  markRead: (conversationId) =>
    client.post(`/api/v3/messenger/conversations/${conversationId}/read`, {}),

  deleteConversation: (conversationId) =>
    client.delete(`/api/v3/messenger/conversations/${conversationId}`),

  searchUsers: (query) =>
    client.get('/api/v3/messenger/search-users', {
      params: { q: query },
    }),

  createWsTicket: () =>
    client.post('/api/v3/messenger/ws-ticket', {}),
};
