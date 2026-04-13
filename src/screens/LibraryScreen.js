import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TrackItem from '../components/TrackItem';
import SectionHeader from '../components/SectionHeader';
import Pill from '../components/Pill';
import MiniPlayer from '../components/MiniPlayer';
import BottomSheet from '../components/BottomSheet';
import TrackOptionsSheet from '../components/TrackOptionsSheet';
import usePlayerStore from '../store/playerStore';
import useAuthStore from '../store/authStore';
import { tracksApi } from '../api/tracks';
import { playlistsApi } from '../api/playlists';
import {
  extractResults,
  normalizePlaylist as mapPlaylist,
  normalizeTrack as mapTrack,
} from '../utils/media';
import { radius, useAppTheme } from '../theme';
import { useI18n } from '../i18n';

const FILTER_KEYS = ['all', 'playlists', 'tracks'];

function normalizeSavedTrack(track) {
  const normalized = mapTrack(track, { source: track.source || 'yandex' });
  return { ...normalized, key: track.key || normalized.key };
}

function normalizeSavedPlaylist(playlist) {
  return mapPlaylist(playlist);
}

export default function LibraryScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings, language } = useI18n();
  const styles = createStyles(theme);
  const importLabel = strings.library.import || (language === 'ru' ? 'Импорт' : 'Import');
  const createLabel = strings.library.create || (language === 'ru' ? 'Создать' : 'Create');
  const createPlaceholder = strings.library.createPlaceholder || (language === 'ru' ? 'Название плейлиста' : 'Playlist name');
  const importPlaceholder = strings.library.importPlaceholder || (language === 'ru' ? 'Ссылка на плейлист' : 'Playlist URL');
  const createdMessage = strings.library.createdMessage || (language === 'ru' ? 'Плейлист создан.' : 'Playlist created.');
  const importedMessage = strings.library.importedMessage || (language === 'ru' ? 'Импорт запущен, обновляю библиотеку.' : 'Import started, refreshing your library.');
  const actionError = strings.library.actionError || (language === 'ru' ? 'Не удалось завершить действие.' : 'The action could not be completed.');
  const importFailed = strings.library.importFailed || (language === 'ru' ? 'Импорт плейлиста не удался.' : 'Playlist import failed.');
  const importPending = strings.library.importPending || (language === 'ru' ? 'Импорт занял слишком много времени.' : 'Playlist import took too long to finish.');
  const [filter, setFilter] = useState('all');
  const [savedTracks, setSavedTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuTrack, setMenuTrack] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState('create');
  const [playlistName, setPlaylistName] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [sheetError, setSheetError] = useState('');
  const [sheetMessage, setSheetMessage] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    if (!isAuthenticated) {
      setSavedTracks([]);
      setPlaylists([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [tracksRes, playlistsRes] = await Promise.all([
        tracksApi.getTracks().catch(() => ({ data: [] })),
        playlistsApi.getPlaylists().catch(() => ({ data: [] })),
      ]);

      const tracksList = extractResults(tracksRes.data, ['tracks']);
      const playlistsList = extractResults(playlistsRes.data, ['playlists']);

      setSavedTracks(tracksList.map(normalizeSavedTrack));
      setPlaylists(playlistsList.map(normalizeSavedPlaylist));
    } catch {
      // Keep guest-friendly empty state on request errors.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const openPlaylistSheet = (mode = 'create') => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    setSheetMode(mode);
    setSheetVisible(true);
    setSheetError('');
    setSheetMessage('');
  };

  const closePlaylistSheet = () => {
    setSheetVisible(false);
    setSheetError('');
    setSheetMessage('');
    setSheetLoading(false);
  };

  const handleCreatePlaylist = async () => {
    const trimmed = playlistName.trim();
    if (!trimmed) {
      setSheetError(createPlaceholder);
      return;
    }

    setSheetLoading(true);
    setSheetError('');
    setSheetMessage('');
    try {
      await playlistsApi.createPlaylist(trimmed, '');
      setPlaylistName('');
      setSheetMessage(createdMessage);
      await load(true);
    } catch (error) {
      setSheetError(error?.response?.data?.detail || error?.response?.data?.error || actionError);
    } finally {
      setSheetLoading(false);
    }
  };

  const pollImportProgress = async (jobId) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await playlistsApi.getImportProgress(jobId);
      const payload = response.data?.job || response.data?.data || response.data || {};
      const status = String(payload.status || payload.state || payload.stage || '').toLowerCase();

      if (['done', 'completed', 'success', 'finished'].includes(status)) {
        return payload;
      }

      if (['failed', 'error', 'cancelled'].includes(status)) {
        throw new Error(payload.error || payload.detail || importFailed);
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    throw new Error(importPending);
  };

  const handleImportPlaylist = async () => {
    const trimmed = importUrl.trim();
    if (!trimmed) {
      setSheetError(importPlaceholder);
      return;
    }

    setSheetLoading(true);
    setSheetError('');
    setSheetMessage('');
    try {
      const response = await playlistsApi.importUrl(trimmed);
      const payload = response.data?.job || response.data?.data || response.data || {};
      const jobId = payload.jobId || payload.id || payload.uuid || null;

      if (jobId) {
        await pollImportProgress(jobId);
      }

      setImportUrl('');
      setSheetMessage(importedMessage);
      await load(true);
    } catch (error) {
      setSheetError(error?.message || error?.response?.data?.detail || error?.response?.data?.error || importFailed);
    } finally {
      setSheetLoading(false);
    }
  };

  const handlePlay = async (track) => {
    const started = await playTrack(track, savedTracks, savedTracks.indexOf(track));
    if (started) {
      navigation.navigate('Player');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.accentMuted} />}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>{strings.library.title}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => openPlaylistSheet('create')}>
              <Ionicons name="add" size={20} color={theme.text60} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.likedBanner}
            activeOpacity={0.85}
            onPress={() => {
              if (savedTracks.length > 0) handlePlay(savedTracks[0]);
            }}
          >
            <View style={styles.likedIcon}>
              <Ionicons name="heart" size={22} color={theme.accent} />
            </View>
            <View style={styles.likedInfo}>
              <Text style={styles.likedTitle}>{strings.library.liked}</Text>
              <Text style={styles.likedMeta}>{savedTracks.length} {strings.library.tracksCount}</Text>
            </View>
            <TouchableOpacity style={styles.likedPlay} onPress={() => savedTracks.length > 0 && handlePlay(savedTracks[0])}>
              <Ionicons name="play" size={18} color={theme.onAccent} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {FILTER_KEYS.map((item) => (
              <Pill key={item} label={strings.library.filters[item]} active={filter === item} onPress={() => setFilter(item)} />
            ))}
          </ScrollView>

          {!isAuthenticated && !loading && (
            <View style={styles.guestBox}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.text40} />
              <Text style={styles.guestTitle}>{strings.library.guestTitle}</Text>
              <Text style={styles.guestText}>{strings.library.guestText}</Text>
              <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.guestBtnText}>{strings.library.signIn}</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={theme.accentMuted} style={{ marginTop: 30 }} />
          ) : (
            <>
              {(filter === 'all' || filter === 'playlists') && (
                <>
                  <SectionHeader
                    title={strings.common.playlists}
                    linkText={createLabel}
                    onLinkPress={() => openPlaylistSheet('create')}
                  />
                  {playlists.length === 0 ? (
                    <Text style={styles.emptyHint}>{strings.library.emptyPlaylists}</Text>
                  ) : (
                    <View style={styles.playlistGrid}>
                      {playlists.map((playlist) => (
                        <TouchableOpacity
                          key={playlist.id}
                          style={styles.plCard}
                          onPress={() => navigation.navigate('PlaylistDetail', { playlist })}
                          activeOpacity={0.7}
                        >
                          <View style={styles.plArt}>
                            {playlist.coverUrl ? (
                              <Image source={{ uri: playlist.coverUrl }} style={styles.plArtImage} />
                            ) : (
                              playlist.artColors.slice(0, 4).map((color, index) => (
                                <View key={`${playlist.id}-${index}`} style={[styles.plArtCell, { backgroundColor: color }]} />
                              ))
                            )}
                          </View>
                          <View style={styles.plInfo}>
                            <Text style={styles.plName} numberOfLines={1}>{playlist.name}</Text>
                            <Text style={styles.plMeta}>{playlist.tracksCount} {strings.library.tracksCount}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {(filter === 'all' || filter === 'tracks') && (
                <>
                  <SectionHeader title={strings.library.savedTracks} linkText={strings.common.viewAll} />
                  {savedTracks.length === 0 ? (
                    <Text style={styles.emptyHint}>{strings.library.emptyTracks}</Text>
                  ) : (
                    savedTracks.map((track) => (
                      <TrackItem
                        key={`${track.source}:${track.id}`}
                        track={track}
                        onPress={() => handlePlay(track)}
                        onMore={() => setMenuTrack(track)}
                      />
                    ))
                  )}
                </>
              )}
            </>
          )}

          <View style={{ height: 160 }} />
        </SafeAreaView>
      </ScrollView>
      <MiniPlayer onPress={() => navigation.navigate('Player')} />
      <BottomSheet
        visible={sheetVisible}
        onClose={closePlaylistSheet}
        title={sheetMode === 'create'
          ? (strings.library.createTitle || strings.library.create || (language === 'ru' ? 'Создать плейлист' : 'Create playlist'))
          : (strings.library.importTitle || importLabel || (language === 'ru' ? 'Импорт плейлиста' : 'Import playlist'))}
        subtitle={sheetMode === 'create'
          ? (strings.library.createHint || strings.library.create || (language === 'ru' ? 'Новый плейлист появится сразу в вашей библиотеке.' : 'The new playlist will appear in your library right away.'))
          : (strings.library.importHint || importLabel || (language === 'ru' ? 'Вставьте ссылку на плейлист для импорта.' : 'Paste a playlist link to import it.'))}
      >
        <View style={styles.sheetTabs}>
          <TouchableOpacity
            style={[styles.sheetTab, sheetMode === 'create' && styles.sheetTabActive]}
            onPress={() => {
              setSheetMode('create');
              setSheetError('');
              setSheetMessage('');
            }}
          >
            <Text style={[styles.sheetTabText, sheetMode === 'create' && styles.sheetTabTextActive]}>
              {createLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sheetTab, sheetMode === 'import' && styles.sheetTabActive]}
            onPress={() => {
              setSheetMode('import');
              setSheetError('');
              setSheetMessage('');
            }}
          >
            <Text style={[styles.sheetTabText, sheetMode === 'import' && styles.sheetTabTextActive]}>
              {importLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {sheetMode === 'create' ? (
          <>
            <View style={styles.sheetInput}>
              <Ionicons name="list-outline" size={17} color={theme.text30} />
              <TextInput
                style={styles.sheetInputField}
                value={playlistName}
                onChangeText={(value) => {
                  setPlaylistName(value);
                  if (sheetError) setSheetError('');
                }}
                placeholder={createPlaceholder}
                placeholderTextColor={theme.text20}
              />
            </View>
            <TouchableOpacity
              style={[styles.sheetBtnPrimary, sheetLoading && styles.sheetBtnDisabled]}
              onPress={handleCreatePlaylist}
              disabled={sheetLoading}
            >
              {sheetLoading
                ? <ActivityIndicator color={theme.onAccent} />
                : <Text style={styles.sheetBtnPrimaryText}>{createLabel}</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.sheetInput}>
              <Ionicons name="link-outline" size={17} color={theme.text30} />
              <TextInput
                style={styles.sheetInputField}
                value={importUrl}
                onChangeText={(value) => {
                  setImportUrl(value);
                  if (sheetError) setSheetError('');
                }}
                placeholder={strings.library.importPlaceholder || 'https://...'}
                placeholderTextColor={theme.text20}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.sheetBtnPrimary, sheetLoading && styles.sheetBtnDisabled]}
              onPress={handleImportPlaylist}
              disabled={sheetLoading}
            >
              {sheetLoading
                ? <ActivityIndicator color={theme.onAccent} />
                : <Text style={styles.sheetBtnPrimaryText}>{importLabel}</Text>}
            </TouchableOpacity>
          </>
        )}

        {!!sheetMessage && <Text style={styles.sheetMessage}>{sheetMessage}</Text>}
        {!!sheetError && <Text style={styles.sheetError}>{sheetError}</Text>}
      </BottomSheet>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 6,
      paddingBottom: 14,
    },
    title: { fontSize: 30 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.8 },
    addBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    likedBanner: {
      marginHorizontal: 24,
      marginBottom: 8,
      paddingVertical: 18,
      paddingHorizontal: 20,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    likedIcon: {
      width: 54,
      height: 54,
      borderRadius: radius.md,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    likedInfo: { flex: 1 },
    likedTitle: { fontSize: 16 * theme.scale, fontWeight: '700', color: theme.text, letterSpacing: -0.2 },
    likedMeta: { fontSize: 12 * theme.scale, color: theme.text30, marginTop: 3 },
    likedPlay: {
      width: 46,
      height: 46,
      borderRadius: radius.full,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    guestBox: {
      marginHorizontal: 24,
      marginBottom: 12,
      padding: 18,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    guestTitle: { fontSize: 15 * theme.scale, fontWeight: '700', color: theme.text, marginTop: 10 },
    guestText: { fontSize: 13 * theme.scale, color: theme.text40, marginTop: 6, lineHeight: 20 * theme.scale },
    guestBtn: {
      marginTop: 14,
      alignSelf: 'flex-start',
      backgroundColor: theme.accent,
      borderRadius: radius.full,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },
    guestBtnText: { fontSize: 13 * theme.scale, fontWeight: '700', color: theme.onAccent },
    pillsRow: { paddingHorizontal: 24, gap: 8, paddingBottom: 4 },
    playlistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 24 },
    plCard: {
      width: '47%',
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      overflow: 'hidden',
    },
    plArt: { width: '100%', aspectRatio: 1, flexDirection: 'row', flexWrap: 'wrap' },
    plArtImage: { width: '100%', height: '100%' },
    plArtCell: { width: '50%', height: '50%' },
    plInfo: { padding: 12 },
    plName: { fontSize: 14 * theme.scale, fontWeight: '600', color: theme.text },
    plMeta: { fontSize: 11 * theme.scale, color: theme.text20, marginTop: 3 },
    emptyHint: { fontSize: 13 * theme.scale, color: theme.text20, paddingHorizontal: 24, paddingVertical: 12 },
    sheetTabs: {
      flexDirection: 'row',
      gap: 8,
    },
    sheetTab: {
      flex: 1,
      paddingVertical: 11,
      alignItems: 'center',
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      backgroundColor: theme.glass,
    },
    sheetTabActive: {
      backgroundColor: theme.accentSoft,
      borderColor: theme.accentSoft,
    },
    sheetTabText: {
      fontSize: 13 * theme.scale,
      color: theme.text40,
      fontWeight: '600',
    },
    sheetTabTextActive: {
      color: theme.accentMuted,
    },
    sheetInput: {
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
    sheetInputField: {
      flex: 1,
      fontSize: 15 * theme.scale,
      color: theme.text,
    },
    sheetBtnPrimary: {
      marginTop: 4,
      backgroundColor: theme.accent,
      borderRadius: radius.md,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetBtnDisabled: {
      opacity: 0.72,
    },
    sheetBtnPrimaryText: {
      fontSize: 14 * theme.scale,
      fontWeight: '700',
      color: theme.onAccent,
    },
    sheetMessage: {
      fontSize: 12 * theme.scale,
      color: theme.accentMuted,
      paddingHorizontal: 2,
    },
    sheetError: {
      fontSize: 12 * theme.scale,
      color: theme.error,
      paddingHorizontal: 2,
    },
  });
}
