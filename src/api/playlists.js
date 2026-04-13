import client from './client';

export const playlistsApi = {
  // User playlists
  getPlaylists: () =>
    client.get('/api/v3/playlists/'),

  createPlaylist: (name, description) =>
    client.post('/api/v3/playlists/', { name, description }),

  getPlaylist: (id) =>
    client.get(`/api/v3/playlists/${id}`),

  updatePlaylist: (id, data) =>
    client.put(`/api/v3/playlists/${id}`, data),

  deletePlaylist: (id) =>
    client.delete(`/api/v3/playlists/${id}`),

  addTrack: (id, trackKey) =>
    client.post(`/api/v3/playlists/${id}/tracks`, { track_key: trackKey }),

  removeTrack: (id, trackKey) =>
    client.delete(`/api/v3/playlists/${id}/tracks/${trackKey}`),

  uploadCover: (id, formData) =>
    client.post(`/api/v3/playlists/${id}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  importUrl: (url) =>
    client.post('/api/v3/playlists/import-url', { url }),

  getImportProgress: (jobId) =>
    client.get(`/api/v3/playlists/import-progress/${jobId}`),
};

export const communityApi = {
  getPlaylists: (params) =>
    client.get('/api/v3/community/playlists/', { params }),

  getPlaylist: (id) =>
    client.get(`/api/v3/community/playlists/${id}`),

  publishPlaylist: (data) =>
    client.post('/api/v3/community/playlists/', data),

  likePlaylist: (id) =>
    client.post(`/api/v3/community/playlists/${id}/like`),

  unlikePlaylist: (id) =>
    client.delete(`/api/v3/community/playlists/${id}/like`),

  savePlaylist: (id) =>
    client.post(`/api/v3/community/playlists/${id}/save`),

  unsavePlaylist: (id) =>
    client.delete(`/api/v3/community/playlists/${id}/save`),

  getComments: (id) =>
    client.get(`/api/v3/community/playlists/${id}/comments`),

  addComment: (id, text) =>
    client.post(`/api/v3/community/playlists/${id}/comments`, { text }),

  deleteComment: (id, commentId) =>
    client.delete(`/api/v3/community/playlists/${id}/comments/${commentId}`),
};
