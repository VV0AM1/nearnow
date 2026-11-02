import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { useToast } from '@/context/ToastContext';
import type { MatchSuggestion, Post } from '@/lib/types';
import { Button, Card, Field, SectionTitle, StateView, useColors } from './ui';
import { CategoryBadge } from './PostStatus';

/** Owner view: possible matches with reasons; dismissible. */
export function MatchesPanel({ post }: { post: Post }) {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const [items, setItems] = useState<MatchSuggestion[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .get<{ items: MatchSuggestion[] }>(`/lost-found/${post.id}/matches`)
      .then((res) => setItems(res.data.items))
      .catch(setError);
  }, [post.id]);
  useEffect(load, [load]);

  const dismiss = async (candidateId: string) => {
    const prev = items;
    setItems((list) => list?.filter((m) => m.post.id !== candidateId) ?? null);
    try {
      await api.delete(`/lost-found/${post.id}/matches/${candidateId}`);
    } catch {
      setItems(prev);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{t('post.matches')}</SectionTitle>
      <Text style={{ color: c.muted, fontSize: 13 }}>{t('post.matchesHint')}</Text>
      {error ? (
        <StateView kind="error" title={describeError(error, t)} actionLabel={t('common.retry')} onAction={load} />
      ) : !items ? (
        <StateView kind="loading" />
      ) : !items.length ? (
        <Text style={{ color: c.muted }}>{t('post.noMatches')}</Text>
      ) : (
        items.map((m) => (
          <Card key={m.post.id} style={{ gap: 6 }}>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/post/[id]', params: { id: m.post.id } })} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <CategoryBadge post={m.post} />
                <Text style={{ color: c.muted, fontWeight: '700' }}>{m.label}</Text>
              </View>
              <Text style={{ color: c.text, fontWeight: '700' }}>{m.post.title}</Text>
              {m.reasons.map((r) => (
                <Text key={r} style={{ color: c.muted, fontSize: 13 }}>
                  • {r}
                </Text>
              ))}
            </Pressable>
            <Button title={t('post.dismiss')} variant="ghost" onPress={() => dismiss(m.post.id)} />
          </Card>
        ))
      )}
    </View>
  );
}

/** Non-owner view: privacy-preserving contact request. */
export function ContactPanel({ post }: { post: Post }) {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/lost-found/${post.id}/contact-requests`, { message: message.trim() });
      setSent(true);
      showToast(t('post.contactSent'), 'success');
    } catch (e) {
      setError(describeError(e, t));
    } finally {
      setBusy(false);
    }
  };

  if (sent) return <Button title={t('post.viewRequests')} variant="secondary" onPress={() => router.push('/contact-requests')} />;
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{t('post.contact')}</SectionTitle>
      <Text style={{ color: c.muted, fontSize: 13 }}>{t('post.contactHint')}</Text>
      <Field label={t('post.contact')} value={message} onChangeText={setMessage} placeholder={t('post.contactPlaceholder')} multiline max={500} error={error} style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <Button title={t('common.send')} onPress={send} loading={busy} disabled={message.trim().length < 10} />
    </View>
  );
}
