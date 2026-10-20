import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { isEmail } from '@/lib/validation';
import { Banner, Button, Icon, Text, TextField, continuous, useTokens } from '@/design';
import { OtpStep, PasswordField } from '@/components/AuthForms';

export default function Login() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { notice, clearNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const [otpFor, setOtpFor] = useState<string | null>(null);

  const requestCode = async () => {
    await api.post('/auth/login', { email: email.trim(), password });
  };

  const submit = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (!isEmail(email)) next.email = t('auth.invalidEmail');
    if (!password) next.password = t('auth.passwordTooShort');
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    clearNotice();
    try {
      await requestCode();
      setOtpFor(email.trim().toLowerCase());
    } catch (e) {
      setErrors({ form: describeError(e, t) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: tokens.space.xl }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: tokens.space.xxl, gap: tokens.space.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: tokens.colors.accent, alignItems: 'center', justifyContent: 'center', ...continuous }}>
              <Icon name="location" size={36} color={tokens.colors.onAccent} />
            </View>
            <Text variant="largeTitle" weight="700" align="center">
              NearNow
            </Text>
            <Text variant="subheadline" tone="secondary" align="center">
              {t('auth.tagline')}
            </Text>
          </View>

          {notice ? (
            <View style={{ marginBottom: tokens.space.lg }}>
              <Banner tone="warning" icon="time-outline" message={t('auth.sessionExpired')} />
            </View>
          ) : null}

          {otpFor ? (
            <OtpStep email={otpFor} onResend={requestCode} onBack={() => setOtpFor(null)} />
          ) : (
            <View>
              <Text variant="title2" weight="700" style={{ marginBottom: tokens.space.xl }}>
                {t('auth.welcome')}
              </Text>
              <TextField
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
                returnKeyType="next"
              />
              <PasswordField label={t('auth.password')} value={password} onChangeText={setPassword} error={errors.password} onSubmitEditing={submit} />
              {errors.form ? (
                <View style={{ marginBottom: tokens.space.lg }}>
                  <Banner tone="danger" icon="alert-circle" message={errors.form} />
                </View>
              ) : null}
              <Button title={t('auth.signIn')} size="large" block onPress={submit} loading={busy} />
              <Button title={t('auth.forgot')} variant="plain" block onPress={() => router.push('/forgot-password')} style={{ marginTop: tokens.space.sm }} />
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: tokens.space.lg }}>
                <Text variant="subheadline" tone="secondary">
                  {t('auth.noAccount')}
                </Text>
                <Button title={t('auth.signUp')} variant="plain" onPress={() => router.push('/signup')} />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
