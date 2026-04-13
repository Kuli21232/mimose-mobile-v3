import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { radius, useAppTheme } from '../../theme';
import { useI18n } from '../../i18n';

export default function LoginScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const styles = createStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError(strings.auth.fillAll);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.detail ||
        requestError.response?.data?.error ||
        (requestError.request ? 'Сервер не ответил. Проверьте интернет и настройки API.' : '') ||
        requestError.message ||
        strings.auth.loginError;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top', 'bottom']}>
          <View style={styles.logoRow}>
            <Ionicons name="leaf-outline" size={28} color={theme.accent} />
            <Text style={styles.logoText}>{strings.appName}</Text>
          </View>

          <Text style={styles.heading}>{strings.auth.login.welcome}</Text>
          <Text style={styles.sub}>{strings.auth.login.subtitle}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{strings.auth.email}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={17} color={theme.text30} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={theme.text20}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{strings.auth.password}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={17} color={theme.text30} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.text20}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                  color={theme.text30}
                />
              </TouchableOpacity>
            </View>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={theme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={theme.onAccent} />
              : <Text style={styles.btnText}>{strings.auth.login.submit}</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{strings.auth.login.noAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>{strings.auth.login.register}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    scroll: { flexGrow: 1, padding: 28 },
    logoRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginBottom: 40, marginTop: 16,
    },
    logoText: { fontSize: 20 * theme.scale, fontWeight: '700', color: theme.text, letterSpacing: -0.4 },
    heading: { fontSize: 30 * theme.scale, fontWeight: '800', color: theme.text, letterSpacing: -0.8 },
    sub: { fontSize: 14 * theme.scale, color: theme.text40, marginTop: 6, marginBottom: 36 },
    field: { marginBottom: 18 },
    label: { fontSize: 13 * theme.scale, fontWeight: '500', color: theme.text60, marginBottom: 8 },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: theme.glass, borderRadius: radius.md,
      borderWidth: 1, borderColor: theme.glassBorderStrong,
      paddingVertical: 14, paddingHorizontal: 16,
    },
    input: { flex: 1, fontSize: 15 * theme.scale, color: theme.text },
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: 'rgba(255,80,80,0.08)',
      borderRadius: radius.sm, padding: 12,
      borderWidth: 1, borderColor: 'rgba(255,80,80,0.2)',
      marginBottom: 16,
    },
    errorText: { flex: 1, fontSize: 13 * theme.scale, color: theme.error },
    btn: {
      backgroundColor: theme.accent, borderRadius: radius.md,
      paddingVertical: 17, alignItems: 'center', marginTop: 4,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontSize: 15 * theme.scale, fontWeight: '700', color: theme.onAccent },
    footer: {
      flexDirection: 'row', justifyContent: 'center',
      alignItems: 'center', marginTop: 28,
    },
    footerText: { fontSize: 14 * theme.scale, color: theme.text40 },
    footerLink: { fontSize: 14 * theme.scale, color: theme.accentMuted, fontWeight: '600' },
  });
}
