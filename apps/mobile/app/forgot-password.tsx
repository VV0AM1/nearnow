import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { isEmail, isOtp, PASSWORD_MIN } from '@/lib/validation';
import { useToast } from '@/context/ToastContext';
import { Button, Field, useColors } from '@/components/ui';
import { PasswordField } from '@/components/AuthForms';

export default function ForgotPassword() {
  const { t } = useI18n();
  const c = useColors();
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: c.muted, marginBottom: 20 }}>{step === 'email' ? t('auth.resetIntro') : info}</Text>
        {step === 'email' ? (
          <>
            <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            {error ? <Text style={{ color: c.danger, marginBottom: 12 }}>{error}</Text> : null}
            <Button title={t('auth.sendCode')} onPress={sendCode} loading={busy} />
          </>
        ) : (
          <>
            <Field
              label={t('auth.code')}
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
            />
            <PasswordField label={t('auth.newPassword')} value={password} onChangeText={setPassword} newPassword />
            {error ? <Text style={{ color: c.danger, marginBottom: 12 }}>{error}</Text> : null}
            <Button title={t('auth.resetPassword')} onPress={reset} loading={busy} />
            <Button title={t('common.back')} variant="ghost" onPress={() => setStep('email')} style={{ marginTop: 8 }} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
