import { useFocusEffect } from 'expo-router';
import { useRealtime } from '@/context/RealtimeContext';

/** Unread notifications: live from the socket, re-synced whenever the screen regains focus. */
export function useUnreadCount() {
  const { unread, refreshUnread } = useRealtime();
  useFocusEffect(refreshUnread);
  return unread;
}
