import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { isEmail, PASSWORD_MIN } from '@/lib/validation';
import { Button, Field, useColors } from '@/components/ui';
import { OtpStep, PasswordField } from '@/components/AuthForms';

export default function Signup() {
  const { t } = useI18n();
  const c = useColors();
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        {otpFor ? (
          <OtpStep email={otpFor} onResend={resend} onBack={() => setOtpFor(null)} />
        ) : (
          <View>
            <Text style={{ color: c.muted, marginBottom: 20 }}>{t('auth.tagline')}</Text>
            <Field label={t('auth.name')} value={name} onChangeText={setName} error={errors.name} autoComplete="name" textContentType="name" max={60} />
            <Field
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
              <Text accessibilityLiveRegion="polite" style={{ color: c.danger, marginBottom: 12 }}>
                {errors.form}
              </Text>
            ) : null}
            <Button title={t('auth.signUp')} onPress={submit} loading={busy} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: c.muted }}>{t('auth.haveAccount')}</Text>
              <Button title={t('auth.signIn')} variant="ghost" onPress={() => router.back()} />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
