import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { timeAgo } from '@/lib/format';
import type { AppNotification, NotificationPage, NotificationType } from '@/lib/types';
import { Button, StateView, useColors } from '@/components/ui';

const ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  POST_NEARBY: 'location-outline',
  ALERT: 'alert-circle-outline',
  COMMENT: 'chatbubble-outline',
  POST_UPDATE: 'refresh-outline',
  MATCH_SUGGESTION: 'git-compare-outline',
  CONTACT_REQUEST: 'mail-outline',
  WELCOME: 'happy-outline',
  INFO: 'information-circle-outline',
};

export default function NotificationsScreen() {
  const { t, dateLocale } = useI18n();
  const c = useColors();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async (p: number, mode: 'initial' | 'refresh' | 'more') => {
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      const res = await api.get<NotificationPage>('/notifications/me', { params: { page: p, limit: 20 } });
      setItems((prev) => (p === 1 ? res.data.items : [...prev, ...res.data.items.filter((n) => !prev.some((x) => x.id === n.id))]));
      setUnread(res.data.unreadCount);
      setHasMore(res.data.hasMore);
      setPage(p);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void load(1, 'initial');
  }, [load]);

  const open = async (n: AppNotification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      api.post(`/notifications/me/read/${n.id}`).catch(() => undefined);
    }
    if (n.type === 'CONTACT_REQUEST') router.push('/contact-requests');
    else if (n.postId) router.push({ pathname: '/post/[id]', params: { id: n.postId } });
  };

  const markAll = async () => {
    const prev = items;
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    setUnread(0);
    try {
      await api.post('/notifications/me/read-all');
    } catch (e) {
      setItems(prev);
      setError(e);
    }
  };

  if (loading) return <StateView kind="loading" />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ headerRight: () => (unread ? <Button title={t('notifications.markAll')} variant="ghost" onPress={markAll} /> : null) }} />
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, 'refresh')} tintColor={c.primary} />}
        onEndReached={() => hasMore && !error && void load(page + 1, 'more')}
        ListHeaderComponent={error ? <StateView kind="error" title={describeError(error, t)} actionLabel={t('common.retry')} onAction={() => load(1, 'initial')} /> : null}
        ListEmptyComponent={!error ? <StateView kind="empty" icon="notifications-off-outline" title={t('notifications.empty')} body={t('notifications.emptyBody')} /> : null}
        ListFooterComponent={hasMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.read ? '' : t('notifications.unread') + '. '}${item.title ?? ''}. ${item.message}`}
            onPress={() => open(item)}
            style={{ flexDirection: 'row', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: item.read ? c.bg : c.card }}
          >
            <Ionicons name={ICONS[item.type] ?? 'notifications-outline'} size={22} color={item.read ? c.muted : c.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              {item.title ? <Text style={{ color: c.text, fontWeight: item.read ? '500' : '700' }}>{item.title}</Text> : null}
              <Text style={{ color: c.muted }} numberOfLines={3}>
                {item.message}
              </Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>{timeAgo(item.createdAt, dateLocale)}</Text>
            </View>
            {!item.read ? <View accessibilityElementsHidden style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary, marginTop: 6 }} /> : null}
          </Pressable>
        )}
      />
    </View>
  );
}
