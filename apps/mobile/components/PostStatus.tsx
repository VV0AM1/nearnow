import React from 'react';
import { View } from 'react-native';
import { CATEGORY_META } from '@/constants/categories';
import { useI18n } from '@/lib/i18n';
import { timeAgo } from '@/lib/format';
import type { Post } from '@/lib/types';
import { Badge, Text } from '@/design';

export function CategoryBadge({ post }: { post: Pick<Post, 'category'> }) {
  const { t } = useI18n();
  const meta = CATEGORY_META[post.category];
  return <Badge icon={meta.icon} label={t(meta.label)} color={meta.color} />;
}

/**
 * Source + freshness + verification line, shown identically on cards, map sheet and
 * detail. Uses text and icons, never colour alone. No "safe" labels exist.
 */
export function TrustLine({ post }: { post: Post }) {
  const { t, dateLocale } = useI18n();
  const badges: React.ReactNode[] = [];

  if (post.status === 'RESOLVED') badges.push(<Badge key="r" icon="checkmark-done" label={t('status.RESOLVED')} tone="success" />);
  else if (post.status === 'EXPIRED') badges.push(<Badge key="e" icon="time-outline" label={t('status.EXPIRED')} />);
  else if (post.status === 'REMOVED') badges.push(<Badge key="x" icon="ban" label={t('status.REMOVED')} tone="danger" />);
  else if (post.isStale) badges.push(<Badge key="s" icon="hourglass-outline" label={t('status.stale')} tone="warning" />);

  if (post.verificationStatus === 'OFFICIAL_SOURCE' && post.source.name) {
    badges.push(<Badge key="o" icon="business" label={t('status.official', { source: post.source.name })} tone="accent" />);
  } else if (post.verificationStatus === 'COMMUNITY_CONFIRMED') {
    badges.push(<Badge key="c" icon="people" label={t('status.confirmed', { count: post.confirmations.stillHappening })} tone="accent" />);
  }
  if (post.status === 'ACTIVE' && post.confirmations.noLongerPresent > 0) {
    badges.push(<Badge key="n" icon="remove-circle-outline" label={t('status.noLonger', { count: post.confirmations.noLongerPresent })} />);
  }

  return (
    <View style={{ gap: 6 }}>
      <Text variant="footnote" tone="secondary">
        {post.verificationStatus === 'OFFICIAL_SOURCE' ? '' : `${t('status.community')} · `}
        {timeAgo(post.createdAt, dateLocale)}
        {post.lastConfirmedAt ? ` · ✓ ${timeAgo(post.lastConfirmedAt, dateLocale)}` : ''}
      </Text>
      {badges.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{badges}</View> : null}
    </View>
  );
}
