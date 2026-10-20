import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { useFeed } from '@/hooks/useFeed';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { FeedPost, FeedPostSkeleton } from '@/components/FeedPost';
import { FilterBar, FilterSummary, type Filters } from '@/components/FilterBar';
import { UrgentHelpButton } from '@/components/SOSButton';
import { Icon, IconButton, PressableScale, StateView, Text, useTokens } from '@/design';
import { RADIUS_OPTIONS_KM } from '@/constants/places';

export default function Home() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const unread = useUnreadCount();
  const { area, radiusKm, setRadiusKm } = useArea();
  const [filters, setFilters] = useState<Filters>({ category: null, since: 'all', radiusKm });
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim().slice(0, 100)), 400);
    return () => clearTimeout(id);
  }, [search]);

  const query = useMemo(
    () =>
      area
        ? {
            latitude: area.latitude,
            longitude: area.longitude,
            radius: filters.radiusKm,
            categories: filters.category ? [filters.category] : undefined,
            since: filters.since,
            search: debounced || undefined,
          }
        : null,
    [area, filters, debounced],
  );
  const feed = useFeed(query);

  const changeFilters = (f: Filters) => {
    setFilters(f);
    if (f.radiusKm !== radiusKm) setRadiusKm(f.radiusKm);
  };
  const nextRadius = RADIUS_OPTIONS_KM.find((r) => r > filters.radiusKm);
  const areaKind = area?.source === 'device' ? t('area.near') : t('area.chosen');
  const title = area?.label ?? areaKind;

  const refresh = () => {
    void Haptics.selectionAsync().catch(() => undefined);
    void feed.refresh();
  };

  const empty = feed.error ? (
    <StateView kind="error" title={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.retry} />
  ) : feed.loading ? (
    <View accessibilityLabel={t('common.loading')} accessible>
      <FeedPostSkeleton />
      <FeedPostSkeleton />
      <FeedPostSkeleton />
    </View>
  ) : (
    <StateView
      kind="empty"
      title={debounced ? t('feed.emptySearch', { q: debounced }) : t('feed.emptyTitle')}
      body={t('feed.emptyBody')}
      actionLabel={nextRadius ? t('feed.expandRadius', { km: nextRadius }) : t('feed.createFirst')}
      onAction={nextRadius ? () => changeFilters({ ...filters, radiusKm: nextRadius }) : () => router.push('/(app)/create')}
      secondaryLabel={t('area.change')}
      onSecondary={() => router.push('/city-picker')}
    />
  );

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <UrgentHelpButton />
              <IconButton icon="notifications-outline" label={t('notifications.title')} badge={unread} onPress={() => router.push('/notifications')} />
            </View>
          ),
          headerSearchBarOptions: {
            placeholder: t('feed.search'),
            hideWhenScrolling: true,
            autoCapitalize: 'none',
            onChangeText: (e) => setSearch(e.nativeEvent.text),
            onCancelButtonPress: () => setSearch(''),
          },
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
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={refresh} tintColor={tokens.colors.accent} colors={[tokens.colors.accent]} />}
        ListHeaderComponent={
          <View style={{ gap: tokens.space.sm, paddingTop: tokens.space.xs, paddingBottom: tokens.space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: tokens.space.lg }}>
              <PressableScale
                accessibilityLabel={`${areaKind}: ${title}. ${t('area.change')}`}
                onPress={() => router.push('/city-picker')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: tokens.minTouch }}
              >
                <Icon name={area?.source === 'device' ? 'navigate' : 'location'} size={15} color={tokens.colors.accent} />
                <Text variant="subheadline" tone="accent" weight="600">
                  {areaKind}
                </Text>
                <Icon name="chevron-down" size={13} color={tokens.colors.accent} />
              </PressableScale>
              <PressableScale onPress={() => router.push('/area')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: tokens.minTouch }}>
                <Icon name="stats-chart-outline" size={15} color={tokens.colors.accent} />
                <Text variant="subheadline" tone="accent" weight="600">
                  {t('feed.areaActivity')}
                </Text>
              </PressableScale>
            </View>
            <FilterBar value={filters} onChange={changeFilters} />
            <FilterSummary value={filters} onClear={() => changeFilters({ category: null, since: 'all', radiusKm: filters.radiusKm })} />
          </View>
        }
        ListEmptyComponent={empty}
        ListFooterComponent={
          feed.loadingMore ? (
            <ActivityIndicator style={{ padding: tokens.space.lg }} color={tokens.colors.accent} />
          ) : feed.error && feed.posts.length ? (
            <StateView kind="error" title={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.loadMore} />
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
