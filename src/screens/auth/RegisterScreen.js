import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../api/auth';
import { radius, useAppTheme } from '../../theme';
import { useI18n } from '../../i18n';

export default function RegisterScreen({ navigation }) {
  const theme = useAppTheme();
  const { strings } = useI18n();
  const styles = createStyles(theme);
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);

  const checkHandle = async (value) => {
    setHandle(value);
    setHandleAvailable(null);
    if (value.length < 3) return;
    try {
      await authApi.checkHandle(value);
      setHandleAvailable(true);
    } catch {
      setHandleAvailable(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !handle.trim() || !password) {
      setError(strings.auth.fillAll);
      return;
    }
    if (handleAvailable === false) {
      setError(strings.auth.register.handleTaken);
      return;
    }
    if (password.length < 8) {
      setError(strings.auth.register.passwordShort);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await register(email.trim().toLowerCase(), password, handle.trim().toLowerCase());
      // Register returns a message — user needs to verify email first
      Alert.alert(
        strings.auth.register.successTitle || 'Registration',
        result.message || 'Account created. Please verify your email.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.response?.data?.error || strings.auth.registerError;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleIcon = handleAvailable === true
    ? 'checkmark-circle'
    : handleAvailable === false
      ? 'close-circle'
      : null;
  const handleColor = handleAvailable === true
    ? theme.success
    : theme.error;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top', 'bottom']}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={theme.text60} />
          </TouchableOpacity>

          <Text style={styles.heading}>{strings.auth.register.title}</Text>
          <Text style={styles.sub}>{strings.auth.register.subtitle}</Text>

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
            <Text style={styles.label}>{strings.auth.register.handle}</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="yourhandle"
                placeholderTextColor={theme.text20}
                value={handle}
                onChangeText={checkHandle}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {handleIcon && (
                <Ionicons name={handleIcon} size={17} color={handleColor} />
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{strings.auth.password}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={17} color={theme.text30} />
              <TextInput
                style={styles.input}
                placeholder={strings.auth.register.passwordHint}
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
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={theme.onAccent} />
              : <Text style={styles.btnText}>{strings.auth.register.submit}</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{strings.auth.register.hasAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>{strings.auth.register.login}</Text>
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
    back: {
      width: 38, height: 38, borderRadius: radius.full,
      backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.glassBorderStrong,
      alignItems: 'center', justifyContent: 'center', marginBottom: 28,
    },
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
    atSign: { fontSize: 17 * theme.scale, color: theme.accentMuted, fontWeight: '600' },
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
