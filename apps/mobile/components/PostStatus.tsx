import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_META } from '@/constants/categories';
import { useI18n } from '@/lib/i18n';
import { timeAgo } from '@/lib/format';
import type { Post } from '@/lib/types';
import { useColors } from './ui';

type IconName = keyof typeof Ionicons.glyphMap;

function Badge({ icon, text, color }: { icon: IconName; text: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: color }}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export function CategoryBadge({ post }: { post: Pick<Post, 'category'> }) {
  const { t } = useI18n();
  const meta = CATEGORY_META[post.category];
  return <Badge icon={meta.icon} text={t(meta.label)} color={meta.color} />;
}

/**
 * Source + freshness + verification line, shown identically on cards, map sheet and
 * detail. Uses text and icons, never colour alone. No "safe" labels exist.
 */
export function TrustLine({ post }: { post: Post }) {
  const { t, dateLocale } = useI18n();
  const c = useColors();
  const badges: React.ReactNode[] = [];

  if (post.status === 'RESOLVED') badges.push(<Badge key="r" icon="checkmark-done" text={t('status.RESOLVED')} color={c.success} />);
  else if (post.status === 'EXPIRED') badges.push(<Badge key="e" icon="time-outline" text={t('status.EXPIRED')} color={c.muted} />);
  else if (post.status === 'REMOVED') badges.push(<Badge key="x" icon="ban" text={t('status.REMOVED')} color={c.danger} />);
  else if (post.isStale) badges.push(<Badge key="s" icon="hourglass-outline" text={t('status.stale')} color={c.warning} />);

  if (post.verificationStatus === 'OFFICIAL_SOURCE' && post.source.name) {
    badges.push(<Badge key="o" icon="business" text={t('status.official', { source: post.source.name })} color={c.primary} />);
  } else if (post.verificationStatus === 'COMMUNITY_CONFIRMED') {
    badges.push(<Badge key="c" icon="people" text={t('status.confirmed', { count: post.confirmations.stillHappening })} color={c.primary} />);
  }
  if (post.status === 'ACTIVE' && post.confirmations.noLongerPresent > 0) {
    badges.push(<Badge key="n" icon="remove-circle-outline" text={t('status.noLonger', { count: post.confirmations.noLongerPresent })} color={c.muted} />);
  }

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.muted, fontSize: 12 }}>
        {post.verificationStatus === 'OFFICIAL_SOURCE' ? '' : `${t('status.community')} · `}
        {timeAgo(post.createdAt, dateLocale)}
        {post.lastConfirmedAt ? ` · ✓ ${timeAgo(post.lastConfirmedAt, dateLocale)}` : ''}
      </Text>
      {badges.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{badges}</View> : null}
    </View>
  );
}
