import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { formatKm, timeAgo } from '@/lib/format';
import type { FromMap } from '@/lib/map-bridge';
import type { Post } from '@/lib/types';
import { useFeed } from '@/hooks/useFeed';
import { setMapFilters, useMapFilters } from '@/hooks/useMapFilters';
import { CATEGORY_META, CATEGORY_ORDER } from '@/constants/categories';
import { NativeMap, type NearMapHandle } from '@/components/map/NativeMap';
import { MarkerPin } from '@/components/map/MarkerPin';
import { DEFAULT_MAP_FILTERS } from '@/components/FilterBar';
import { CategoryBadge, TrustLine } from '@/components/PostStatus';
import { Banner, Button, DetentSheet, GlassSurface, Icon, IconButton, PressableScale, StateView, Text, useTokens } from '@/design';

const MAP_LIMIT = 100;
const PEEK = 92;

export default function MapScreen() {
  const { t, dateLocale } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string; lat?: string; lng?: string }>();
  const { area, radiusKm } = useArea();
  const map = useRef<NearMapHandle>(null);
  const list = useRef<FlatList<Post>>(null);

  const filters = useMapFilters({ ...DEFAULT_MAP_FILTERS, radiusKm });
  const [center, setCenter] = useState(area ? { lat: area.latitude, lng: area.longitude } : null);
  const [pending, setPending] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);
  const [selected, setSelected] = useState<Post | null>(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [legend, setLegend] = useState(false);
  const [height, setHeight] = useState(0);
  const [sheetIndex, setSheetIndex] = useState(0);

  const query = useMemo(
    () =>
      center
        ? {
            latitude: center.lat,
            longitude: center.lng,
            radius: filters.radiusKm,
            categories: filters.category ? [filters.category] : undefined,
            since: filters.since,
            limit: MAP_LIMIT,
          }
        : null,
    [center, filters],
  );
  const feed = useFeed(query);

  useEffect(() => {
    if (!center && area) setCenter({ lat: area.latitude, lng: area.longitude });
  }, [area, center]);

  // Markers change only when results change — not on every UI state update.
  useEffect(() => {
    map.current?.send({
      type: 'SET_MARKERS',
      markers: feed.posts.map((p) => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        color: CATEGORY_META[p.category].color,
        shape: CATEGORY_META[p.category].shape,
        dim: p.status !== 'ACTIVE' || p.isStale,
        label: `${t(CATEGORY_META[p.category].label)}: ${p.title}`,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels follow the language, results drive updates
  }, [feed.posts]);

  useEffect(() => {
    if (center) map.current?.send({ type: 'SET_AREA', lat: center.lat, lng: center.lng, radiusKm: filters.radiusKm });
  }, [center, filters.radiusKm]);

  // "View on map" from a post: focus it without replacing the user's area.
  useEffect(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (!params.focus || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setCenter({ lat, lng });
    map.current?.send({ type: 'SET_VIEW', lat, lng, zoom: 16 });
    api
      .get<Post>(`/posts/${params.focus}`)
      .then((res) => {
        setSelected(res.data);
        setSheetIndex(1);
      })
      .catch(() => undefined);
  }, [params.focus, params.lat, params.lng]);

  const select = useCallback((post: Post | null) => {
    setSelected(post);
    if (post) {
      setSheetIndex((i) => Math.max(i, 1));
      list.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, []);

  const onMessage = useCallback(
    (msg: FromMap) => {
      if (msg.type === 'MARKER_PRESS') select(feed.posts.find((p) => p.id === msg.id) ?? null);
      else if (msg.type === 'TILE_ERROR') setTilesFailed(true);
      else if (msg.type === 'MOVE_END' && msg.byUser) setPending({ lat: msg.lat, lng: msg.lng, radiusKm: msg.radiusKm });
    },
    [feed.posts, select],
  );

  const searchHere = () => {
    if (!pending) return;
    const r = Math.min(50, Math.max(0.5, Math.round(pending.radiusKm * 10) / 10));
    setMapFilters({ ...filters, radiusKm: r });
    setCenter({ lat: pending.lat, lng: pending.lng });
    setPending(null);
  };

  const recenter = () => {
    if (!area) return;
    setCenter({ lat: area.latitude, lng: area.longitude });
    setPending(null);
    map.current?.send({ type: 'SET_VIEW', lat: area.latitude, lng: area.longitude, zoom: 14 });
  };

  const focusPost = (post: Post) => {
    select(post);
    map.current?.send({ type: 'SET_VIEW', lat: post.latitude, lng: post.longitude, zoom: 16 });
  };

  if (!area || !center) return null; // route guard sends users without an area to onboarding

  const detents = height ? [PEEK, Math.round(height * 0.45), height - tokens.space.sm] : [PEEK];
  const filterSummary = [filters.category ? t(CATEGORY_META[filters.category].label) : null, t(`time.${filters.since}`), t('common.km', { km: filters.radiusKm })].filter(Boolean).join(' · ');
  const filtersActive = filters.category !== DEFAULT_MAP_FILTERS.category || filters.since !== DEFAULT_MAP_FILTERS.since;
  const controlsBottom = PEEK + tokens.space.md;

  return (
    // iOS native tabs draw over content, so the sheet keeps clear of the tab bar.
    <SafeAreaView edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']} style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <View style={{ flex: 1 }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
        <NativeMap ref={map} initial={{ lat: center.lat, lng: center.lng, zoom: 14 }} onMessage={onMessage} accessibilityLabel={t('tabs.map')} />

        {/* Top: filters + status */}
        <View style={{ position: 'absolute', top: tokens.space.sm, left: tokens.space.md, right: tokens.space.md, gap: tokens.space.sm }} pointerEvents="box-none">
          <View style={{ flexDirection: 'row' }} pointerEvents="box-none">
            <GlassSurface style={{ borderRadius: tokens.radius.pill }}>
              <PressableScale
                accessibilityLabel={`${t('map.filters')}: ${filterSummary}`}
                onPress={() => router.push('/map-filters')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, paddingHorizontal: tokens.space.md, minHeight: tokens.minTouch }}
              >
                <Icon name="options-outline" size={18} color={filtersActive ? tokens.colors.accent : tokens.colors.label} />
                <Text variant="subheadline" weight="600" tone={filtersActive ? 'accent' : 'primary'} numberOfLines={1}>
                  {filterSummary}
                </Text>
              </PressableScale>
            </GlassSurface>
          </View>
          {tilesFailed ? <Banner tone="warning" icon="cloud-offline-outline" message={t('map.tilesFailed')} /> : null}
          {feed.error ? <Banner tone="warning" icon="alert-circle-outline" message={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.retry} /> : null}
          {pending ? (
            <View style={{ alignItems: 'center' }} pointerEvents="box-none">
              <Button title={t('map.searchArea')} icon="search" size="small" onPress={searchHere} haptic />
            </View>
          ) : null}
        </View>

        {/* Floating controls above the sheet's peek height */}
        <View style={{ position: 'absolute', right: tokens.space.md, bottom: controlsBottom }}>
          <GlassSurface style={{ borderRadius: tokens.radius.pill }}>
            <IconButton icon="locate" label={t('map.recenter')} onPress={recenter} />
            <IconButton icon="list-outline" label={t('map.legend')} selected={legend} onPress={() => setLegend((v) => !v)} />
          </GlassSurface>
        </View>
        {legend ? (
          <View style={{ position: 'absolute', left: tokens.space.md, bottom: controlsBottom }}>
            <GlassSurface style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
              {CATEGORY_ORDER.map((id) => (
                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm }}>
                  <MarkerPin color={CATEGORY_META[id].color} shape={CATEGORY_META[id].shape} dim={false} />
                  <Text variant="subheadline">{t(CATEGORY_META[id].label)}</Text>
                </View>
              ))}
            </GlassSurface>
          </View>
        ) : null}

        {height ? (
          <DetentSheet
            detents={detents}
            index={Math.min(sheetIndex, detents.length - 1)}
            onIndexChange={setSheetIndex}
            expandLabel={t('map.showList')}
            collapseLabel={t('map.hideList')}
            header={
              <View style={{ paddingHorizontal: tokens.space.lg, paddingBottom: tokens.space.md }}>
                <Text variant="headline" accessibilityLiveRegion="polite">
                  {feed.loading ? t('common.loading') : t('map.showing', { count: feed.posts.length })}
                </Text>
                <Text variant="footnote" tone="secondary" numberOfLines={1}>
                  {feed.posts.length >= MAP_LIMIT ? t('map.tooMany') : filterSummary}
                </Text>
              </View>
            }
          >
            <FlatList
              ref={list}
              data={feed.posts}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ paddingBottom: tokens.space.xxl }}
              ListHeaderComponent={selected ? <SelectedPost post={selected} onClose={() => select(null)} onOpen={() => router.push({ pathname: '/post/[id]', params: { id: selected.id } })} /> : null}
              ListEmptyComponent={!feed.loading && !feed.error ? <StateView kind="empty" title={t('feed.emptyTitle')} body={t('feed.emptyBody')} /> : null}
              ItemSeparatorComponent={() => <View style={{ height: 0.5, backgroundColor: tokens.colors.separator, marginLeft: 56 }} />}
              renderItem={({ item }) => (
                <PressableScale
                  scaleOnPress={false}
                  accessibilityLabel={`${t(CATEGORY_META[item.category].label)}: ${item.title}`}
                  accessibilityState={{ selected: selected?.id === item.id }}
                  onPress={() => focusPost(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: tokens.space.md,
                    paddingHorizontal: tokens.space.lg,
                    paddingVertical: tokens.space.md,
                    backgroundColor: selected?.id === item.id ? tokens.colors.accentSoft : 'transparent',
                  }}
                >
                  <MarkerPin color={CATEGORY_META[item.category].color} shape={CATEGORY_META[item.category].shape} dim={item.status !== 'ACTIVE' || item.isStale} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="subheadline" weight="600" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text variant="footnote" tone="secondary" numberOfLines={1}>
                      {[timeAgo(item.createdAt, dateLocale), item.distanceKm !== undefined ? t('post.distance', { km: formatKm(item.distanceKm) }) : null].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={14} color={tokens.colors.labelTertiary} />
                </PressableScale>
              )}
            />
          </DetentSheet>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function SelectedPost({ post, onClose, onOpen }: { post: Post; onClose: () => void; onOpen: () => void }) {
  const { t } = useI18n();
  const tokens = useTokens();
  return (
    <View style={{ marginHorizontal: tokens.space.lg, marginBottom: tokens.space.md, padding: tokens.space.lg, gap: tokens.space.sm, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surfaceSecondary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CategoryBadge post={post} />
        <IconButton icon="close" label={t('common.close')} size={18} onPress={onClose} />
      </View>
      <Text variant="headline">{post.title}</Text>
      <TrustLine post={post} />
      {post.distanceKm !== undefined ? (
        <Text variant="footnote" tone="secondary">
          {t('post.distance', { km: formatKm(post.distanceKm) })}
        </Text>
      ) : null}
      <Button title={t('map.viewDetails')} block onPress={onOpen} />
    </View>
  );
}
