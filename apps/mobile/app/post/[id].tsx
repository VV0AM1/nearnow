import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError, toAppError } from '@/lib/errors';
import { mediaUrl } from '@/lib/config';
import { formatKm, shortDate, timeAgo } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import type { Comment, ConfirmationState, Post } from '@/lib/types';
import { usePostActions } from '@/hooks/usePostActions';
import { CategoryBadge, TrustLine } from '@/components/PostStatus';
import { ReportSheet } from '@/components/ReportSheet';
import { ContactPanel, MatchesPanel } from '@/components/LostFoundPanel';
import { Button, IconButton, SectionTitle, StateView, useColors } from '@/components/ui';

export default function PostDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const c = useColors();
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

  if (loading && !post) return <StateView kind="loading" />;
  if (error || !post) {
    const notFound = toAppError(error).kind === 'notFound';
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
        <StateView kind={notFound ? 'empty' : 'error'} title={notFound ? t('post.notFound') : describeError(error, t)} actionLabel={notFound ? undefined : t('common.retry')} onAction={load} />
      </View>
    );
  }
  return <PostBody post={post} setPost={setPost} comments={comments} setComments={setComments} />;
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
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { liked, likes, saved, toggleLike, toggleSave, share } = usePostActions(post);
  const [reporting, setReporting] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
      showToast(t('post.yourAnswer'), 'success');
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

  const header = (
    <View style={{ padding: 16, gap: 12 }}>
      {post.status === 'REMOVED' ? <Text style={{ color: c.danger }}>{t('post.removed')}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CategoryBadge post={post} />
        {post.lostFound ? (
          <Text style={{ color: c.muted, fontWeight: '700' }}>
            {post.lostFound.direction === 'LOST' ? t('post.lost') : t('post.found')} · {t(`itemType.${post.lostFound.itemType}`)}
          </Text>
        ) : null}
      </View>
      <Text accessibilityRole="header" style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>
        {post.title}
      </Text>
      <TrustLine post={post} />
      <Text style={{ color: c.muted, fontSize: 13 }}>
        {[post.neighborhood?.name, post.distanceKm !== undefined ? t('post.distance', { km: formatKm(post.distanceKm) }) : null, post.isApproximateLocation ? t('post.approxLocation') : null, post.author ? t('post.by', { name: post.author.name }) : null]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {post.lostFound ? (
        <Text style={{ color: c.muted, fontSize: 13 }}>
          {t('post.when', { from: shortDate(post.lostFound.occurredFrom, dateLocale), to: shortDate(post.lostFound.occurredTo, dateLocale) })}
        </Text>
      ) : null}
      {post.content ? <Text style={{ color: c.text, fontSize: 16, lineHeight: 24 }}>{post.content}</Text> : null}
      {image ? <Image source={{ uri: image }} style={{ width: '100%', height: 260, borderRadius: 12, backgroundColor: c.border }} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
      {post.resolvedAt ? <Text style={{ color: c.success }}>{t('post.resolvedBy', { time: timeAgo(post.resolvedAt, dateLocale) })}{post.resolutionNote ? ` — ${post.resolutionNote}` : ''}</Text> : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border }}>
        <IconButton icon={liked ? 'thumbs-up' : 'thumbs-up-outline'} label={`${t('post.like')}, ${likes}`} onPress={toggleLike} color={liked ? c.primary : c.muted} />
        <Text style={{ color: c.muted }}>{likes}</Text>
        <View style={{ flex: 1 }} />
        <IconButton icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? t('post.unsave') : t('post.save')} onPress={toggleSave} color={saved ? c.primary : c.muted} />
        <IconButton icon="share-outline" label={t('post.share')} onPress={share} color={c.muted} />
        <IconButton icon="map-outline" label={t('post.viewOnMap')} onPress={() => router.push({ pathname: '/(app)/map', params: { focus: post.id, lat: String(post.latitude), lng: String(post.longitude) } })} color={c.muted} />
        {!isAuthor ? <IconButton icon="flag-outline" label={t('post.report')} onPress={() => setReporting(true)} color={c.muted} /> : null}
      </View>

      {active && !isAuthor && post.category !== 'LOST_FOUND' ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('post.confirmPrompt')}</SectionTitle>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              title={t('post.stillHappening')}
              variant={post.viewer?.confirmation === 'STILL_HAPPENING' ? 'primary' : 'secondary'}
              onPress={() => confirm('STILL_HAPPENING')}
              disabled={confirming}
              style={{ flex: 1 }}
            />
            <Button
              title={t('post.noLonger')}
              variant={post.viewer?.confirmation === 'NO_LONGER_PRESENT' ? 'primary' : 'secondary'}
              onPress={() => confirm('NO_LONGER_PRESENT')}
              disabled={confirming}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : null}

      {post.lostFound && isAuthor && active ? <MatchesPanel post={post} /> : null}
      {post.lostFound && !isAuthor && active && post.lostFound.status === 'OPEN' ? <ContactPanel post={post} /> : null}

      {isAuthor ? (
        <View style={{ gap: 8 }}>
          {post.status === 'ACTIVE' || post.status === 'EXPIRED' ? <Button title={post.lostFound ? t('post.markReturned') : t('post.resolve')} icon="checkmark-done" variant="secondary" onPress={resolve} /> : null}
          <Button title={t('post.delete')} icon="trash-outline" variant="ghost" onPress={remove} />
        </View>
      ) : null}

      <SectionTitle>{`${t('post.comments')} (${comments.length})`}</SectionTitle>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: t(`category.${post.category}`) }} />
      <FlatList
        data={comments}
        keyExtractor={(cm) => cm.id}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={{ color: c.muted, paddingHorizontal: 16 }}>{t('post.noComments')}</Text>}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ color: c.text, fontWeight: '700' }}>
              {item.author?.name ?? '—'} <Text style={{ color: c.muted, fontWeight: '400', fontSize: 12 }}>{timeAgo(item.createdAt, dateLocale)}</Text>
            </Text>
            <Text style={{ color: c.text, marginTop: 2, lineHeight: 20 }}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      />
      {post.status !== 'REMOVED' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8, paddingBottom: 8 + insets.bottom, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.card, gap: 8 }}>
          <TextInput
            accessibilityLabel={t('post.addComment')}
            value={text}
            onChangeText={setText}
            placeholder={t('post.addComment')}
            placeholderTextColor={c.muted}
            maxLength={1000}
            multiline
            style={{ flex: 1, minHeight: 44, maxHeight: 120, color: c.text, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: c.border }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.send')}
            disabled={!text.trim() || sending}
            onPress={sendComment}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: !text.trim() || sending ? 0.4 : 1 }}
          >
            <Ionicons name="send" size={22} color={c.primary} />
          </Pressable>
        </View>
      ) : null}
      {reporting ? <ReportSheet postId={post.id} visible={reporting} onClose={() => setReporting(false)} /> : null}
    </KeyboardAvoidingView>
  );
}
