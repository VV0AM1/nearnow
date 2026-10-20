import React, { memo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { mediaUrl } from '@/lib/config';
import { formatKm } from '@/lib/format';
import type { Post } from '@/lib/types';
import { usePostActions } from '@/hooks/usePostActions';
import { CategoryBadge, TrustLine } from './PostStatus';
import { ReportSheet } from './ReportSheet';
import { useColors } from './ui';

function Action({ icon, label, text, onPress, active, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; text?: string; onPress: () => void; active?: boolean; color?: string }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text ? `${label}, ${text}` : label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      hitSlop={4}
      style={{ minWidth: 44, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6 }}
    >
      <Ionicons name={icon} size={21} color={active ? (color ?? c.primary) : c.muted} />
      {text ? <Text style={{ color: c.muted, fontWeight: '600' }}>{text}</Text> : null}
    </Pressable>
  );
}

function FeedPostInner({ item }: { item: Post }) {
  const { t } = useI18n();
  const c = useColors();
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
    <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, opacity: inactive ? 0.8 : 1 }}>
      <Pressable accessibilityRole="button" accessibilityHint={t('post.comments')} onPress={open} style={{ padding: 16, paddingBottom: 8, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <CategoryBadge post={item} />
          {item.lostFound ? (
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>
              {item.lostFound.direction === 'LOST' ? t('post.lost') : t('post.found')} · {t(`itemType.${item.lostFound.itemType}`)}
            </Text>
          ) : null}
        </View>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '700', lineHeight: 22 }} numberOfLines={2}>
          {item.title}
        </Text>
        {item.content ? (
          <Text style={{ color: c.muted, lineHeight: 20 }} numberOfLines={3}>
            {item.content}
          </Text>
        ) : null}
        {image ? (
          <Image source={{ uri: image }} accessibilityIgnoresInvertColors style={{ width: '100%', height: 190, borderRadius: 12, backgroundColor: c.border }} resizeMode="cover" />
        ) : null}
        <TrustLine post={item} />
        {place || item.author ? (
          <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>
            {place}
            {item.isApproximateLocation ? ` · ${t('post.approxLocation')}` : ''}
            {item.author ? ` · ${t('post.by', { name: item.author.name })}` : ''}
          </Text>
        ) : null}
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 4, borderTopWidth: 1, borderTopColor: c.border }}>
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
    </View>
  );
}

export const FeedPost = memo(FeedPostInner);
