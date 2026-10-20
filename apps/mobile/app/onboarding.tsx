import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/components/ui';
import { AreaChooser } from '@/components/AreaChooser';

export default function Onboarding() {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const { completeOnboarding } = useArea();

  const points: [keyof typeof Ionicons.glyphMap, string][] = [
    ['newspaper-outline', t('onboarding.point1')],
    ['time-outline', t('onboarding.point2')],
    ['hand-left-outline', t('onboarding.point3')],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 28, fontWeight: '800' }}>
          {t('onboarding.title')}
        </Text>
        {points.map(([icon, text]) => (
          <View key={icon} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Ionicons name={icon} size={24} color={c.primary} />
            <Text style={{ color: c.text, flex: 1, fontSize: 16, lineHeight: 22 }}>{text}</Text>
          </View>
        ))}
        <View style={{ height: 8 }} />
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>
          {t('onboarding.chooseArea')}
        </Text>
        <Text style={{ color: c.muted, lineHeight: 20 }}>{t('onboarding.areaHint')}</Text>
        <AreaChooser
          onChosen={() => {
            completeOnboarding();
            router.replace('/(app)/home');
          }}
        />
        <Text style={{ color: c.muted, fontSize: 13 }}>{t('onboarding.notificationsNote')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
