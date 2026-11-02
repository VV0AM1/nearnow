import React, { useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { Banner, Button, Icon, PressableScale, Text, continuous, elevation, useTokens, type IoniconName } from '@/design';

function Tile({ icon, title, subtitle, onPress, busy, primary }: { icon: IoniconName; title: string; subtitle?: string; onPress: () => void; busy?: boolean; primary?: boolean }) {
  const t = useTokens();
  return (
    <PressableScale
      onPress={onPress}
      disabled={busy}
      haptic
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={{ busy: !!busy }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space.md,
        padding: t.space.lg,
        minHeight: 76,
        borderRadius: t.radius.lg,
        backgroundColor: t.colors.surface,
        borderWidth: primary ? 1.5 : 0,
        borderColor: t.colors.accent,
        ...continuous,
        ...elevation(1, t.scheme),
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: primary ? t.colors.accent : t.colors.accentSoft, alignItems: 'center', justifyContent: 'center', ...continuous }}>
        {busy ? <ActivityIndicator color={primary ? t.colors.onAccent : t.colors.accent} /> : <Icon name={icon} size={22} color={primary ? t.colors.onAccent : t.colors.accent} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="headline">{title}</Text>
        {subtitle ? (
          <Text variant="footnote" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-forward" size={16} color={t.colors.labelTertiary} />
    </PressableScale>
  );
}

/** "Use my location" / "Choose a city" as large tiles, with every permission outcome handled. */
export function AreaChooser({ onChosen, showCityButton = true }: { onChosen: () => void; showCityButton?: boolean }) {
  const { t } = useI18n();
  const tokens = useTokens();
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
    <View style={{ gap: tokens.space.md }}>
      <Tile icon="navigate" title={busy ? t('onboarding.locating') : t('onboarding.useLocation')} subtitle={t('onboarding.areaHint')} onPress={pickDeviceLocation} busy={busy} primary />
      {showCityButton ? <Tile icon="business-outline" title={t('onboarding.chooseCity')} onPress={() => router.push('/city-picker')} /> : null}
      {problem ? (
        <View style={{ gap: tokens.space.sm }}>
          <Banner
            tone="warning"
            icon="location-outline"
            message={problem === 'denied' ? t('onboarding.locationDenied') : problem === 'blocked' ? t('onboarding.locationBlocked') : t('onboarding.locationUnavailable')}
          />
          {problem === 'blocked' ? <Button title={t('onboarding.openSettings')} variant="plain" onPress={() => void Linking.openSettings()} /> : null}
        </View>
      ) : null}
    </View>
  );
}
