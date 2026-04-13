import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import usePlayerStore from '../store/playerStore';
import useAuthStore from '../store/authStore';
import { playlistsApi } from '../api/playlists';
import { pickGradient } from '../utils/media';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';
import BottomSheet from './BottomSheet';

function getTrackKey(track) {
  return track?.key || track?.yandexKey || `${track?.source || 'yandex'}:${track?.id}`;
}

function toArtistPayload(track) {
  return {
    id: track?.artistId || track?.id || track?.artist || 'artist',
    name: track?.artist || 'Artist',
    gradients: track?.artGradient || pickGradient(track?.artist || track?.title || 'artist'),
    coverUrl: track?.coverUrl || null,
  };
}

function normalizePlaylists(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  return payload.playlists || payload.results || payload.items || payload.data?.playlists || [];
}

function ActionRow({ icon, label, onPress, theme, danger = false }) {
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? theme.error : theme.accentMuted} />
      </View>
      <Text style={[styles.actionLabel, danger && { color: theme.error }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.text20} />
    </TouchableOpacity>
  );
}

export default function TrackOptionsSheet({
  visible,
  onClose,
  track,
  initialMode = 'menu',
}) {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { language } = useI18n();
  const styles = createStyles(theme);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { addToQueue, playTrack } = usePlayerStore();
  const [mode, setMode] = useState(initialMode);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const copy = useMemo(() => (
    language === 'ru'
      ? {
        title: 'Действия с треком',
        subtitle: 'Быстрые действия без переходов по лишним экранам.',
        playNow: 'Слушать сейчас',
        queue: 'Добавить в очередь',
        artist: 'Открыть артиста',
        playlist: 'Добавить в плейлист',
        playlists: 'Плейлисты',
        playlistsHint: 'Выберите, куда добавить текущий трек.',
        createPlaylist: 'Новый плейлист',
        createPlaylistHint: 'Создайте плейлист и сразу положите в него трек.',
        playlistName: 'Название плейлиста',
        playlistPlaceholder: 'Например, Ночной драйв',
        createAndAdd: 'Создать и добавить',
        add: 'Добавить',
        back: 'Назад',
        authNeeded: 'Для работы с плейлистами сначала войдите в аккаунт.',
        empty: 'Плейлистов пока нет.',
        loadError: 'Не удалось загрузить плейлисты.',
      }
      : {
        title: 'Track actions',
        subtitle: 'Quick actions without leaving the current screen.',
        playNow: 'Play now',
        queue: 'Add to queue',
        artist: 'Open artist',
        playlist: 'Add to playlist',
        playlists: 'Playlists',
        playlistsHint: 'Choose where to save the current track.',
        createPlaylist: 'New playlist',
        createPlaylistHint: 'Create a playlist and add this track right away.',
        playlistName: 'Playlist name',
        playlistPlaceholder: 'For example, Night drive',
        createAndAdd: 'Create and add',
        add: 'Add',
        back: 'Back',
        authNeeded: 'Sign in first to work with playlists.',
        empty: 'No playlists yet.',
        loadError: 'Could not load playlists.',
      }
  ), [language]);

  useEffect(() => {
    if (!visible) return;
    setMode(initialMode);
    setNewPlaylistName('');
    setError('');
  }, [initialMode, visible]);

  const closeAndReset = () => {
    setMode(initialMode);
    setError('');
    setSubmitting(false);
    setLoading(false);
    onClose();
  };

  const handlePlayNow = async () => {
    if (!track) return;
    const started = await playTrack(track, [track], 0);
    closeAndReset();
    if (started) {
      navigation.navigate('Player');
    }
  };

  const handleAddToQueue = () => {
    if (!track) return;
    addToQueue(track);
    closeAndReset();
  };

  const handleOpenArtist = () => {
    if (!track) return;
    closeAndReset();
    navigation.navigate('ArtistDetail', { artist: toArtistPayload(track) });
  };

  const loadPlaylists = async () => {
    if (!isAuthenticated) {
      setError(copy.authNeeded);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await playlistsApi.getPlaylists();
      setPlaylists(normalizePlaylists(response.data));
    } catch {
      setError(copy.loadError);
    } finally {
      setLoading(false);
    }
  };

  const openPlaylistMode = async () => {
    setMode('playlist');
    await loadPlaylists();
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!track || !playlistId) return;

    setSubmitting(true);
    setError('');
    try {
      await playlistsApi.addTrack(playlistId, getTrackKey(track));
      closeAndReset();
    } catch {
      setError(copy.loadError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePlaylist = async () => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) {
      setError(copy.playlistPlaceholder);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await playlistsApi.createPlaylist(trimmed, '');
      const created =
        response.data?.playlist ||
        response.data?.data?.playlist ||
        response.data?.data ||
        response.data;
      const playlistId = created?.id || created?.uuid || created?.slug;

      if (playlistId) {
        await playlistsApi.addTrack(playlistId, getTrackKey(track));
      }

      closeAndReset();
    } catch {
      setError(copy.loadError);
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle = mode === 'menu'
    ? copy.subtitle
    : mode === 'playlist'
      ? copy.playlistsHint
      : copy.createPlaylistHint;

  return (
    <BottomSheet
      visible={visible}
      onClose={closeAndReset}
      title={copy.title}
      subtitle={subtitle}
    >
      {mode === 'menu' && (
        <View style={styles.actions}>
          <ActionRow icon="play-circle-outline" label={copy.playNow} onPress={handlePlayNow} theme={theme} />
          <ActionRow icon="layers-outline" label={copy.queue} onPress={handleAddToQueue} theme={theme} />
          <ActionRow icon="musical-notes-outline" label={copy.playlist} onPress={openPlaylistMode} theme={theme} />
          <ActionRow icon="person-outline" label={copy.artist} onPress={handleOpenArtist} theme={theme} />
        </View>
      )}

      {mode === 'playlist' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.backRow} onPress={() => setMode('menu')} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={16} color={theme.text40} />
            <Text style={styles.backText}>{copy.back}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.createRow} onPress={() => setMode('create')} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={18} color={theme.accentMuted} />
            <Text style={styles.createText}>{copy.createPlaylist}</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator color={theme.accentMuted} style={{ marginVertical: 14 }} />
          ) : playlists.length > 0 ? (
            playlists.map((playlist, index) => (
              <TouchableOpacity
                key={`${playlist.id || playlist.uuid || playlist.slug || index}`}
                style={styles.playlistRow}
                onPress={() => handleAddToPlaylist(playlist.id || playlist.uuid || playlist.slug)}
                activeOpacity={0.8}
                disabled={submitting}
              >
                <View style={styles.playlistBadge}>
                  <Ionicons name="list-outline" size={16} color={theme.accentMuted} />
                </View>
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>{playlist.name || playlist.title}</Text>
                  {!!playlist.description && (
                    <Text style={styles.playlistMeta} numberOfLines={1}>{playlist.description}</Text>
                  )}
                </View>
                <Text style={styles.addLabel}>{copy.add}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>{error || copy.empty}</Text>
          )}
        </View>
      )}

      {mode === 'create' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.backRow} onPress={() => setMode('playlist')} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={16} color={theme.text40} />
            <Text style={styles.backText}>{copy.back}</Text>
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <Ionicons name="disc-outline" size={16} color={theme.text30} />
            <TextInput
              style={styles.input}
              placeholder={copy.playlistName}
              placeholderTextColor={theme.text20}
              value={newPlaylistName}
              onChangeText={(value) => {
                setNewPlaylistName(value);
                if (error) setError('');
              }}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleCreatePlaylist}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={theme.onAccent} />
              : <Text style={styles.submitBtnText}>{copy.createAndAdd}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {!!error && mode !== 'playlist' && <Text style={styles.errorText}>{error}</Text>}
    </BottomSheet>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    actions: {
      gap: 10,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 10,
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    actionIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    actionIconDanger: {
      backgroundColor: `${theme.error}18`,
    },
    actionLabel: {
      flex: 1,
      fontSize: 14 * theme.scale,
      fontWeight: '600',
      color: theme.text,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    },
    backText: {
      fontSize: 12 * theme.scale,
      color: theme.text40,
      fontWeight: '600',
    },
    createRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    createText: {
      fontSize: 14 * theme.scale,
      fontWeight: '600',
      color: theme.text,
    },
    playlistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    playlistBadge: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playlistInfo: {
      flex: 1,
      minWidth: 0,
    },
    playlistName: {
      fontSize: 14 * theme.scale,
      fontWeight: '600',
      color: theme.text,
    },
    playlistMeta: {
      fontSize: 11 * theme.scale,
      color: theme.text30,
      marginTop: 2,
    },
    addLabel: {
      fontSize: 12 * theme.scale,
      fontWeight: '700',
      color: theme.accentMuted,
    },
    emptyText: {
      paddingHorizontal: 4,
      paddingVertical: 8,
      fontSize: 13 * theme.scale,
      color: theme.text30,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 14,
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    input: {
      flex: 1,
      fontSize: 15 * theme.scale,
      color: theme.text,
    },
    submitBtn: {
      marginTop: 4,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      backgroundColor: theme.accent,
      borderRadius: radius.md,
    },
    submitBtnDisabled: {
      opacity: 0.72,
    },
    submitBtnText: {
      fontSize: 14 * theme.scale,
      fontWeight: '700',
      color: theme.onAccent,
    },
    errorText: {
      fontSize: 12 * theme.scale,
      color: theme.error,
      paddingHorizontal: 6,
    },
  });
}
