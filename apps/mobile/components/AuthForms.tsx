import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { isOtp } from '@/lib/validation';
import type { AuthResponse } from '@/lib/types';
import { Button, Field, useColors } from './ui';

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
  const c = useColors();
  const [visible, setVisible] = useState(false);
  return (
    <Field
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          onPress={() => setVisible((v) => !v)}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={c.muted} />
        </Pressable>
      }
    />
  );
}

const RESEND_SECONDS = 60;

/** Second step of sign-in/sign-up: verify the emailed code and start the session. */
export function OtpStep({ email, onResend, onBack }: { email: string; onResend: () => Promise<void>; onBack: () => void }) {
  const { t } = useI18n();
  const c = useColors();
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
      <Text accessibilityRole="header" style={{ color: c.text, fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
        {t('auth.codeTitle')}
      </Text>
      <Text style={{ color: c.muted, marginBottom: 20 }}>{t('auth.codeSent', { email })}</Text>
      <Field
        label={t('auth.code')}
        value={otp}
        onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        error={error}
        onSubmitEditing={verify}
        style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
      />
      {info ? (
        <Text accessibilityLiveRegion="polite" style={{ color: c.success, marginBottom: 12 }}>
          {info}
        </Text>
      ) : null}
      <Button title={t('auth.verify')} onPress={verify} loading={busy} />
      <Button
        title={wait > 0 ? t('auth.resendIn', { s: wait }) : t('auth.resend')}
        variant="ghost"
        onPress={resend}
        disabled={wait > 0}
        style={{ marginTop: 8 }}
      />
      <Button title={t('common.back')} variant="ghost" onPress={onBack} />
    </View>
  );
}
