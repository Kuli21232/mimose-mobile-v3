import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';
import useSettingsStore from '../../store/settingsStore';
import { yandexApi } from '../../api/yandex';
import { radius, useAppTheme } from '../../theme';
import { useI18n } from '../../i18n';

const YANDEX_POLL_INTERVAL_MS = 2000;
const YANDEX_POLL_TIMEOUT_MS = 3 * 60 * 1000;

function ToggleRow({ label, value, onPress, theme }) {
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

function makeCopy(language) {
  if (language === 'ru') {
    return {
      title: 'Интеграции',
      statusOn: 'ПОДКЛЮЧЕНО',
      statusOff: 'НЕ ПОДКЛЮЧЕНО',
      lastfmTitle: 'Last.fm',
      lastfmDescOn: 'Username сохранён локально. Можно быстро открыть профиль и оставить scrobble-настройки в одном месте.',
      lastfmDescOff: 'Локальная интеграция Last.fm для профиля и scrobble-переключателей.',
      usernameLabel: 'Username',
      usernamePlaceholder: 'например, radioheadfan',
      usernameRequired: 'Введите username Last.fm',
      syncGroup: 'Синхронизация',
      scrobble: 'Скробблить прослушивания',
      nowPlaying: 'Показывать now playing',
      saveProfile: 'Сохранить профиль',
      disconnectLastfm: 'Отключить Last.fm',
      openProfile: 'Открыть профиль',
      yandexTitle: 'Yandex Music',
      yandexDescOn: 'Yandex-аккаунт подключён. Токен хранится локально и нужен для импорта плейлистов и как запасной вариант, если локальному proxy понадобится OAuth.',
      yandexDescOff: 'Для обычного воспроизведения вход не нужен. Авторизация требуется только для импорта плейлистов и ручного fallback-сценария.',
      tokenLabel: 'OAuth token',
      tokenPlaceholder: 'AQAAA...',
      tokenRequired: 'Введите OAuth token Yandex Music',
      playbackGroup: 'Воспроизведение',
      enablePlayback: 'Разрешить fallback через сохранённый token',
      saveToken: 'Сохранить token вручную',
      clearToken: 'Отключить Yandex Music',
      authorizeYandex: 'Авторизоваться через Яндекс',
      authorizeInProgress: 'Ожидаем подтверждение в браузере...',
      authorizeHint: 'Откроется окно браузера с просьбой авторизации. После подтверждения подключение сохранится автоматически.',
      popupBlocked: 'Не удалось открыть popup. Открываю авторизацию в браузере.',
      authExpired: 'Окно авторизации закрыто или истекло. Попробуйте ещё раз.',
      authFailed: 'Авторизация не завершилась. Попробуйте ещё раз.',
      authSuccess: 'Yandex Music успешно подключён.',
      manualEntry: 'Ручной ввод',
      yandexNote: 'Для playback вход не обязателен. Если popup был заблокирован браузером, разрешите всплывающее окно для localhost или завершите вход во внешней вкладке только для импорта.',
    };
  }

  return {
    title: 'Integrations',
    statusOn: 'CONNECTED',
    statusOff: 'NOT CONNECTED',
    lastfmTitle: 'Last.fm',
    lastfmDescOn: 'The username is saved locally so you can reopen the profile and keep scrobble preferences in one place.',
    lastfmDescOff: 'A local Last.fm integration for profile binding and scrobble toggles.',
    usernameLabel: 'Username',
    usernamePlaceholder: 'for example, radioheadfan',
    usernameRequired: 'Enter a Last.fm username',
    syncGroup: 'Sync options',
    scrobble: 'Scrobble plays',
    nowPlaying: 'Show now playing',
    saveProfile: 'Save profile',
    disconnectLastfm: 'Disconnect Last.fm',
    openProfile: 'Open profile',
    yandexTitle: 'Yandex Music',
    yandexDescOn: 'Your Yandex account is connected. The token is stored locally for playlist import and as an optional playback fallback if the local proxy needs OAuth.',
    yandexDescOff: 'Regular playback does not require sign-in. Authorization is only needed for playlist import and the manual fallback path.',
    tokenLabel: 'OAuth token',
    tokenPlaceholder: 'AQAAA...',
    tokenRequired: 'Enter a Yandex Music OAuth token',
    playbackGroup: 'Playback',
    enablePlayback: 'Allow saved token as playback fallback',
    saveToken: 'Save token manually',
    clearToken: 'Disconnect Yandex Music',
    authorizeYandex: 'Authorize with Yandex',
    authorizeInProgress: 'Waiting for confirmation in the browser...',
    authorizeHint: 'A browser window will ask for authorization. After confirmation the connection will be saved automatically.',
    popupBlocked: 'The popup was blocked. Opening authorization in the browser instead.',
    authExpired: 'The auth window was closed or expired. Please try again.',
    authFailed: 'Authorization did not finish. Please try again.',
    authSuccess: 'Yandex Music connected successfully.',
    manualEntry: 'Manual entry',
    yandexNote: 'Playback does not require sign-in. If the popup was blocked, allow popups for localhost or finish the sign-in in the external browser tab only for import flows.',
  };
}

function openBrowserWindow(url) {
  if (typeof window === 'undefined' || typeof window.open !== 'function') {
    Linking.openURL(url);
    return null;
  }

  const popup = window.open(url, 'mimose-yandex-oauth', 'popup=yes,width=560,height=760');
  if (!popup) {
    Linking.openURL(url);
    return null;
  }

  try {
    popup.focus();
  } catch {
    // ignore
  }

  return popup;
}

export default function IntegrationsScreen({ navigation }) {
  const theme = useAppTheme();
  const { language } = useI18n();
  const copy = useMemo(() => makeCopy(language), [language]);
  const lastfm = useSettingsStore((state) => state.settings.integrations.lastfm);
  const yandexMusic = useSettingsStore((state) => state.settings.integrations.yandexMusic);
  const updateIntegration = useSettingsStore((state) => state.updateIntegration);
  const [username, setUsername] = useState(lastfm.username || '');
  const [token, setToken] = useState(yandexMusic.token || '');
  const [lastfmError, setLastfmError] = useState('');
  const [yandexError, setYandexError] = useState('');
  const [yandexMessage, setYandexMessage] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const popupRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const authStateRef = useRef('');
  const authStartedAtRef = useRef(0);
  const styles = createStyles(theme);

  useEffect(() => {
    setUsername(lastfm.username || '');
  }, [lastfm.username]);

  useEffect(() => {
    setToken(yandexMusic.token || '');
  }, [yandexMusic.token]);

  useEffect(() => () => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    try {
      popupRef.current?.close();
    } catch {
      // ignore popup cleanup
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const resumeAuthorization = () => {
      if (!authStateRef.current || !authStartedAtRef.current || !isAuthorizing) return;

      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }

      pollYandexAuth(authStateRef.current, authStartedAtRef.current);
    };

    const handleFocus = () => {
      resumeAuthorization();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resumeAuthorization();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthorizing]);

  const saveLastfm = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setLastfmError(copy.usernameRequired);
      return;
    }

    setLastfmError('');
    await updateIntegration('lastfm', {
      connected: true,
      username: trimmed,
    });
  };

  const openProfile = async () => {
    const targetUsername = (lastfm.username || username).trim();
    if (!targetUsername) {
      setLastfmError(copy.usernameRequired);
      return;
    }

    setLastfmError('');
    await Linking.openURL(`https://www.last.fm/user/${encodeURIComponent(targetUsername)}`);
  };

  const saveYandexToken = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setYandexError(copy.tokenRequired);
      return;
    }

    setYandexError('');
    setYandexMessage('');
    await updateIntegration('yandexMusic', {
      connected: true,
      token: trimmed,
    });
  };

  const clearYandexToken = async () => {
    setYandexError('');
    setYandexMessage('');
    setToken('');
    await updateIntegration('yandexMusic', {
      connected: false,
      token: '',
    });
  };

  const finishYandexAuth = async (receivedToken) => {
    const nextToken = String(receivedToken || '').trim();
    if (!nextToken) {
      setYandexError(copy.authFailed);
      return;
    }

    setToken(nextToken);
    setYandexError('');
    setYandexMessage(copy.authSuccess);
    await updateIntegration('yandexMusic', {
      connected: true,
      token: nextToken,
    });
    authStateRef.current = '';
    authStartedAtRef.current = 0;
  };

  const pollYandexAuth = async (state, startedAt) => {
    try {
      const result = await yandexApi.getOAuthPending(state);

      if (result.code) {
        const oauthData = await yandexApi.getOAuthPlaylists(result.code);
        if (oauthData.token) {
          try {
            popupRef.current?.close();
          } catch {
            // ignore
          }
          popupRef.current = null;
          setIsAuthorizing(false);
          await finishYandexAuth(oauthData.token);
          return;
        }

        setIsAuthorizing(false);
        setYandexMessage('');
        setYandexError(oauthData.error || copy.authFailed);
        authStateRef.current = '';
        authStartedAtRef.current = 0;
        return;
      }

      if (result.pending) {
        if (Date.now() - startedAt >= YANDEX_POLL_TIMEOUT_MS) {
          setIsAuthorizing(false);
          setYandexMessage('');
          setYandexError(copy.authExpired);
          popupRef.current = null;
          authStateRef.current = '';
          authStartedAtRef.current = 0;
          return;
        }

        pollTimeoutRef.current = setTimeout(() => {
          pollYandexAuth(state, startedAt);
        }, YANDEX_POLL_INTERVAL_MS);
        return;
      }

      if (Date.now() - startedAt < YANDEX_POLL_TIMEOUT_MS) {
        pollTimeoutRef.current = setTimeout(() => {
          pollYandexAuth(state, startedAt);
        }, YANDEX_POLL_INTERVAL_MS);
        return;
      }

      setIsAuthorizing(false);
      setYandexMessage('');
      setYandexError(result.error || copy.authFailed);
      authStateRef.current = '';
      authStartedAtRef.current = 0;
    } catch (error) {
      setIsAuthorizing(false);
      setYandexMessage('');
      setYandexError(error?.response?.data?.error || error?.message || copy.authFailed);
      authStateRef.current = '';
      authStartedAtRef.current = 0;
    }
  };

  const authorizeYandex = async () => {
    if (isAuthorizing) return;

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setYandexError('');
    setYandexMessage(copy.authorizeInProgress);
    setIsAuthorizing(true);

    try {
      const { authUrl, state } = await yandexApi.getOAuthUrl();
      if (!authUrl || !state) {
        throw new Error(copy.authFailed);
      }

      authStateRef.current = state;
      authStartedAtRef.current = Date.now();

      const popup = openBrowserWindow(authUrl);
      popupRef.current = popup;

      if (!popup && typeof window !== 'undefined') {
        setYandexMessage(copy.popupBlocked);
      }

      await pollYandexAuth(state, authStartedAtRef.current);
    } catch (error) {
      setIsAuthorizing(false);
      setYandexMessage('');
      setYandexError(error?.response?.data?.error || error?.message || copy.authFailed);
      authStateRef.current = '';
      authStartedAtRef.current = 0;
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <TopNav title={copy.title} onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.iconWrap}>
              <Ionicons name="radio-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {lastfm.connected ? copy.statusOn : copy.statusOff}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{copy.lastfmTitle}</Text>
          <Text style={styles.heroText}>
            {lastfm.connected ? copy.lastfmDescOn : copy.lastfmDescOff}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{copy.usernameLabel}</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.prefix}>@</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                if (lastfmError) setLastfmError('');
              }}
              placeholder={copy.usernamePlaceholder}
              placeholderTextColor={theme.text20}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {!!lastfmError && <Text style={styles.errorText}>{lastfmError}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{copy.syncGroup}</Text>
          <View style={styles.group}>
            <ToggleRow
              label={copy.scrobble}
              value={lastfm.scrobble}
              onPress={() => updateIntegration('lastfm', { scrobble: !lastfm.scrobble })}
              theme={theme}
            />
            <ToggleRow
              label={copy.nowPlaying}
              value={lastfm.nowPlaying}
              onPress={() => updateIntegration('lastfm', { nowPlaying: !lastfm.nowPlaying })}
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={saveLastfm}>
            <Text style={styles.primaryBtnText}>{copy.saveProfile}</Text>
          </TouchableOpacity>

          {lastfm.connected && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => updateIntegration('lastfm', { connected: false, username: '' })}
            >
              <Text style={styles.secondaryBtnText}>{copy.disconnectLastfm}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.ghostBtn} onPress={openProfile}>
            <Ionicons name="open-outline" size={16} color={theme.accentMuted} />
            <Text style={styles.ghostBtnText}>{copy.openProfile}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.iconWrap}>
              <Ionicons name="musical-notes-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {yandexMusic.connected && yandexMusic.token ? copy.statusOn : copy.statusOff}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{copy.yandexTitle}</Text>
          <Text style={styles.heroText}>
            {yandexMusic.connected && yandexMusic.token ? copy.yandexDescOn : copy.yandexDescOff}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, isAuthorizing && styles.btnDisabled]}
            onPress={authorizeYandex}
            disabled={isAuthorizing}
          >
            {isAuthorizing ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <Text style={styles.primaryBtnText}>{copy.authorizeYandex}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>{copy.authorizeHint}</Text>
        {!!yandexMessage && <Text style={styles.messageText}>{yandexMessage}</Text>}
        {!!yandexError && <Text style={styles.errorTextWide}>{yandexError}</Text>}

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{copy.playbackGroup}</Text>
          <View style={styles.group}>
            <ToggleRow
              label={copy.enablePlayback}
              value={yandexMusic.enablePlayback}
              onPress={() => updateIntegration('yandexMusic', { enablePlayback: !yandexMusic.enablePlayback })}
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{copy.manualEntry}</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="key-outline" size={17} color={theme.text30} />
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={(value) => {
                setToken(value);
                if (yandexError) setYandexError('');
              }}
              placeholder={copy.tokenPlaceholder}
              placeholderTextColor={theme.text20}
              secureTextEntry={!showToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowToken((value) => !value)}>
              <Ionicons
                name={showToken ? 'eye-off-outline' : 'eye-outline'}
                size={17}
                color={theme.text30}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={saveYandexToken}>
            <Text style={styles.secondaryBtnText}>{copy.saveToken}</Text>
          </TouchableOpacity>

          {Boolean(yandexMusic.token) && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={clearYandexToken}>
              <Text style={styles.secondaryBtnText}>{copy.clearToken}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.note}>{copy.yandexNote}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    heroCard: {
      marginHorizontal: 24,
      marginBottom: 24,
      padding: 18,
      backgroundColor: theme.glass,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: radius.full,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      backgroundColor: theme.accentSoft,
      borderRadius: radius.full,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    badgeText: {
      fontSize: 10 * theme.scale,
      fontWeight: '700',
      color: theme.accentMuted,
      letterSpacing: 0.7,
    },
    heroTitle: { fontSize: 18 * theme.scale, fontWeight: '700', color: theme.text },
    heroText: {
      marginTop: 8,
      fontSize: 13 * theme.scale,
      color: theme.text40,
      lineHeight: 20 * theme.scale,
    },
    section: { marginHorizontal: 24, marginBottom: 24 },
    groupTitle: {
      fontSize: 10 * theme.scale,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: theme.text20,
      fontWeight: '600',
      paddingBottom: 10,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    prefix: { fontSize: 17 * theme.scale, color: theme.accentMuted, fontWeight: '600' },
    input: { flex: 1, fontSize: 15 * theme.scale, color: theme.text },
    errorText: { marginTop: 8, fontSize: 12 * theme.scale, color: theme.error },
    errorTextWide: {
      marginHorizontal: 24,
      marginTop: 10,
      fontSize: 12 * theme.scale,
      color: theme.error,
    },
    messageText: {
      marginHorizontal: 24,
      marginTop: 10,
      fontSize: 12 * theme.scale,
      color: theme.accentMuted,
    },
    group: {
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 18,
      backgroundColor: theme.glass,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.glassBorder,
    },
    toggleLabel: { fontSize: 15 * theme.scale, color: theme.text, flex: 1, paddingRight: 14 },
    toggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.text12,
      flexShrink: 0,
    },
    toggleOn: { backgroundColor: theme.accent },
    knob: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.bg,
    },
    knobOn: { left: 21 },
    actions: { marginHorizontal: 24, gap: 10 },
    primaryBtn: {
      backgroundColor: theme.accent,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.7 },
    primaryBtnText: { fontSize: 15 * theme.scale, fontWeight: '700', color: theme.onAccent },
    secondaryBtn: {
      backgroundColor: theme.glass,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
    },
    secondaryBtnText: { fontSize: 14 * theme.scale, fontWeight: '600', color: theme.text },
    ghostBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
    },
    ghostBtnText: { fontSize: 14 * theme.scale, fontWeight: '600', color: theme.accentMuted },
    note: {
      marginHorizontal: 24,
      marginTop: 14,
      color: theme.text30,
      fontSize: 12 * theme.scale,
      lineHeight: 18 * theme.scale,
    },
    divider: {
      height: 1,
      marginHorizontal: 24,
      marginVertical: 8,
      backgroundColor: theme.glassBorderStrong,
    },
  });
}
