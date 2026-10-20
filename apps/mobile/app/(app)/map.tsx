import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import { LeafletMap, type LeafletMapHandle } from '@/components/LeafletMap';
import { FilterBar, type Filters } from '@/components/FilterBar';
import { CategoryBadge, TrustLine } from '@/components/PostStatus';
import { Button, IconButton, useColors } from '@/components/ui';

const MAP_LIMIT = 100;
const SHAPE_SYMBOL = { circle: '●', square: '■', diamond: '◆', triangle: '▲' } as const;

export default function MapScreen() {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string; lat?: string; lng?: string }>();
  const { area, radiusKm } = useArea();
  const map = useRef<LeafletMapHandle>(null);

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
      })),
    });
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
    <SafeAreaView edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: 8 }}>
        <FilterBar value={filters} onChange={setFilters} />
      </View>
      <View style={{ flex: 1 }}>
        <LeafletMap ref={map} initial={{ lat: center.lat, lng: center.lng, zoom: 14 }} onMessage={onMessage} accessibilityLabel={t('tabs.map')} />

        <View style={{ position: 'absolute', top: 8, left: 8, right: 8, gap: 8 }} pointerEvents="box-none">
          {tilesFailed ? <Banner text={t('map.tilesFailed')} /> : null}
          {feed.error ? <Banner text={describeError(feed.error, t)} actionLabel={t('common.retry')} onAction={feed.retry} /> : null}
          {feed.posts.length >= MAP_LIMIT ? <Banner text={t('map.tooMany')} /> : null}
          {pending ? (
            <View style={{ alignItems: 'center' }}>
              <Button title={t('map.searchArea')} icon="search" onPress={searchHere} style={{ paddingHorizontal: 20 }} />
            </View>
          ) : null}
        </View>

        <View style={{ position: 'absolute', right: 12, bottom: selected ? 210 : 16, gap: 8 }}>
          <Fab icon="locate" label={t('map.recenter')} onPress={recenter} />
          <Fab icon="list-outline" label={t('map.legend')} onPress={() => setLegend((v) => !v)} />
        </View>

        {legend ? (
          <View style={{ position: 'absolute', left: 12, bottom: selected ? 210 : 16, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 12, gap: 4 }}>
            {CATEGORY_ORDER.map((id) => (
              <Text key={id} style={{ color: c.text }}>
                <Text style={{ color: CATEGORY_META[id].color }}>{SHAPE_SYMBOL[CATEGORY_META[id].shape]} </Text>
                {t(CATEGORY_META[id].label)}
              </Text>
            ))}
            <Text style={{ color: c.muted, marginTop: 4 }}>{t('map.showing', { count: feed.posts.length })}</Text>
          </View>
        ) : null}

        {selected ? (
          <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <CategoryBadge post={selected} />
              <IconButton icon="close" label={t('common.close')} onPress={() => setSelected(null)} />
            </View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }} numberOfLines={2}>
              {selected.title}
            </Text>
            <TrustLine post={selected} />
            {selected.distanceKm !== undefined ? <Text style={{ color: c.muted, fontSize: 12 }}>{t('post.distance', { km: formatKm(selected.distanceKm) })}</Text> : null}
            <Button title={t('map.viewDetails')} onPress={() => router.push({ pathname: '/post/[id]', params: { id: selected.id } })} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Banner({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  const c = useColors();
  return (
    <View accessibilityLiveRegion="polite" style={{ backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name="information-circle-outline" size={18} color={c.warning} />
      <Text style={{ color: c.text, flex: 1, fontSize: 13 }}>{text}</Text>
      {actionLabel && onAction ? (
        <Text accessibilityRole="button" onPress={onAction} style={{ color: c.primary, fontWeight: '700', padding: 4 }}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

function Fab({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={icon} size={22} color={c.text} />
    </Pressable>
  );
}
