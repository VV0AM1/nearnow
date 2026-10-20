import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { isEmail, isOtp, PASSWORD_MIN } from '@/lib/validation';
import { useToast } from '@/context/ToastContext';
import { Banner, Button, Text, TextField, useTokens } from '@/design';
import { PasswordField } from '@/components/AuthForms';

export default function ForgotPassword() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    if (busy) return;
    if (!isEmail(email)) return setError(t('auth.invalidEmail'));
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', { email: email.trim() });
      setInfo(res.data.message);
      setStep('reset');
    } catch (e) {
      setError(describeError(e, t));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (busy) return;
    if (!isOtp(otp)) return setError(t('auth.codeInvalid'));
    if (password.length < PASSWORD_MIN) return setError(t('auth.passwordTooShort'));
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp: otp.trim(), newPassword: password });
      showToast(t('auth.resetDone'), 'success');
      router.back();
    } catch (e) {
      setError(describeError(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: tokens.space.xl }} keyboardShouldPersistTaps="handled">
        <Text variant="subheadline" tone="secondary" style={{ marginBottom: tokens.space.xl }}>
          {step === 'email' ? t('auth.resetIntro') : info}
        </Text>
        {step === 'email' ? (
          <>
            <TextField label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            {error ? (
              <View style={{ marginBottom: tokens.space.lg }}>
                <Banner tone="danger" icon="alert-circle" message={error} />
              </View>
            ) : null}
            <Button title={t('auth.sendCode')} size="large" block onPress={sendCode} loading={busy} />
          </>
        ) : (
          <>
            <TextField
              label={t('auth.code')}
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
            <PasswordField label={t('auth.newPassword')} value={password} onChangeText={setPassword} newPassword />
            {error ? (
              <View style={{ marginBottom: tokens.space.lg }}>
                <Banner tone="danger" icon="alert-circle" message={error} />
              </View>
            ) : null}
            <Button title={t('auth.resetPassword')} size="large" block onPress={reset} loading={busy} />
            <Button title={t('common.back')} variant="plain" block onPress={() => setStep('email')} style={{ marginTop: tokens.space.sm }} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
