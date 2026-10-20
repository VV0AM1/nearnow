import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { useFeed } from '@/hooks/useFeed';
import { FeedPost } from '@/components/FeedPost';
import { AreaHeader } from '@/components/AreaHeader';
import { FilterBar, FilterSummary, type Filters } from '@/components/FilterBar';
import { Field, StateView, useColors } from '@/components/ui';
import { RADIUS_OPTIONS_KM } from '@/constants/places';

export default function Home() {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const { area, radiusKm, setRadiusKm } = useArea();
  const [filters, setFilters] = useState<Filters>({ category: null, since: 'all', radiusKm });
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 400);
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

  const empty = feed.error ? (
    <StateView kind="error" title={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.retry} />
  ) : feed.loading ? (
    <StateView kind="loading" />
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <AreaHeader />
      <View style={{ paddingHorizontal: 16 }}>
        <Field
          label={t('feed.search')}
          value={search}
          onChangeText={setSearch}
          placeholder={t('feed.search')}
          returnKeyType="search"
          max={100}
          right={
            search ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('feed.clearFilters')} onPress={() => setSearch('')} style={{ padding: 12 }}>
                <Ionicons name="close-circle" size={20} color={c.muted} />
              </Pressable>
            ) : null
          }
        />
      </View>
      <FilterBar value={filters} onChange={changeFilters} />
      <FilterSummary value={filters} onClear={() => changeFilters({ category: null, since: 'all', radiusKm: filters.radiusKm })} />
      <FlatList
        data={feed.posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <FeedPost item={item} />}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} tintColor={c.primary} />}
        ListHeaderComponent={
          <Pressable accessibilityRole="button" onPress={() => router.push('/area')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 8, minHeight: 36 }}>
            <Ionicons name="stats-chart-outline" size={16} color={c.primary} />
            <Text style={{ color: c.primary, fontWeight: '600' }}>{t('feed.areaActivity')}</Text>
          </Pressable>
        }
        ListEmptyComponent={empty}
        ListFooterComponent={
          feed.loadingMore ? (
            <ActivityIndicator style={{ padding: 16 }} color={c.primary} />
          ) : feed.error && feed.posts.length ? (
            <StateView kind="error" title={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.loadMore} />
          ) : feed.posts.length && !feed.hasMore ? (
            <Text style={{ color: c.muted, textAlign: 'center', padding: 16 }}>{t('feed.end')}</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
