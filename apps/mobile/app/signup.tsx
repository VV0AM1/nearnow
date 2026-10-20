import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { isEmail, PASSWORD_MIN } from '@/lib/validation';
import { Banner, Button, Text, TextField, useTokens } from '@/design';
import { OtpStep, PasswordField } from '@/components/AuthForms';

export default function Signup() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const [otpFor, setOtpFor] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (!name.trim()) next.name = t('auth.nameRequired');
    if (!isEmail(email)) next.email = t('auth.invalidEmail');
    if (password.length < PASSWORD_MIN) next.password = t('auth.passwordTooShort');
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await api.post('/auth/signup', { name: name.trim(), email: email.trim(), password });
      setOtpFor(email.trim().toLowerCase());
    } catch (e) {
      setErrors({ form: describeError(e, t) });
    } finally {
      setBusy(false);
    }
  };

  // After sign-up the account exists, so a new code is requested through the normal sign-in step.
  const resend = async () => {
    await api.post('/auth/login', { email: email.trim(), password });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: tokens.space.xl }} keyboardShouldPersistTaps="handled">
        {otpFor ? (
          <OtpStep email={otpFor} onResend={resend} onBack={() => setOtpFor(null)} />
        ) : (
          <View>
            <Text variant="subheadline" tone="secondary" style={{ marginBottom: tokens.space.xl }}>
              {t('auth.tagline')}
            </Text>
            <TextField label={t('auth.name')} value={name} onChangeText={setName} error={errors.name} autoComplete="name" textContentType="name" max={60} />
            <TextField
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
            <PasswordField label={t('auth.password')} value={password} onChangeText={setPassword} error={errors.password} newPassword onSubmitEditing={submit} />
            {errors.form ? (
              <View style={{ marginBottom: tokens.space.lg }}>
                <Banner tone="danger" icon="alert-circle" message={errors.form} />
              </View>
            ) : null}
            <Button title={t('auth.signUp')} size="large" block onPress={submit} loading={busy} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: tokens.space.lg }}>
              <Text variant="subheadline" tone="secondary">
                {t('auth.haveAccount')}
              </Text>
              <Button title={t('auth.signIn')} variant="plain" onPress={() => router.back()} />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
