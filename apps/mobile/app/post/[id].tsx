import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError, toAppError } from '@/lib/errors';
import { mediaUrl } from '@/lib/config';
import { formatKm, shortDate, timeAgo } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import type { Comment, ConfirmationState, Post } from '@/lib/types';
import { usePostActions } from '@/hooks/usePostActions';
import { addCantConfirm, getCantConfirm } from '@/lib/storage';
import { CategoryBadge, TrustLine } from '@/components/PostStatus';
import { ReportSheet } from '@/components/ReportSheet';
import { ContactPanel, MatchesPanel } from '@/components/LostFoundPanel';
import { Avatar, Banner, Button, Card, Icon, IconButton, ListRow, ListSection, StateView, Text, continuous, useTokens, type IoniconName } from '@/design';

export default function PostDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const tokens = useTokens();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, cm] = await Promise.all([api.get<Post>(`/posts/${id}`), api.get<Comment[]>(`/comments/${id}`)]);
      setPost(p.data);
      setComments(cm.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !post) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.colors.background, justifyContent: 'center' }}>
        <StateView kind="loading" />
      </View>
    );
  }
  if (error || !post) {
    const notFound = toAppError(error).kind === 'notFound';
    return (
      <View style={{ flex: 1, backgroundColor: tokens.colors.background, justifyContent: 'center' }}>
        <StateView kind={notFound ? 'empty' : 'error'} title={notFound ? t('post.notFound') : describeError(error, t)} actionLabel={notFound ? undefined : t('common.retry')} onAction={load} />
      </View>
    );
  }
  return <PostBody post={post} setPost={setPost} comments={comments} setComments={setComments} />;
}

function MetaLine({ icon, children }: { icon: IoniconName; children: string }) {
  const tokens = useTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm }}>
      <Icon name={icon} size={15} color={tokens.colors.labelSecondary} />
      <Text variant="subheadline" tone="secondary" style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

