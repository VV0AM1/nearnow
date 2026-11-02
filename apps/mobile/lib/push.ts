import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from '@/services/api';
import { config } from './config';
import { getString, KEYS, setString } from './storage';

export type PushRegistration = 'registered' | 'unconfigured' | 'denied' | 'unsupported' | 'failed';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Registers this device for OS push. Requires an EAS project id at build time and a
 * physical device; returns a precise status instead of pretending push works.
 */
export async function registerForPush(ask: boolean): Promise<PushRegistration> {
  if (!config.easProjectId) return 'unconfigured';
  if (!Device.isDevice || Platform.OS === 'web') return 'unsupported';
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && ask) status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return 'denied';
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alerts', { name: 'Nearby alerts', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: config.easProjectId });
    await api.post('/notifications/me/devices', { token, platform: Platform.OS });
    await setString(KEYS.pushToken, token);
    return 'registered';
  } catch {
    return 'failed';
  }
}

/** Called before sign-out so this device stops receiving the previous user's alerts. */
export async function unregisterPush() {
  const token = await getString(KEYS.pushToken);
  if (!token) return;
  try {
    await api.delete(`/notifications/me/devices/${encodeURIComponent(token)}`);
  } finally {
    await setString(KEYS.pushToken, null);
  }
}

/** Extracts a safe post id from a notification payload. */
export function postIdFromNotification(data: unknown): string | null {
  const id = (data as { postId?: unknown } | null)?.postId;
  return typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}
