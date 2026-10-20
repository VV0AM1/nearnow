import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { isOtp } from '@/lib/validation';
import type { AuthResponse } from '@/lib/types';
import { Banner, Button, IconButton, Text, TextField, useTokens } from '@/design';

export function PasswordField({
  label,
  value,
  onChangeText,
  error,
  newPassword,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string | null;
  newPassword?: boolean;
  onSubmitEditing?: () => void;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      error={error}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={newPassword ? 'newPassword' : 'password'}
      autoComplete={newPassword ? 'new-password' : 'current-password'}
      onSubmitEditing={onSubmitEditing}
      right={
        <IconButton icon={visible ? 'eye-off-outline' : 'eye-outline'} label={visible ? t('auth.hidePassword') : t('auth.showPassword')} size={20} onPress={() => setVisible((v) => !v)} />
      }
    />
  );
}

const RESEND_SECONDS = 60;

/** Second step of sign-in/sign-up: verify the emailed code and start the session. */
export function OtpStep({ email, onResend, onBack }: { email: string; onResend: () => Promise<void>; onBack: () => void }) {
  const { t } = useI18n();
  const tokens = useTokens();
  const { signIn } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setWait(RESEND_SECONDS);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setWait((w) => (w <= 1 ? (clearInterval(timer.current!), 0) : w - 1)), 1000);
  };
  useEffect(() => {
    startCooldown();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const verify = async () => {
    if (busy) return;
    if (!isOtp(otp)) return setError(t('auth.codeInvalid'));
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>('/auth/otp/verify', { email, otp: otp.trim() });
      await signIn(res.data.accessToken);
    } catch (e) {
      setError(describeError(e, t));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      await onResend();
      setInfo(t('auth.codeResent'));
      startCooldown();
    } catch (e) {
      setError(describeError(e, t));
    }
  };

  return (
    <View>
      <Text variant="title2" weight="700" style={{ marginBottom: tokens.space.sm }}>
        {t('auth.codeTitle')}
      </Text>
      <Text variant="subheadline" tone="secondary" style={{ marginBottom: tokens.space.xl }}>
        {t('auth.codeSent', { email })}
      </Text>
      <TextField
        label={t('auth.code')}
        value={otp}
        onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        error={error}
        onSubmitEditing={verify}
        autoFocus
        style={{ fontSize: 28, fontWeight: '600', letterSpacing: 10, textAlign: 'center', fontVariant: ['tabular-nums'] }}
      />
      {info ? (
        <View style={{ marginBottom: tokens.space.md }}>
          <Banner tone="success" icon="checkmark-circle" message={info} />
        </View>
      ) : null}
      <Button title={t('auth.verify')} size="large" block onPress={verify} loading={busy} disabled={otp.length !== 6} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: tokens.space.sm }}>
        <Button title={t('common.back')} variant="plain" icon="chevron-back" onPress={onBack} />
        <Button title={wait > 0 ? t('auth.resendIn', { s: wait }) : t('auth.resend')} variant="plain" onPress={resend} disabled={wait > 0} />
      </View>
    </View>
  );
}
