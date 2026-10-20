import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { groupByDay, timeAgo } from '@/lib/format';
import type { AppNotification, NotificationPage, NotificationType } from '@/lib/types';
import { Button, Icon, PressableScale, StateView, Text, continuous, useTokens, type IoniconName } from '@/design';

const ICONS: Record<NotificationType, IoniconName> = {
  POST_NEARBY: 'location',
  ALERT: 'alert-circle',
  COMMENT: 'chatbubble',
  POST_UPDATE: 'refresh',
  MATCH_SUGGESTION: 'git-compare',
  CONTACT_REQUEST: 'mail',
  WELCOME: 'happy',
  INFO: 'information-circle',
};

export default function NotificationsScreen() {
  const { t, dateLocale } = useI18n();
  const tokens = useTokens();
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

  const sections = useMemo(() => groupByDay(items, { today: t('notifications.today'), yesterday: t('notifications.yesterday') }, dateLocale), [items, t, dateLocale]);

  const markRead = (n: AppNotification) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    api.post(`/notifications/me/read/${n.id}`).catch(() => undefined);
  };

  const open = (n: AppNotification) => {
    markRead(n);
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: tokens.colors.background }}>
        <StateView kind="loading" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerRight: () => (unread ? <Button title={t('notifications.markAll')} variant="plain" size="small" onPress={markAll} /> : null) }} />
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        style={{ backgroundColor: tokens.colors.background }}
        contentContainerStyle={{ padding: tokens.space.lg, flexGrow: 1 }}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, 'refresh')} tintColor={tokens.colors.accent} colors={[tokens.colors.accent]} />}
        onEndReached={() => hasMore && !error && void load(page + 1, 'more')}
        ListHeaderComponent={error ? <StateView kind="error" title={describeError(error, t)} actionLabel={t('common.retry')} onAction={() => load(1, 'initial')} /> : null}
        ListEmptyComponent={!error ? <StateView kind="empty" icon="notifications-off-outline" title={t('notifications.empty')} body={t('notifications.emptyBody')} /> : null}
        ListFooterComponent={hasMore ? <ActivityIndicator style={{ padding: tokens.space.lg }} color={tokens.colors.accent} /> : null}
        renderSectionHeader={({ section }) => (
          <Text variant="headline" accessibilityRole="header" style={{ marginTop: tokens.space.lg, marginBottom: tokens.space.sm, marginHorizontal: tokens.space.xs }}>
            {section.title}
          </Text>
        )}
        renderItem={({ item, index, section }) => (
          <NotificationRow item={item} first={index === 0} last={index === section.data.length - 1} onOpen={() => open(item)} onMarkRead={() => markRead(item)} timeLabel={timeAgo(item.createdAt, dateLocale)} />
        )}
      />
    </>
  );
}

function NotificationRow({ item, first, last, onOpen, onMarkRead, timeLabel }: { item: AppNotification; first: boolean; last: boolean; onOpen: () => void; onMarkRead: () => void; timeLabel: string }) {
  const { t } = useI18n();
  const tokens = useTokens();
  const corner = { borderTopLeftRadius: first ? tokens.radius.md : 0, borderTopRightRadius: first ? tokens.radius.md : 0, borderBottomLeftRadius: last ? tokens.radius.md : 0, borderBottomRightRadius: last ? tokens.radius.md : 0 };

  const row = (
    <PressableScale
      scaleOnPress={false}
      accessibilityLabel={`${item.read ? '' : t('notifications.unread') + '. '}${item.title ?? ''}. ${item.message}. ${timeLabel}`}
      accessibilityActions={item.read ? undefined : [{ name: 'markRead', label: t('notifications.markRead') }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'markRead' && onMarkRead()}
      onPress={onOpen}
      style={{ flexDirection: 'row', gap: tokens.space.md, padding: tokens.space.md, backgroundColor: tokens.colors.surface, ...corner, ...continuous }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: item.read ? tokens.colors.surfaceSecondary : tokens.colors.accentSoft }}>
        <Icon name={ICONS[item.type] ?? 'notifications'} size={18} color={item.read ? tokens.colors.labelSecondary : tokens.colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        {item.title ? (
          <Text variant="subheadline" weight={item.read ? '400' : '600'}>
            {item.title}
          </Text>
        ) : null}
        <Text variant="subheadline" tone="secondary" numberOfLines={3}>
          {item.message}
        </Text>
        <Text variant="caption1" tone="secondary">
          {timeLabel}
        </Text>
      </View>
      {!item.read ? <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.colors.accent, marginTop: 6 }} /> : null}
    </PressableScale>
  );

  return (
    <View>
      {item.read ? (
        row
      ) : (
        <ReanimatedSwipeable
          friction={2}
          rightThreshold={60}
          overshootRight={false}
          // Once read, the row re-renders without the swipeable, so it needs no explicit close.
          onSwipeableOpen={() => {
            void Haptics.selectionAsync().catch(() => undefined);
            onMarkRead();
          }}
          renderRightActions={() => (
            <View style={{ width: 96, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.accent, ...corner }}>
              <Icon name="checkmark-done" size={22} color={tokens.colors.onAccent} />
              <Text variant="caption1" weight="600" tone="onAccent">
                {t('notifications.markRead')}
              </Text>
            </View>
          )}
        >
          {row}
        </ReanimatedSwipeable>
      )}
      {!last ? <View style={{ height: 0.5, backgroundColor: tokens.colors.separator, marginLeft: 64 }} /> : null}
    </View>
  );
}
