import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { StateView, useColors } from '@/components/ui';

export default function NotFoundScreen() {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
      <Stack.Screen options={{ title: '' }} />
      <StateView kind="empty" icon="help-circle-outline" title={t('error.notFound')} actionLabel={t('tabs.feed')} onAction={() => router.replace('/(app)/home')} />
    </View>
  );
}
