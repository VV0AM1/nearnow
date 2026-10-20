import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import type { LostFoundDirection } from '@/lib/types';
import { useFeed } from '@/hooks/useFeed';
import { FeedPost, FeedPostSkeleton } from '@/components/FeedPost';
import { Chip, IconButton, SegmentedControl, StateView, Text, useTokens } from '@/design';
import { RADIUS_OPTIONS_KM } from '@/constants/places';

type DirectionFilter = 'ALL' | LostFoundDirection;

export default function LostFound() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { area } = useArea();
  const [direction, setDirection] = useState<DirectionFilter>('ALL');
  const [radius, setRadius] = useState(5);

  const query = useMemo(
    () =>
      area
        ? { latitude: area.latitude, longitude: area.longitude, radius, categories: ['LOST_FOUND' as const], lostFoundDirection: direction === 'ALL' ? undefined : direction }
        : null,
    [area, radius, direction],
  );
  const feed = useFeed(query);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('lostFound.title'),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton icon="mail-outline" label={t('lostFound.requests')} onPress={() => router.push('/contact-requests')} />
              <IconButton icon="add" label={t('lostFound.report')} color={tokens.colors.accent} onPress={() => router.push('/(app)/create')} />
            </View>
          ),
        }}
      />
      <FlatList
        data={feed.posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <FeedPost item={item} />}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: tokens.colors.background }}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} tintColor={tokens.colors.accent} colors={[tokens.colors.accent]} />}
        ListHeaderComponent={
          <View style={{ gap: tokens.space.md, paddingTop: tokens.space.sm, paddingBottom: tokens.space.md }}>
            <View style={{ paddingHorizontal: tokens.space.lg }}>
              <SegmentedControl<DirectionFilter>
                accessibilityLabel={t('lostFound.title')}
                options={[
                  { value: 'ALL', label: t('lostFound.all') },
                  { value: 'LOST', label: t('lostFound.lost') },
                  { value: 'FOUND', label: t('lostFound.found') },
                ]}
                value={direction}
                onChange={setDirection}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: tokens.space.lg, gap: tokens.space.sm }}>
              {RADIUS_OPTIONS_KM.filter((r) => r >= 2).map((r) => (
                <Chip key={r} label={t('common.km', { km: r })} selected={radius === r} onPress={() => setRadius(r)} />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          feed.error ? (
            <StateView kind="error" title={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.retry} />
          ) : feed.loading ? (
            <View accessible accessibilityLabel={t('common.loading')}>
              <FeedPostSkeleton />
              <FeedPostSkeleton />
            </View>
          ) : (
            <StateView kind="empty" icon="search-outline" title={t('lostFound.emptyTitle')} body={t('lostFound.emptyBody')} actionLabel={t('lostFound.report')} onAction={() => router.push('/(app)/create')} />
          )
        }
        ListFooterComponent={
          feed.loadingMore ? (
            <ActivityIndicator style={{ padding: tokens.space.lg }} color={tokens.colors.accent} />
          ) : feed.posts.length && !feed.hasMore ? (
            <Text variant="footnote" tone="secondary" align="center" style={{ padding: tokens.space.lg }}>
              {t('feed.end')}
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: tokens.space.xl, flexGrow: 1 }}
      />
    </>
  );
}
