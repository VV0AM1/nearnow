import { useCallback, useEffect, useState } from 'react';
import { Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import api from '@/services/api';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { timeAgo } from '@/lib/format';
import { config } from '@/lib/config';
import type { AreaActivity, Category } from '@/lib/types';
import { CATEGORY_META } from '@/constants/categories';
import { Button, Card, Chip, SectionTitle, StateView, useColors } from '@/components/ui';

/**
 * Transparent "recent community posts" summary. Replaces the former safety ranking:
 * no scores, no "safe"/"dangerous" labels — counts, recency and the method are shown.
 */
export default function AreaOverview() {
  const { t, dateLocale } = useI18n();
  const c = useColors();
  const { area, radiusKm } = useArea();
  const [days, setDays] = useState<1 | 7 | 30>(7);
  const [data, setData] = useState<AreaActivity | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const radius = Math.min(25, radiusKm);

  const load = useCallback(async () => {
    if (!area) return;
    setError(null);
    try {
      const res = await api.get<AreaActivity>('/neighborhoods/activity', { params: { latitude: area.latitude, longitude: area.longitude, radius, days } });
      setData(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setRefreshing(false);
    }
  }, [area, radius, days]);
  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
    >
      <Text style={{ color: c.muted }}>{t('activity.intro', { label: area?.label ?? t('area.near') })}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([1, 7, 30] as const).map((d) => (
          <Chip key={d} label={t('activity.days', { n: d })} selected={days === d} onPress={() => setDays(d)} />
        ))}
      </View>

      {error ? (
        <StateView kind="error" title={describeError(error, t)} actionLabel={t('common.retry')} onAction={load} />
      ) : !data ? (
        <StateView kind="loading" />
      ) : (
        <>
          <Text style={{ color: c.text, fontWeight: '700' }}>{t('activity.total', { n: data.totalReports, days: data.windowDays, km: data.radiusKm })}</Text>
          {!data.areas.length ? <StateView kind="empty" title={t('activity.empty')} /> : null}
          {data.areas.map((a) => (
            <Card key={a.id ?? a.name} style={{ gap: 6 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>
                {a.name}
                {a.city ? <Text style={{ color: c.muted, fontWeight: '400' }}> · {a.city}</Text> : null}
              </Text>
              <Text style={{ color: c.muted, fontSize: 13 }}>
                {Object.entries(a.byCategory)
                  .map(([cat, n]) => `${t(CATEGORY_META[cat as Category].label)}: ${n}`)
                  .join(' · ')}
              </Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>
                {a.lastReportAt ? t('activity.lastReport', { time: timeAgo(a.lastReportAt, dateLocale) }) : ''}
                {a.resolved ? ` · ${t('activity.resolved', { n: a.resolved })}` : ''}
              </Text>
            </Card>
          ))}
          <SectionTitle>{t('activity.method')}</SectionTitle>
          <Text style={{ color: c.muted, fontSize: 13, lineHeight: 19 }}>{data.method}</Text>
          <Card style={{ gap: 8 }}>
            <Text style={{ color: c.text, lineHeight: 20 }}>{t('activity.disclaimer')}</Text>
            <Button title={t('urgent.call', { number: config.emergencyNumber })} icon="call" variant="secondary" onPress={() => void Linking.openURL(`tel:${config.emergencyNumber}`)} />
          </Card>
        </>
      )}
    </ScrollView>
  );
}
