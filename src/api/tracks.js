import client from './client';

export const tracksApi = {
  // User saved tracks
  getTracks: () =>
    client.get('/api/v3/tracks/'),

  saveTrack: (track) =>
    client.post('/api/v3/tracks/', track),

  deleteTrack: (key) =>
    client.delete(`/api/v3/tracks/${key}`),

  // Recent tracks
  getRecentTracks: () =>
    client.get('/api/v3/recent-tracks'),

  saveRecentTracks: (tracks) =>
    client.put('/api/v3/recent-tracks', { tracks }),

  // Record a play event
  recordPlay: (trackKey, source, durationMs) =>
    client.post('/api/v3/plays', { track_key: trackKey, source, duration_ms: durationMs }),

  // Top tracks (public)
  getTopTracks: () =>
    client.get('/api/v3/top-tracks'),

  // Trending searches (public)
  getTrendingSearches: () =>
    client.get('/api/v3/search/trending'),
};
