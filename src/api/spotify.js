import client from './client';

export const spotifyApi = {
  getChart: () =>
    client.get('/api/v3/spotify/chart'),

  getTopArtists: () =>
    client.get('/api/v3/spotify/top-artists'),

  search: (query, type) =>
    client.get('/api/v3/spotify/search', { params: { q: query, type } }),

  getArtist: (id) =>
    client.get(`/api/v3/spotify/artists/${id}`),

  getArtistTopTracks: (id) =>
    client.get(`/api/v3/spotify/artists/${id}/top-tracks`),

  getArtistAlbums: (id) =>
    client.get(`/api/v3/spotify/artists/${id}/albums`),

  getAlbumTracks: (id) =>
    client.get(`/api/v3/spotify/albums/${id}`),

  getTrack: (id) =>
    client.get(`/api/v3/spotify/tracks/${id}`),

  getToken: () =>
    client.get('/api/v3/spotify/token'),
};
