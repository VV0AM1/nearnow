import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { Button, useColors } from './ui';

/** "Use my location" / "Choose a city" with every permission outcome handled. */
export function AreaChooser({ onChosen, showCityButton = true }: { onChosen: () => void; showCityButton?: boolean }) {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const { locateDevice, setArea } = useArea();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<'denied' | 'blocked' | 'unavailable' | null>(null);

  const pickDeviceLocation = async () => {
    setBusy(true);
    setProblem(null);
    const res = await locateDevice();
    setBusy(false);
    if (res.ok) {
      setArea(res.area);
      onChosen();
    } else {
      setProblem(res.reason);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Button title={busy ? t('onboarding.locating') : t('onboarding.useLocation')} icon="navigate" onPress={pickDeviceLocation} loading={busy} />
      {showCityButton ? <Button title={t('onboarding.chooseCity')} icon="business-outline" variant="secondary" onPress={() => router.push('/city-picker')} /> : null}
      {problem ? (
        <View accessibilityLiveRegion="polite" style={{ gap: 8 }}>
          <Text style={{ color: c.warning }}>
            {problem === 'denied' ? t('onboarding.locationDenied') : problem === 'blocked' ? t('onboarding.locationBlocked') : t('onboarding.locationUnavailable')}
          </Text>
          {problem === 'blocked' ? <Button title={t('onboarding.openSettings')} variant="ghost" onPress={() => void Linking.openSettings()} /> : null}
        </View>
      ) : null}
    </View>
  );
}
