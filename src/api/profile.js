import client from './client';

export const profileApi = {
  getMe: () =>
    client.get('/api/v3/profile/me'),

  updateMe: (data) =>
    client.put('/api/v3/profile/me', data),

  updateHandle: (handle) =>
    client.put('/api/v3/profile/handle', { handle }),

  getPublicProfile: (handle) =>
    client.get(`/api/v3/profiles/${handle}`),

  getPublicProfileById: (id) =>
    client.get(`/api/v3/profile/by-id/${id}`),

  uploadAvatar: (formData) =>
    client.post('/api/v3/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAvatar: () =>
    client.delete('/api/v3/profile/avatar'),

  getMyStats: () =>
    client.get('/api/v3/stats/me'),

  getUserStats: (id) =>
    client.get(`/api/v3/stats/user/${id}`),
};

export const artistsApi = {
  getArtists: () =>
    client.get('/api/v3/artists/'),

  trackArtist: (artist) =>
    client.post('/api/v3/artists/', artist),

  untrackArtist: (key) =>
    client.delete(`/api/v3/artists/${key}`),
};

export const collectionsApi = {
  getCollections: () =>
    client.get('/api/v3/collections/'),

  saveCollection: (collection) =>
    client.post('/api/v3/collections/', collection),

  deleteCollection: (key) =>
    client.delete(`/api/v3/collections/${key}`),
};

export const waveApi = {
  getWave: () =>
    client.get('/api/v3/wave/'),

  getRecommendations: () =>
    client.get('/api/v3/wave/recommendations'),

  postEvent: (event) =>
    client.post('/api/v3/wave/event', event),

  seedWave: (tracks) =>
    client.post('/api/v3/wave/seed', { tracks }),
};
