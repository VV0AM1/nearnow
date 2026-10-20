import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import type { Post } from '@/lib/types';
import { FeedPost } from '@/components/FeedPost';
import { StateView, useColors } from '@/components/ui';

interface SavedItem {
  id: string;
  postId: string;
  savedAt: string;
  post: Post;
}

export default function SavedPosts() {
  const { t } = useI18n();
  const c = useColors();
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const res = await api.get<SavedItem[]>('/users/me/saved');
      setItems(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (error && !items) return <StateView kind="error" title={describeError(error, t)} actionLabel={t('common.retry')} onAction={() => load()} />;
  if (!items) return <StateView kind="loading" />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={items}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <FeedPost item={item.post} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.primary} />}
        ListEmptyComponent={<StateView kind="empty" icon="bookmark-outline" title={t('profile.saved')} body={t('profile.savedEmpty')} />}
        contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
      />
    </View>
  );
}
