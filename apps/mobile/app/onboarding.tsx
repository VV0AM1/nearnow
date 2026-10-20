import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { Button, Icon, Text, continuous, useTokens, type IoniconName } from '@/design';
import { AreaChooser } from '@/components/AreaChooser';

type Page = 'intro' | 'area';

export default function Onboarding() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { completeOnboarding } = useArea();
  const [page, setPage] = useState<Page>('intro');
  const enter = tokens.reduceMotion ? FadeIn.duration(150) : FadeInRight.springify().damping(22);

  const points: [IoniconName, string, string][] = [
    ['newspaper', t('onboarding.point1'), '#2459E0'],
    ['time', t('onboarding.point2'), '#34C759'],
    ['hand-left', t('onboarding.point3'), '#FF9500'],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <Dots page={page} />
      {page === 'intro' ? (
        <Animated.View key="intro" entering={FadeIn.duration(200)} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: tokens.space.xl, gap: tokens.space.xl, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', gap: tokens.space.md }}>
              <View style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: tokens.colors.accent, alignItems: 'center', justifyContent: 'center', ...continuous }}>
                <Icon name="location" size={44} color={tokens.colors.onAccent} />
              </View>
              <Text variant="largeTitle" weight="700" align="center">
                {t('onboarding.title')}
              </Text>
            </View>
            <View style={{ gap: tokens.space.lg }}>
              {points.map(([icon, text, color]) => (
                <View key={icon} style={{ flexDirection: 'row', gap: tokens.space.lg, alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center', ...continuous }}>
                    <Icon name={icon} size={22} color={color} />
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>
                    {text}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={{ padding: tokens.space.xl }}>
            <Button title={t('common.next')} size="large" block onPress={() => setPage('area')} />
          </View>
        </Animated.View>
      ) : (
        <Animated.View key="area" entering={enter} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: tokens.space.xl, gap: tokens.space.lg }}>
            <Text variant="title1" weight="700">
              {t('onboarding.chooseArea')}
            </Text>
            <AreaChooser
              onChosen={() => {
                completeOnboarding();
                router.replace('/(app)/home');
              }}
            />
            <View style={{ flexDirection: 'row', gap: tokens.space.sm, alignItems: 'flex-start', marginTop: tokens.space.sm }}>
              <Icon name="notifications-off-outline" size={16} color={tokens.colors.labelSecondary} />
              <Text variant="footnote" tone="secondary" style={{ flex: 1 }}>
                {t('onboarding.notificationsNote')}
              </Text>
            </View>
          </ScrollView>
          <View style={{ padding: tokens.space.xl }}>
            <Button title={t('common.back')} variant="plain" block onPress={() => setPage('intro')} />
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function Dots({ page }: { page: Page }) {
  const tokens = useTokens();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: tokens.space.md }}>
      {(['intro', 'area'] as Page[]).map((p) => (
        <View key={p} style={{ width: p === page ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: p === page ? tokens.colors.accent : tokens.colors.separator }} />
      ))}
    </View>
  );
}
