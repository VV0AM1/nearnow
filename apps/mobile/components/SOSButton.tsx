import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Modal, ScrollView, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { config } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import type { CreatedPost } from '@/lib/types';
import { Banner, Button, Icon, IconButton, Text, continuous, useTokens } from '@/design';

type Phase = 'closed' | 'info' | 'locating' | 'countdown' | 'sending' | 'result' | 'error';
const COUNTDOWN_SECONDS = 5;

/**
 * Urgent help request. It only creates a community alert; it never claims that
 * emergency services or anyone else was dispatched, and it always offers 112.
 * Success is shown only after the server confirms, with the real number of people
 * who were notified.
 */
export function UrgentHelpButton() {
  const { t } = useI18n();
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('closed');
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [result, setResult] = useState<CreatedPost | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const coords = useRef<{ latitude: number; longitude: number } | null>(null);
  const sending = useRef(false);
  const number = config.emergencyNumber;

  const close = () => {
    setPhase('closed');
    setSeconds(COUNTDOWN_SECONDS);
    setErrorText(null);
  };

  const call = () => void Linking.openURL(`tel:${number}`);

  const start = async () => {
    setPhase('locating');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error('permission');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      coords.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setSeconds(COUNTDOWN_SECONDS);
      setPhase('countdown');
    } catch {
      setErrorText(t('urgent.locationNeeded'));
      setPhase('error');
    }
  };

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (seconds === 0) {
      void send();
      return;
    }
    AccessibilityInfo.announceForAccessibility(t('urgent.countdown', { s: seconds }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, seconds]);

  const send = async () => {
    if (sending.current || !coords.current) return;
    sending.current = true;
    setPhase('sending');
    try {
      const res = await api.post<CreatedPost>('/posts', {
        title: t('urgent.defaultTitle'),
        category: 'DANGER',
        latitude: coords.current.latitude,
        longitude: coords.current.longitude,
      });
      setResult(res.data);
      setPhase('result');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch {
      setErrorText(t('urgent.failed', { number }));
      setPhase('error');
    } finally {
      sending.current = false;
      coords.current = null;
    }
  };

  const notified = result?.alertSummary?.notified ?? 0;

  return (
    <>
      <Button title={t('urgent.button')} icon="alert-circle" variant="destructiveTinted" size="small" onPress={() => setPhase('info')} />

      <Modal visible={phase !== 'closed'} animationType="slide" transparent onRequestClose={phase === 'sending' ? undefined : close}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: tokens.colors.scrim }}>
          <View style={{ backgroundColor: tokens.colors.surface, borderTopLeftRadius: tokens.radius.xl, borderTopRightRadius: tokens.radius.xl, maxHeight: '92%', ...continuous }}>
            <View style={{ alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: tokens.colors.separator, marginTop: tokens.space.sm }} />
            <ScrollView contentContainerStyle={{ padding: tokens.space.xl, paddingBottom: tokens.space.xl + insets.bottom, gap: tokens.space.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="title2" weight="700" style={{ flex: 1 }}>
                  {phase === 'result' ? t('urgent.resultTitle') : t('urgent.title')}
                </Text>
                {phase !== 'sending' ? <IconButton icon="close" label={t('common.close')} variant="filled" size={18} onPress={close} /> : null}
              </View>

              <View style={{ backgroundColor: tokens.colors.dangerSoft, borderRadius: tokens.radius.lg, padding: tokens.space.lg, gap: tokens.space.md, ...continuous }}>
                <View style={{ flexDirection: 'row', gap: tokens.space.sm, alignItems: 'flex-start' }}>
                  <Icon name="call" size={20} color={tokens.colors.danger} />
                  <View style={{ flex: 1, gap: tokens.space.xs }}>
                    <Text variant="headline" tone="danger">
                      {t('urgent.callFirst', { number })}
                    </Text>
                    <Text variant="subheadline">{t('urgent.notEmergency')}</Text>
                  </View>
                </View>
                <Button title={t('urgent.call', { number })} icon="call" variant="destructive" size="large" block haptic onPress={call} />
              </View>

              {phase === 'info' ? (
                <>
                  <Text variant="subheadline" tone="secondary">
                    {t('urgent.explain')}
                  </Text>
                  <Button title={t('urgent.post')} variant="tinted" icon="megaphone-outline" block onPress={start} />
                  <Button title={t('common.cancel')} variant="plain" block onPress={close} />
                </>
              ) : null}

              {phase === 'locating' ? <Button title={t('onboarding.locating')} loading variant="tinted" block onPress={() => undefined} /> : null}

              {phase === 'countdown' ? (
                <>
                  <CountdownRing seconds={seconds} total={COUNTDOWN_SECONDS} label={t('urgent.countdown', { s: seconds })} />
                  <Button title={t('urgent.cancel')} variant="tinted" icon="close" size="large" block onPress={close} />
                </>
              ) : null}

              {phase === 'sending' ? <Button title={t('urgent.sending')} loading variant="tinted" block onPress={() => undefined} /> : null}

              {phase === 'result' && result ? (
                <>
                  <View style={{ flexDirection: 'row', gap: tokens.space.md, alignItems: 'flex-start' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tokens.colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="checkmark" size={22} color={tokens.colors.success} weight="bold" />
                    </View>
                    <Text variant="body" style={{ flex: 1 }}>
                      {notified > 0 ? t('urgent.resultNotified', { n: notified }) : t('urgent.resultNone')}
                    </Text>
                  </View>
                  <Text variant="headline" tone="danger">
                    {t('urgent.resultReminder', { number })}
                  </Text>
                  <Button
                    title={t('map.viewDetails')}
                    variant="tinted"
                    block
                    onPress={() => {
                      close();
                      router.push({ pathname: '/post/[id]', params: { id: result.id } });
                    }}
                  />
                  <Button title={t('common.close')} variant="plain" block onPress={close} />
                </>
              ) : null}

              {phase === 'error' ? (
                <>
                  <Banner tone="danger" icon="alert-circle" message={errorText ?? ''} />
                  <Button title={t('common.retry')} variant="tinted" block onPress={start} />
                  <Button title={t('common.close')} variant="plain" block onPress={close} />
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const RING = 132;

/** Seconds left inside a ring that pulses once per tick; static under Reduce Motion. */
function CountdownRing({ seconds, total, label }: { seconds: number; total: number; label: string }) {
  const tokens = useTokens();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (tokens.reduceMotion) return;
    pulse.value = 0;
    pulse.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse, tokens.reduceMotion]);

  const halo = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 0.25 }] }));
  const progress = Math.max(0, Math.min(1, seconds / total));

  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={label} accessibilityLiveRegion="assertive" style={{ alignItems: 'center', gap: tokens.space.md, paddingVertical: tokens.space.sm }}>
      <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
        {!tokens.reduceMotion ? <Animated.View style={[{ position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, backgroundColor: tokens.colors.danger }, halo]} /> : null}
        <View
          style={{
            width: RING,
            height: RING,
            borderRadius: RING / 2,
            borderWidth: 8,
            borderColor: tokens.colors.danger,
            backgroundColor: tokens.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="largeTitle" weight="700" tone="danger" maxFontSizeMultiplier={1.4} style={{ fontSize: 52, lineHeight: 60 }}>
            {String(seconds)}
          </Text>
        </View>
      </View>
      <View style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: tokens.colors.dangerSoft, overflow: 'hidden' }}>
        <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: tokens.colors.danger }} />
      </View>
      <Text variant="headline" align="center">
        {label}
      </Text>
    </View>
  );
}
