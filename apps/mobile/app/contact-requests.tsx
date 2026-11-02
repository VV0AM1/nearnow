import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { timeAgo } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import type { ContactRequests } from '@/lib/types';
import { Button, Card, Chip, Field, StateView, useColors } from '@/components/ui';

export default function ContactRequestsScreen() {
  const { t, dateLocale } = useI18n();
  const c = useColors();
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<ContactRequests | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<ContactRequests>('/contact-requests/me');
      setData(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const respond = async (id: string, action: 'ACCEPT' | 'DECLINE' | 'BLOCK') => {
    setBusy(id);
    try {
      await api.post(`/contact-requests/${id}/respond`, { action, responseMessage: action === 'ACCEPT' ? replies[id]?.trim() : undefined });
      await load();
    } catch (e) {
      showToast(describeError(e, t), 'error');
    } finally {
      setBusy(null);
    }
  };

  const confirmBlock = (id: string, report: boolean) =>
    Alert.alert(t('contacts.blockTitle'), t('contacts.blockBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: report ? t('contacts.reportAbuse') : t('contacts.block'),
        style: 'destructive',
        onPress: async () => {
          if (!report) return void respond(id, 'BLOCK');
          try {
            await api.post(`/contact-requests/${id}/report`, {});
            showToast(t('contacts.reported'), 'success');
            await load();
          } catch (e) {
            showToast(describeError(e, t), 'error');
          }
        },
      },
    ]);

  if (error && !data) return <StateView kind="error" title={describeError(error, t)} actionLabel={t('common.retry')} onAction={load} />;
  if (!data) return <StateView kind="loading" />;
  const list = tab === 'incoming' ? data.incoming : data.outgoing;

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
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label={`${t('contacts.incoming')} (${data.incoming.length})`} selected={tab === 'incoming'} onPress={() => setTab('incoming')} />
        <Chip label={`${t('contacts.outgoing')} (${data.outgoing.length})`} selected={tab === 'outgoing'} onPress={() => setTab('outgoing')} />
      </View>
      {!list.length ? <StateView kind="empty" icon="mail-outline" title={t('contacts.empty')} /> : null}
      {list.map((r) => {
        const person = 'from' in r ? r.from : (r as ContactRequests['outgoing'][number]).to;
        return (
          <Card key={r.id} style={{ gap: 8 }}>
            <Text accessibilityRole="link" onPress={() => router.push({ pathname: '/post/[id]', params: { id: r.postId } })} style={{ color: c.primary, fontWeight: '600' }}>
              {t('contacts.about', { title: r.postTitle ?? '—' })}
            </Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>
              {person?.name ?? '—'} · {timeAgo(r.createdAt, dateLocale)} · {t(`contacts.${r.status}`)}
            </Text>
            <Text style={{ color: c.text }}>{r.message}</Text>
            {r.responseMessage ? <Text style={{ color: c.text, fontStyle: 'italic' }}>“{r.responseMessage}”</Text> : null}
            {tab === 'incoming' && r.status === 'PENDING' ? (
              <View style={{ gap: 8 }}>
                <Field
                  label={t('contacts.accept')}
                  value={replies[r.id] ?? ''}
                  onChangeText={(v) => setReplies((x) => ({ ...x, [r.id]: v }))}
                  placeholder={t('contacts.replyPlaceholder')}
                  multiline
                  max={500}
                />
                <Button title={t('contacts.accept')} onPress={() => respond(r.id, 'ACCEPT')} loading={busy === r.id} disabled={(replies[r.id]?.trim().length ?? 0) < 2} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button title={t('contacts.decline')} variant="secondary" onPress={() => respond(r.id, 'DECLINE')} style={{ flex: 1 }} />
                  <Button title={t('contacts.block')} variant="secondary" onPress={() => confirmBlock(r.id, false)} style={{ flex: 1 }} />
                </View>
              </View>
            ) : null}
            {tab === 'incoming' && r.status !== 'BLOCKED' ? <Button title={t('contacts.reportAbuse')} variant="ghost" onPress={() => confirmBlock(r.id, true)} /> : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}
