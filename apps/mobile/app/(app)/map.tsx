import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { formatKm } from '@/lib/format';
import type { FromMap } from '@/lib/map-bridge';
import type { Post } from '@/lib/types';
import { useFeed } from '@/hooks/useFeed';
import { CATEGORY_META, CATEGORY_ORDER } from '@/constants/categories';
import { NativeMap, type NearMapHandle } from '@/components/map/NativeMap';
import { MarkerPin } from '@/components/map/MarkerPin';
import { FilterBar, type Filters } from '@/components/FilterBar';
import { CategoryBadge, TrustLine } from '@/components/PostStatus';
import { Banner, Button, GlassSurface, IconButton, Text, useTokens } from '@/design';

const MAP_LIMIT = 100;

export default function MapScreen() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string; lat?: string; lng?: string }>();
  const { area, radiusKm } = useArea();
  const map = useRef<NearMapHandle>(null);

  const [filters, setFilters] = useState<Filters>({ category: null, since: '7d', radiusKm });
  const [center, setCenter] = useState(area ? { lat: area.latitude, lng: area.longitude } : null);
  const [pending, setPending] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);
  const [selected, setSelected] = useState<Post | null>(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [legend, setLegend] = useState(false);

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
      .then((res) => setSelected(res.data))
      .catch(() => undefined);
  }, [params.focus, params.lat, params.lng]);

  const onMessage = useCallback(
    (msg: FromMap) => {
      if (msg.type === 'MARKER_PRESS') setSelected(feed.posts.find((p) => p.id === msg.id) ?? null);
      else if (msg.type === 'TILE_ERROR') setTilesFailed(true);
      else if (msg.type === 'MOVE_END' && msg.byUser) setPending({ lat: msg.lat, lng: msg.lng, radiusKm: msg.radiusKm });
    },
    [feed.posts],
  );

  const searchHere = () => {
    if (!pending) return;
    const r = Math.min(50, Math.max(0.5, Math.round(pending.radiusKm * 10) / 10));
    setFilters((f) => ({ ...f, radiusKm: r }));
    setCenter({ lat: pending.lat, lng: pending.lng });
    setPending(null);
  };

  const recenter = () => {
    if (!area) return;
    setCenter({ lat: area.latitude, lng: area.longitude });
    setPending(null);
    map.current?.send({ type: 'SET_VIEW', lat: area.latitude, lng: area.longitude, zoom: 14 });
  };

  if (!area || !center) return null; // route guard sends users without an area to onboarding

  return (
    // iOS native tabs draw over content, so the floating callout keeps clear of the tab bar.
    <SafeAreaView edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']} style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <View style={{ paddingTop: tokens.space.sm }}>
        <FilterBar value={filters} onChange={setFilters} />
      </View>
      <View style={{ flex: 1 }}>
        <NativeMap ref={map} initial={{ lat: center.lat, lng: center.lng, zoom: 14 }} onMessage={onMessage} accessibilityLabel={t('tabs.map')} />

        <View style={{ position: 'absolute', top: tokens.space.sm, left: tokens.space.md, right: tokens.space.md, gap: tokens.space.sm }} pointerEvents="box-none">
          {tilesFailed ? <Banner tone="warning" icon="cloud-offline-outline" message={t('map.tilesFailed')} /> : null}
          {feed.error ? <Banner tone="warning" icon="alert-circle-outline" message={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.retry} /> : null}
          {feed.posts.length >= MAP_LIMIT ? <Banner icon="information-circle-outline" message={t('map.tooMany')} /> : null}
          {pending ? (
            <View style={{ alignItems: 'center' }} pointerEvents="box-none">
              <Button title={t('map.searchArea')} icon="search" size="small" onPress={searchHere} haptic />
            </View>
          ) : null}
        </View>

        <View style={{ position: 'absolute', right: tokens.space.md, bottom: selected ? 230 : tokens.space.lg, gap: tokens.space.sm }}>
          <GlassSurface style={{ borderRadius: tokens.radius.pill }}>
            <IconButton icon="locate" label={t('map.recenter')} onPress={recenter} />
            <IconButton icon="list-outline" label={t('map.legend')} selected={legend} onPress={() => setLegend((v) => !v)} />
          </GlassSurface>
        </View>

        {legend ? (
          <View style={{ position: 'absolute', left: tokens.space.md, bottom: selected ? 230 : tokens.space.lg }}>
            <GlassSurface style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
              {CATEGORY_ORDER.map((id) => (
                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm }}>
                  <MarkerPin color={CATEGORY_META[id].color} shape={CATEGORY_META[id].shape} dim={false} />
                  <Text variant="subheadline">{t(CATEGORY_META[id].label)}</Text>
                </View>
              ))}
              <Text variant="footnote" tone="secondary" style={{ marginTop: tokens.space.xs }}>
                {t('map.showing', { count: feed.posts.length })}
              </Text>
            </GlassSurface>
          </View>
        ) : null}

        {selected ? (
          <View style={{ position: 'absolute', left: tokens.space.md, right: tokens.space.md, bottom: tokens.space.md }}>
            <GlassSurface style={{ padding: tokens.space.lg, gap: tokens.space.sm, borderRadius: tokens.radius.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <CategoryBadge post={selected} />
                <IconButton icon="close" label={t('common.close')} size={18} onPress={() => setSelected(null)} />
              </View>
              <Text variant="headline" numberOfLines={2}>
                {selected.title}
              </Text>
              <TrustLine post={selected} />
              {selected.distanceKm !== undefined ? (
                <Text variant="footnote" tone="secondary">
                  {t('post.distance', { km: formatKm(selected.distanceKm) })}
                </Text>
              ) : null}
              <Button title={t('map.viewDetails')} block onPress={() => router.push({ pathname: '/post/[id]', params: { id: selected.id } })} />
            </GlassSurface>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
