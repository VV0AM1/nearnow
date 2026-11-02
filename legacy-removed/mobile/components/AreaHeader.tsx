import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { IconButton, useColors } from './ui';
import { UrgentHelpButton } from './SOSButton';

/** Top bar: which area is shown (tap to change), urgent help and notifications. */
export function AreaHeader() {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const { area } = useArea();
  const unread = useUnreadCount();
  const label = area?.label ?? (area?.source === 'device' ? t('area.near') : t('area.chosen'));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, gap: 4 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${t('area.change')}`}
        onPress={() => router.push('/city-picker')}
        style={{ flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}
      >
        <Text style={{ color: c.muted, fontSize: 12 }}>{area?.source === 'device' ? t('area.near') : t('area.chosen')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }} numberOfLines={1}>
            {label}
          </Text>
          <Ionicons name="chevron-down" size={16} color={c.muted} />
        </View>
      </Pressable>
      <UrgentHelpButton />
      <IconButton icon="notifications-outline" label={t('notifications.title')} badge={unread} onPress={() => router.push('/notifications')} />
    </View>
  );
}
