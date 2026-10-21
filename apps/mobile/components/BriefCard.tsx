import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { formatKm, timeAgo } from '@/lib/format';
import { briefLines, type BriefChange, type BriefItem } from '@/lib/brief';
import { CATEGORY_META } from '@/constants/categories';
import { useBrief } from '@/hooks/useBrief';
import { Button, Card, Chip, Icon, IconButton, PressableScale, Skeleton, Text, continuous, useTokens, type IoniconName } from '@/design';

const CHANGE_ICON: Record<BriefChange, IoniconName> = {
  NEW: 'sparkles',
  CONFIRMED: 'people',
  RESOLVED: 'checkmark-done',
  EXPIRED: 'time-outline',
};
const PREVIEW = 3;

function Row({ item }: { item: BriefItem }) {
  const { t, dateLocale } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const meta = CATEGORY_META[item.category];
  const tone = item.change === 'RESOLVED' ? tokens.colors.success : item.change === 'EXPIRED' ? tokens.colors.labelSecondary : tokens.colors.accent;
  const provenance = item.provenance === 'OFFICIAL' && item.sourceName ? `${t('brief.provOFFICIAL')}: ${item.sourceName}` : t(`brief.prov${item.provenance}`);
  return (
    <PressableScale
      scaleOnPress={false}
      accessibilityLabel={`${t(`brief.change${item.change}`)}: ${item.title}. ${provenance}. ${timeAgo(item.at, dateLocale)}`}
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.postId } })}
      style={{ flexDirection: 'row', gap: tokens.space.md, alignItems: 'center', paddingVertical: tokens.space.sm }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${meta.color}22`, alignItems: 'center', justifyContent: 'center', ...continuous }}>
        <Icon name={meta.icon} size={17} color={meta.color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subheadline" weight="600" numberOfLines={2}>
          {item.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Icon name={CHANGE_ICON[item.change]} size={12} color={tone} />
          <Text variant="caption1" weight="600" style={{ color: tone }}>
            {t(`brief.change${item.change}`)}
          </Text>
          <Text variant="caption1" tone="secondary">
            · {provenance} · {timeAgo(item.at, dateLocale)}
            {item.distanceKm ? ` · ${t('post.distance', { km: formatKm(item.distanceKm) })}` : ''}
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={14} color={tokens.colors.labelTertiary} />
    </PressableScale>
  );
}

/**
 * "Since you last checked": a short, deterministic change summary for the area the
 * user follows. Never presents an absence of reports as an all-clear.
 */
export function BriefCard({ area, radiusKm }: { area: { latitude: number; longitude: number } | null; radiusKm: number }) {
  const { t, dateLocale } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { brief, areas, areaId, setAreaId, error, loading, markRead, enable } = useBrief(area, radiusKm);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!brief && loading) {
    return (
      <Card style={{ marginHorizontal: tokens.space.lg, gap: tokens.space.sm }}>
        <Skeleton width={160} height={18} />
        <Skeleton width="80%" />
        <Skeleton width="60%" />
      </Card>
    );
  }
  if (error && !brief) {
    return (
      <Card style={{ marginHorizontal: tokens.space.lg, flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm }}>
        <Icon name="cloud-offline-outline" size={18} color={tokens.colors.warning} />
        <Text variant="subheadline" tone="secondary" style={{ flex: 1 }}>
          {t('brief.loadError')} {describeError(error, t)}
        </Text>
      </Card>
    );
  }
  if (!brief) return null;

  if (!brief.enabled) {
    return (
      <Card style={{ marginHorizontal: tokens.space.lg, flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm }}>
        <Text variant="subheadline" tone="secondary" style={{ flex: 1 }}>
          {t('brief.off')}
        </Text>
        <Button title={t('brief.turnOn')} size="small" variant="tinted" onPress={() => void enable()} />
      </Card>
    );
  }

  const lines = briefLines(brief);
  const shown = expanded ? brief.items : brief.items.slice(0, PREVIEW);

  return (
    <Card style={{ marginHorizontal: tokens.space.lg, gap: tokens.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="headline" accessibilityRole="header">
            {t('brief.title')}
          </Text>
          <Text variant="footnote" tone="secondary">
            {t('brief.sinceTime', { time: timeAgo(brief.since, dateLocale) })}
          </Text>
        </View>
        <IconButton icon="options-outline" label={t('brief.settings')} size={20} onPress={() => router.push('/brief-settings')} />
      </View>

      {areas.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: tokens.space.sm }}>
          <Chip label={t('brief.currentArea')} selected={!areaId} onPress={() => setAreaId(null)} />
          {areas.map((a) => (
            <Chip key={a.id} label={a.label} icon="location-outline" selected={areaId === a.id} onPress={() => setAreaId(a.id)} />
          ))}
        </ScrollView>
      ) : null}

      <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
        {lines.map((l) => (
          <View key={l.key} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            {l.tone === 'warning' ? <Icon name="alert-circle-outline" size={15} color={tokens.colors.warning} /> : null}
            <Text variant="subheadline" tone={l.tone === 'warning' ? 'warning' : 'primary'} style={{ flex: 1 }}>
              {t(l.key, l.params)}
            </Text>
          </View>
        ))}
      </View>

      {shown.length ? (
        <View style={{ borderTopWidth: 0.5, borderTopColor: tokens.colors.separator }}>
          {shown.map((item) => (
            <Row key={item.postId} item={item} />
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {brief.items.length > PREVIEW ? (
          <Button
            title={expanded ? t('brief.showLess') : t('brief.showAll', { n: brief.items.length })}
            variant="plain"
            size="small"
            onPress={() => setExpanded((v) => !v)}
          />
        ) : (
          <View />
        )}
        {brief.items.length ? (
          <Button
            title={t('brief.markRead')}
            icon="checkmark"
            size="small"
            variant="tinted"
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await markRead();
                setExpanded(false);
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
      </View>
    </Card>
  );
}
