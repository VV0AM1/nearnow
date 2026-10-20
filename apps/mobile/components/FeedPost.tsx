import React, { memo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { mediaUrl } from '@/lib/config';
import { formatKm } from '@/lib/format';
import type { Post } from '@/lib/types';
import { usePostActions } from '@/hooks/usePostActions';
import { ITEM_TYPE_ICON } from '@/constants/categories';
import { Card, Icon, PressableScale, Skeleton, Text, continuous, useTokens, type IoniconName } from '@/design';
import { CategoryBadge, TrustLine } from './PostStatus';
import { ReportSheet } from './ReportSheet';

function Action({ icon, label, text, onPress, active, color }: { icon: IoniconName; label: string; text?: string; onPress: () => void; active?: boolean; color?: string }) {
  const t = useTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text ? `${label}, ${text}` : label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      hitSlop={4}
      style={{ minWidth: t.minTouch, minHeight: t.minTouch, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6 }}
    >
      <Icon name={icon} size={20} color={active ? (color ?? t.colors.accent) : t.colors.labelSecondary} />
      {text ? (
        <Text variant="subheadline" weight="600" tone="secondary">
          {text}
        </Text>
      ) : null}
    </Pressable>
  );
}

function FeedPostInner({ item }: { item: Post }) {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { liked, likes, saved, toggleLike, toggleSave, share } = usePostActions(item);
  const [reporting, setReporting] = useState(false);
  const image = mediaUrl(item.imageUrl);
  const inactive = item.status !== 'ACTIVE';
  const open = () => router.push({ pathname: '/post/[id]', params: { id: item.id } });

  const place = [item.neighborhood?.name, item.distanceKm !== undefined ? t('post.distance', { km: formatKm(item.distanceKm) }) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card padded={false} style={{ marginHorizontal: tokens.space.lg, marginBottom: tokens.space.md, opacity: inactive ? 0.75 : 1, overflow: Platform.OS === 'android' ? 'hidden' : 'visible' }}>
      <PressableScale accessibilityHint={t('post.comments')} onPress={open} style={{ padding: tokens.space.lg, paddingBottom: tokens.space.sm, gap: tokens.space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.space.sm }}>
          <CategoryBadge post={item} />
          {item.lostFound ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name={ITEM_TYPE_ICON[item.lostFound.itemType]} size={14} color={tokens.colors.labelSecondary} />
              <Text variant="footnote" weight="600" tone="secondary">
                {item.lostFound.direction === 'LOST' ? t('post.lost') : t('post.found')} · {t(`itemType.${item.lostFound.itemType}`)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="headline" numberOfLines={2}>
          {item.title}
        </Text>
        {item.content ? (
          <Text variant="subheadline" tone="secondary" numberOfLines={3}>
            {item.content}
          </Text>
        ) : null}
        {image ? (
          <Image
            source={{ uri: image }}
            accessibilityIgnoresInvertColors
            contentFit="cover"
            transition={tokens.reduceMotion ? 0 : 200}
            recyclingKey={item.id}
            style={{ width: '100%', aspectRatio: 16 / 10, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surfaceSecondary, ...continuous }}
          />
        ) : null}
        <TrustLine post={item} />
        {place || item.author ? (
          <Text variant="footnote" tone="secondary" numberOfLines={1}>
            {place}
            {item.isApproximateLocation ? ` · ${t('post.approxLocation')}` : ''}
            {item.author ? ` · ${t('post.by', { name: item.author.name })}` : ''}
          </Text>
        ) : null}
      </PressableScale>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: tokens.space.sm,
          borderTopWidth: 0.5,
          borderTopColor: tokens.colors.separator,
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          <Action icon={liked ? 'thumbs-up' : 'thumbs-up-outline'} label={t('post.like')} text={String(likes)} onPress={toggleLike} active={liked} />
          <Action icon="chatbubble-outline" label={t('post.comments')} text={String(item.commentCount)} onPress={open} />
          <Action icon="map-outline" label={t('post.viewOnMap')} onPress={() => router.push({ pathname: '/(app)/map', params: { focus: item.id, lat: String(item.latitude), lng: String(item.longitude) } })} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Action icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? t('post.unsave') : t('post.save')} onPress={toggleSave} active={saved} />
          <Action icon="share-outline" label={t('post.share')} onPress={share} />
          {!item.viewer?.isAuthor ? <Action icon="flag-outline" label={t('post.report')} onPress={() => setReporting(true)} /> : null}
        </View>
      </View>
      {reporting ? <ReportSheet postId={item.id} visible={reporting} onClose={() => setReporting(false)} /> : null}
    </Card>
  );
}

export const FeedPost = memo(FeedPostInner);

/** Placeholder card shown while the first page loads. */
export function FeedPostSkeleton() {
  const t = useTokens();
  return (
    <Card style={{ marginHorizontal: t.space.lg, marginBottom: t.space.md, gap: t.space.sm }}>
      <Skeleton width={90} height={20} radius={t.radius.pill} />
      <Skeleton width="85%" height={18} />
      <Skeleton width="60%" />
      <Skeleton width="40%" height={12} />
    </Card>
  );
}
