import { ScrollView, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import type { TimeWindow } from '@/lib/types';
import { CATEGORY_META, CATEGORY_ORDER } from '@/constants/categories';
import { RADIUS_OPTIONS_KM } from '@/constants/places';
import { setMapFilters, useMapFilters } from '@/hooks/useMapFilters';
import { DEFAULT_MAP_FILTERS } from '@/components/FilterBar';
import { Button, Chip, Text, useTokens } from '@/design';

const TIMES: TimeWindow[] = ['24h', '7d', '30d', 'all'];

/** Native form sheet (medium / large detents) with every map filter; changes apply live. */
export default function MapFiltersSheet() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { radiusKm } = useArea();
  const filters = useMapFilters({ ...DEFAULT_MAP_FILTERS, radiusKm });
  const set = (patch: Partial<typeof filters>) => setMapFilters({ ...filters, ...patch });

  return (
    <ScrollView style={{ backgroundColor: tokens.colors.background }} contentContainerStyle={{ padding: tokens.space.lg, gap: tokens.space.lg }}>
      <Stack.Screen options={{ headerRight: () => <Button title={t('common.done')} variant="plain" onPress={() => router.back()} /> }} />

      <View style={{ gap: tokens.space.sm }}>
        <Text variant="headline">{t('feed.radius')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
          {RADIUS_OPTIONS_KM.map((km) => (
            <Chip key={km} label={t('common.km', { km })} selected={filters.radiusKm === km} onPress={() => set({ radiusKm: km })} />
          ))}
        </View>
      </View>

      <View style={{ gap: tokens.space.sm }}>
        <Text variant="headline">{t('map.time')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
          {TIMES.map((w) => (
            <Chip key={w} label={t(`time.${w}`)} selected={filters.since === w} onPress={() => set({ since: w })} />
          ))}
        </View>
      </View>

      <View style={{ gap: tokens.space.sm }}>
        <Text variant="headline">{t('map.category')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
          <Chip label={t('category.all')} selected={!filters.category} onPress={() => set({ category: null })} />
          {CATEGORY_ORDER.map((id) => (
            <Chip
              key={id}
              label={t(CATEGORY_META[id].label)}
              icon={CATEGORY_META[id].icon}
              color={CATEGORY_META[id].color}
              selected={filters.category === id}
              onPress={() => set({ category: filters.category === id ? null : id })}
            />
          ))}
        </View>
      </View>

      <Button title={t('feed.clearFilters')} variant="tinted" block onPress={() => set({ ...DEFAULT_MAP_FILTERS, radiusKm })} />
    </ScrollView>
  );
}
