import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import api from '@/services/api';

/** Unread notifications, refreshed whenever the screen regains focus. */
export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    api
      .get<{ count: number }>('/notifications/me/unread-count')
      .then((res) => setCount(res.data.count))
      .catch(() => undefined);
  }, []);
  useFocusEffect(refresh);
  return count;
}