function PostBody({
  post,
  setPost,
  comments,
  setComments,
}: {
  post: Post;
  setPost: (p: Post) => void;
  comments: Comment[];
  setComments: (fn: (prev: Comment[]) => Comment[]) => void;
}) {
  const { t, dateLocale } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { showToast } = useToast();
  const { liked, likes, saved, toggleLike, toggleSave, share } = usePostActions(post);
  const [reporting, setReporting] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Impact receipt: real counts returned by the server after an answer.
  const [receipt, setReceipt] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    void getCantConfirm().then((ids) => setSkipped(ids.includes(post.id)));
  }, [post.id]);
  const sendingRef = useRef(false);
  const isAuthor = !!post.viewer?.isAuthor;
  const image = mediaUrl(post.imageUrl);
  const active = post.status === 'ACTIVE';

  const sendComment = async () => {
    const content = text.trim();
    if (!content || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const res = await api.post<Comment>('/comments', { postId: post.id, content });
      setComments((prev) => [...prev, res.data]);
      setText('');
    } catch (e) {
      showToast(describeError(e, t), 'error');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const confirm = async (state: ConfirmationState) => {
    if (confirming) return;
    setConfirming(true);
    try {
      const res = await api.post<{ confirmations: Post['confirmations']; verificationStatus: Post['verificationStatus'] }>(`/posts/${post.id}/confirm`, { state });
      setPost({
        ...post,
        confirmations: res.data.confirmations,
        verificationStatus: res.data.verificationStatus,
        isStale: state === 'STILL_HAPPENING' ? false : post.isStale,
        lastConfirmedAt: state === 'STILL_HAPPENING' ? new Date().toISOString() : post.lastConfirmedAt,
        viewer: post.viewer ? { ...post.viewer, confirmation: state } : post.viewer,
      });
      const n = state === 'STILL_HAPPENING' ? res.data.confirmations.stillHappening : res.data.confirmations.noLongerPresent;
      setReceipt(t(state === 'STILL_HAPPENING' ? 'post.receiptStill' : 'post.receiptNoLonger', { n }));
    } catch (e) {
      showToast(describeError(e, t), 'error');
    } finally {
      setConfirming(false);
    }
  };

  const resolve = () =>
    Alert.alert(t('post.resolveTitle'), t('post.resolveBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: post.lostFound ? t('post.markReturned') : t('post.resolve'),
        onPress: async () => {
          try {
            const res = await api.patch<Post>(`/posts/${post.id}/resolve`, {});
            setPost(res.data);
          } catch (e) {
            showToast(describeError(e, t), 'error');
          }
        },
      },
    ]);

  const remove = () =>
    Alert.alert(t('post.deleteTitle'), t('post.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/posts/${post.id}`);
            showToast(t('post.deleted'), 'success');
            router.back();
          } catch (e) {
            showToast(describeError(e, t), 'error');
          }
        },
      },
    ]);

  const openMap = () => router.push({ pathname: '/(app)/map', params: { focus: post.id, lat: String(post.latitude), lng: String(post.longitude) } });
  const place = [post.neighborhood?.name, post.distanceKm !== undefined ? t('post.distance', { km: formatKm(post.distanceKm) }) : null, post.isApproximateLocation ? t('post.approxLocation') : null]
    .filter(Boolean)
    .join(' · ');
  const answer = post.viewer?.confirmation ?? null;

  const header = (
    <View style={{ padding: tokens.space.lg, gap: tokens.space.lg }}>
      {post.status === 'REMOVED' ? <Banner tone="danger" icon="ban" message={t('post.removed')} /> : null}

      <View style={{ gap: tokens.space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: tokens.space.sm }}>
          <CategoryBadge post={post} />
          {post.lostFound ? (
            <Text variant="footnote" weight="600" tone="secondary">
              {post.lostFound.direction === 'LOST' ? t('post.lost') : t('post.found')} · {t(`itemType.${post.lostFound.itemType}`)}
            </Text>
          ) : null}
        </View>
        <Text variant="title1" weight="700">
          {post.title}
        </Text>
        <TrustLine post={post} />
      </View>

      {image ? (
        <Image
          source={{ uri: image }}
          contentFit="cover"
          transition={tokens.reduceMotion ? 0 : 200}
          accessibilityIgnoresInvertColors
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surfaceSecondary, ...continuous }}
        />
      ) : null}

      {post.content ? <Text variant="body">{post.content}</Text> : null}

      <View style={{ gap: tokens.space.xs }}>
        {place ? <MetaLine icon="location-outline">{place}</MetaLine> : null}
        {post.lostFound ? (
          <MetaLine icon="calendar-outline">{t('post.when', { from: shortDate(post.lostFound.occurredFrom, dateLocale), to: shortDate(post.lostFound.occurredTo, dateLocale) })}</MetaLine>
        ) : null}
        {post.author ? <MetaLine icon="person-circle-outline">{t('post.by', { name: post.author.name })}</MetaLine> : null}
      </View>

      {post.resolvedAt ? (
        <Banner
          tone="success"
          icon="checkmark-done"
          message={`${t('post.resolvedBy', { time: timeAgo(post.resolvedAt, dateLocale) })}${post.resolutionNote ? ` — ${post.resolutionNote}` : ''}`}
        />
      ) : null}

      {/* Actions */}
      <Card padded={false} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: tokens.space.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon={liked ? 'thumbs-up' : 'thumbs-up-outline'} label={`${t('post.like')}, ${likes}`} onPress={toggleLike} selected={liked} />
          <Text variant="subheadline" weight="600" tone="secondary">
            {String(likes)}
          </Text>
        </View>
        <IconButton icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? t('post.unsave') : t('post.save')} onPress={toggleSave} selected={saved} />
        <IconButton icon="share-outline" label={t('post.share')} onPress={share} />
        <IconButton icon="map-outline" label={t('post.viewOnMap')} onPress={openMap} />
        {!isAuthor ? <IconButton icon="flag-outline" label={t('post.report')} onPress={() => setReporting(true)} /> : null}
      </Card>

      {/* Reality check */}
      {active && !isAuthor && post.category !== 'LOST_FOUND' && (!skipped || answer) ? (
        <Card style={{ gap: tokens.space.md }}>
          <Text variant="headline">{t('post.confirmPrompt')}</Text>
          <View style={{ flexDirection: 'row', gap: tokens.space.sm }}>
            <Button
              title={t('post.stillHappening')}
              icon={answer === 'STILL_HAPPENING' ? 'checkmark' : undefined}
              variant={answer === 'STILL_HAPPENING' ? 'filled' : 'tinted'}
              onPress={() => confirm('STILL_HAPPENING')}
              disabled={confirming}
              haptic
              style={{ flex: 1 }}
            />
            <Button
              title={t('post.noLonger')}
              icon={answer === 'NO_LONGER_PRESENT' ? 'checkmark' : undefined}
              variant={answer === 'NO_LONGER_PRESENT' ? 'filled' : 'tinted'}
              onPress={() => confirm('NO_LONGER_PRESENT')}
              disabled={confirming}
              haptic
              style={{ flex: 1 }}
            />
          </View>
          {!answer ? (
            <Button
              title={t('post.cantConfirm')}
              variant="plain"
              size="small"
              onPress={() => {
                setSkipped(true);
                void addCantConfirm(post.id);
                showToast(t('post.cantConfirmThanks'), 'info');
              }}
            />
          ) : null}
          {receipt ? (
            <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: tokens.space.sm, alignItems: 'flex-start', padding: tokens.space.md, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.successSoft }}>
              <Icon name="checkmark-circle" size={18} color={tokens.colors.success} />
              <Text variant="subheadline" style={{ flex: 1 }}>
                {receipt}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {post.lostFound && isAuthor && active ? <MatchesPanel post={post} /> : null}
      {post.lostFound && !isAuthor && active && post.lostFound.status === 'OPEN' ? <ContactPanel post={post} /> : null}

      {isAuthor ? (
        <ListSection style={{ marginBottom: 0 }}>
          {post.status === 'ACTIVE' || post.status === 'EXPIRED' ? (
            <ListRow title={post.lostFound ? t('post.markReturned') : t('post.resolve')} icon="checkmark-done" iconColor={tokens.colors.success} accessory="none" onPress={resolve} />
          ) : null}
          <ListRow title={t('post.delete')} icon="trash" destructive accessory="none" onPress={remove} />
        </ListSection>
      ) : null}

      <Text variant="title3" weight="700" accessibilityRole="header">
        {`${t('post.comments')} (${comments.length})`}
      </Text>
    </View>
  );

  const canSend = !!text.trim() && !sending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      style={{ flex: 1, backgroundColor: tokens.colors.background }}
    >
      <Stack.Screen options={{ title: t(`category.${post.category}`) }} />
      <FlatList
        data={comments}
        keyExtractor={(cm) => cm.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text variant="subheadline" tone="secondary" style={{ paddingHorizontal: tokens.space.lg }}>
            {t('post.noComments')}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: tokens.space.md, paddingHorizontal: tokens.space.lg, paddingVertical: tokens.space.sm }}>
            <Avatar uri={mediaUrl(item.author?.avatar)} name={item.author?.name} size={32} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="subheadline" weight="600">
                {item.author?.name ?? '—'}
                <Text variant="footnote" tone="secondary">{`  ${timeAgo(item.createdAt, dateLocale)}`}</Text>
              </Text>
              <Text variant="body">{item.content}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: tokens.space.lg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />
      {post.status !== 'REMOVED' ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: tokens.space.sm,
            paddingHorizontal: tokens.space.md,
            paddingTop: tokens.space.sm,
            paddingBottom: tokens.space.sm + insets.bottom,
            borderTopWidth: 0.5,
            borderTopColor: tokens.colors.separator,
            backgroundColor: tokens.colors.surface,
          }}
        >
          <TextInput
            accessibilityLabel={t('post.addComment')}
            value={text}
            onChangeText={setText}
            placeholder={t('post.addComment')}
            placeholderTextColor={tokens.colors.labelTertiary}
            maxLength={1000}
            multiline
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 120,
              color: tokens.colors.label,
              fontSize: 17,
              paddingHorizontal: tokens.space.md,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 20,
              backgroundColor: tokens.colors.surfaceSecondary,
            }}
          />
          <IconButton icon="arrow-up-circle" size={32} label={t('common.send')} color={tokens.colors.accent} disabled={!canSend} onPress={sendComment} />
        </View>
      ) : null}
      {reporting ? <ReportSheet postId={post.id} visible={reporting} onClose={() => setReporting(false)} /> : null}
    </KeyboardAvoidingView>
  );
}
