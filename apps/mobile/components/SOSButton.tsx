import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { config } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import type { CreatedPost } from '@/lib/types';
import { Button, useColors } from './ui';

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
  const c = useColors();
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('urgent.button')}
        onPress={() => setPhase('info')}
        style={{ minHeight: 44, paddingHorizontal: 10, borderRadius: 22, borderWidth: 1, borderColor: c.danger, flexDirection: 'row', alignItems: 'center', gap: 4 }}
      >
        <Ionicons name="alert-circle-outline" size={18} color={c.danger} />
        <Text style={{ color: c.danger, fontWeight: '700', fontSize: 13 }}>{t('urgent.button')}</Text>
      </Pressable>

      <Modal visible={phase !== 'closed'} animationType="slide" transparent onRequestClose={phase === 'sending' ? undefined : close}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ScrollView style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }} contentContainerStyle={{ padding: 20, gap: 14 }}>
            <Text accessibilityRole="header" style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>
              {phase === 'result' ? t('urgent.resultTitle') : t('urgent.title')}
            </Text>

            <View style={{ backgroundColor: c.dark ? '#3b0d0d' : '#fef2f2', borderRadius: 12, padding: 12, gap: 6 }}>
              <Text style={{ color: c.danger, fontWeight: '700' }}>{t('urgent.callFirst', { number })}</Text>
              <Text style={{ color: c.text }}>{t('urgent.notEmergency')}</Text>
            </View>
            <Button title={t('urgent.call', { number })} icon="call" variant="danger" onPress={call} />

            {phase === 'info' ? (
              <>
                <Text style={{ color: c.muted, lineHeight: 20 }}>{t('urgent.explain')}</Text>
                <Button title={t('urgent.post')} variant="secondary" icon="megaphone-outline" onPress={start} />
                <Button title={t('common.cancel')} variant="ghost" onPress={close} />
              </>
            ) : null}

            {phase === 'locating' ? <Button title={t('onboarding.locating')} loading variant="secondary" onPress={() => undefined} /> : null}

            {phase === 'countdown' ? (
              <>
                <Text accessibilityLiveRegion="assertive" style={{ color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
                  {t('urgent.countdown', { s: seconds })}
                </Text>
                <Button title={t('urgent.cancel')} variant="secondary" icon="close" onPress={close} />
              </>
            ) : null}

            {phase === 'sending' ? <Button title={t('urgent.sending')} loading variant="secondary" onPress={() => undefined} /> : null}

            {phase === 'result' && result ? (
              <>
                <Text style={{ color: c.text, lineHeight: 22 }}>{notified > 0 ? t('urgent.resultNotified', { n: notified }) : t('urgent.resultNone')}</Text>
                <Text style={{ color: c.danger, fontWeight: '700' }}>{t('urgent.resultReminder', { number })}</Text>
                <Button
                  title={t('map.viewDetails')}
                  variant="secondary"
                  onPress={() => {
                    close();
                    router.push({ pathname: '/post/[id]', params: { id: result.id } });
                  }}
                />
                <Button title={t('common.close')} variant="ghost" onPress={close} />
              </>
            ) : null}

            {phase === 'error' ? (
              <>
                <Text accessibilityLiveRegion="assertive" style={{ color: c.danger, fontWeight: '600' }}>
                  {errorText}
                </Text>
                <Button title={t('common.retry')} variant="secondary" onPress={start} />
                <Button title={t('common.close')} variant="ghost" onPress={close} />
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
