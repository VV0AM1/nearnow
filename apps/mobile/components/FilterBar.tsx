import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CATEGORY_META, CATEGORY_ORDER } from '@/constants/categories';
import { RADIUS_OPTIONS_KM } from '@/constants/places';
import { useI18n } from '@/lib/i18n';
import type { Category, TimeWindow } from '@/lib/types';
import { Chip } from '@/design';
import { useColors } from './ui';

export interface Filters {
  category: Category | null;
  since: TimeWindow;
  radiusKm: number;
}

const TIMES: TimeWindow[] = ['24h', '7d', '30d', 'all'];

/** Map defaults: recent posts only, so the map shows what is current. */
export const DEFAULT_MAP_FILTERS: Omit<Filters, 'radiusKm'> = { category: null, since: '7d' };

/** One filter surface shared by feed and map; every option changes the server query. */
export function FilterBar({ value, onChange, showCategories = true }: { value: Filters; onChange: (f: Filters) => void; showCategories?: boolean }) {
  const { t } = useI18n();
  const c = useColors();
  const row = { paddingHorizontal: 16, gap: 8, paddingBottom: 8 };
  return (
    <View>
      {showCategories ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={row}>
          <Chip label={t('category.all')} selected={!value.category} onPress={() => onChange({ ...value, category: null })} />
          {CATEGORY_ORDER.map((id) => (
            <Chip
              key={id}
              label={t(CATEGORY_META[id].label)}
              color={CATEGORY_META[id].color}
              icon={CATEGORY_META[id].icon}
              selected={value.category === id}
              onPress={() => onChange({ ...value, category: value.category === id ? null : id })}
            />
          ))}
        </ScrollView>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={row}>
        {TIMES.map((w) => (
          <Chip key={w} label={t(`time.${w}`)} selected={value.since === w} onPress={() => onChange({ ...value, since: w })} />
        ))}
        <View style={{ width: 1, backgroundColor: c.border, marginHorizontal: 4 }} />
        {RADIUS_OPTIONS_KM.map((km) => (
          <Chip key={km} label={t('common.km', { km })} selected={value.radiusKm === km} onPress={() => onChange({ ...value, radiusKm: km })} />
        ))}
      </ScrollView>
    </View>
  );
}

export function FilterSummary({ value, onClear }: { value: Filters; onClear: () => void }) {
  const { t } = useI18n();
  const c = useColors();
  const isDefault = !value.category && value.since === 'all';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 }}>
      <Text style={{ color: c.muted, fontSize: 12, flex: 1 }} accessibilityLiveRegion="polite">
        {t('feed.showing', {
          category: value.category ? t(CATEGORY_META[value.category].label) : t('category.all'),
          time: t(`time.${value.since}`),
          km: value.radiusKm,
        })}
      </Text>
      {!isDefault ? (
        <Text accessibilityRole="button" onPress={onClear} style={{ color: c.primary, fontWeight: '600', padding: 8 }}>
          {t('feed.clearFilters')}
        </Text>
      ) : null}
    </View>
  );
}
