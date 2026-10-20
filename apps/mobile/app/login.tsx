import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { isEmail } from '@/lib/validation';
import { Button, Field, useColors } from '@/components/ui';
import { OtpStep, PasswordField } from '@/components/AuthForms';

export default function Login() {
  const { t } = useI18n();
  const c = useColors();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ color: c.primary, fontSize: 32, fontWeight: '800' }}>NearNow</Text>
            <Text style={{ color: c.muted, marginTop: 6, textAlign: 'center' }}>{t('auth.tagline')}</Text>
          </View>

          {notice ? (
            <Text accessibilityLiveRegion="polite" style={{ color: c.warning, marginBottom: 16, textAlign: 'center' }}>
              {t('auth.sessionExpired')}
            </Text>
          ) : null}

          {otpFor ? (
            <OtpStep email={otpFor} onResend={requestCode} onBack={() => setOtpFor(null)} />
          ) : (
            <View>
              <Text accessibilityRole="header" style={{ color: c.text, fontSize: 22, fontWeight: '700', marginBottom: 20 }}>
                {t('auth.welcome')}
              </Text>
              <Field
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
              />
              <PasswordField label={t('auth.password')} value={password} onChangeText={setPassword} error={errors.password} onSubmitEditing={submit} />
              {errors.form ? (
                <Text accessibilityLiveRegion="polite" style={{ color: c.danger, marginBottom: 12 }}>
                  {errors.form}
                </Text>
              ) : null}
              <Button title={t('auth.signIn')} onPress={submit} loading={busy} />
              <Button title={t('auth.forgot')} variant="ghost" onPress={() => router.push('/forgot-password')} style={{ marginTop: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
                <Text style={{ color: c.muted }}>{t('auth.noAccount')}</Text>
                <Button title={t('auth.signUp')} variant="ghost" onPress={() => router.push('/signup')} />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
