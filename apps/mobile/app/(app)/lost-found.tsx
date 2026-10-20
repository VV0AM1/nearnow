import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import type { LostFoundDirection } from '@/lib/types';
import { useFeed } from '@/hooks/useFeed';
import { FeedPost } from '@/components/FeedPost';
import { Button, Chip, StateView, useColors } from '@/components/ui';
import { RADIUS_OPTIONS_KM } from '@/constants/places';

export default function LostFound() {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const { area } = useArea();
  const [direction, setDirection] = useState<LostFoundDirection | null>(null);
  const [radius, setRadius] = useState(5);

  const query = useMemo(
    () => (area ? { latitude: area.latitude, longitude: area.longitude, radius, categories: ['LOST_FOUND' as const], lostFoundDirection: direction ?? undefined } : null),
    [area, radius, direction],
  );
  const feed = useFeed(query);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text accessibilityRole="header" style={{ color: c.text, fontSize: 24, fontWeight: '800' }}>
            {t('lostFound.title')}
          </Text>
          <Button title={t('lostFound.requests')} variant="ghost" onPress={() => router.push('/contact-requests')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip label={t('lostFound.all')} selected={!direction} onPress={() => setDirection(null)} />
          <Chip label={t('lostFound.lost')} selected={direction === 'LOST'} onPress={() => setDirection('LOST')} />
          <Chip label={t('lostFound.found')} selected={direction === 'FOUND'} onPress={() => setDirection('FOUND')} />
          {RADIUS_OPTIONS_KM.filter((r) => r >= 2).map((r) => (
            <Chip key={r} label={t('common.km', { km: r })} selected={radius === r} onPress={() => setRadius(r)} />
          ))}
        </View>
        <Button title={t('lostFound.report')} icon="add" onPress={() => router.push('/(app)/create')} />
      </View>
      <FlatList
        data={feed.posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <FeedPost item={item} />}
        onEndReached={feed.loadMore}
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} tintColor={c.primary} />}
        ListEmptyComponent={
          feed.error ? (
            <StateView kind="error" title={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.retry} />
          ) : feed.loading ? (
            <StateView kind="loading" />
          ) : (
            <StateView kind="empty" icon="search-outline" title={t('lostFound.emptyTitle')} body={t('lostFound.emptyBody')} />
          )
        }
        ListFooterComponent={feed.loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
