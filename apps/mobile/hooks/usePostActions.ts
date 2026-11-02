import { useCallback, useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { useToast } from '@/context/ToastContext';
import type { Post } from '@/lib/types';

/** Like/save with optimistic UI, rollback on failure and no double submission. */
export function usePostActions(post: Post) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [liked, setLiked] = useState(!!post.viewer?.hasVoted);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(!!post.viewer?.hasSaved);
  const busy = useRef({ like: false, save: false });

  useEffect(() => {
    setLiked(!!post.viewer?.hasVoted);
    setLikes(post.likes);
    setSaved(!!post.viewer?.hasSaved);
  }, [post.id, post.likes, post.viewer?.hasVoted, post.viewer?.hasSaved]);

  const toggleLike = useCallback(async () => {
    if (busy.current.like) return;
    busy.current.like = true;
    const prev = { liked, likes };
    setLiked(!liked);
    setLikes(Math.max(0, likes + (liked ? -1 : 1)));
    try {
      const res = await api.post<{ liked: boolean; likes: number }>(`/posts/${post.id}/vote`, { type: 'UP' });
      setLiked(res.data.liked);
      setLikes(res.data.likes);
    } catch (e) {
      setLiked(prev.liked);
      setLikes(prev.likes);
      showToast(describeError(e, t), 'error');
    } finally {
      busy.current.like = false;
    }
  }, [liked, likes, post.id, showToast, t]);

  const toggleSave = useCallback(async () => {
    if (busy.current.save) return;
    busy.current.save = true;
    const want = !saved;
    setSaved(want);
    try {
      const res = await api.post<{ saved: boolean }>(`/users/me/saved/${post.id}`, { saved: want });
      setSaved(res.data.saved);
      if (res.data.saved) showToast(t('common.saved'), 'success');
    } catch (e) {
      setSaved(!want);
      showToast(describeError(e, t), 'error');
    } finally {
      busy.current.save = false;
    }
  }, [saved, post.id, showToast, t]);

  const share = useCallback(() => {
    // Shares text only: no deep-link domain is configured for this pilot.
    void Share.share({ message: t('post.shareMessage', { title: post.title }) }).catch(() => undefined);
  }, [post.title, t]);

  return { liked, likes, saved, toggleLike, toggleSave, share };
}
