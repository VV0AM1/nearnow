import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Modal, Platform, RefreshControl, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useArea } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useI18n, type LocalePreference } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { config, mediaUrl } from '@/lib/config';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/validation';
import type { Profile } from '@/lib/types';
import { Avatar, Button, Card, Icon, ListRow, ListSection, PressableScale, SegmentedControl, StateView, Text, TextField, useTokens } from '@/design';

const LANGUAGES: LocalePreference[] = ['system', 'en', 'es', 'ca'];

export default function ProfileScreen() {
  const { t, preference, setPreference } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { showToast } = useToast();
  const { user, refreshUser, signOut } = useAuth();
  const { area } = useArea();
  const { themeMode, setThemeMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loadError, setLoadError] = useState<unknown>(null);

  const refresh = async () => {
    setRefreshing(true);
    setLoadError(null);
    try {
      await refreshUser();
    } catch (e) {
      setLoadError(e);
    } finally {
      setRefreshing(false);
    }
  };

  const saveName = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await api.patch<Profile>('/users/me', { name: name.trim() });
      await refreshUser();
      setEditingName(false);
      showToast(t('profile.nameSaved'), 'success');
    } catch (e) {
      showToast(describeError(e, t), 'error');
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return showToast(t('create.galleryDenied'), 'warning');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, exif: false });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    const type = a.mimeType ?? 'image/jpeg';
    if (!IMAGE_TYPES.includes(type)) return showToast(t('create.photoType'), 'error');
    if (a.fileSize && a.fileSize > MAX_IMAGE_BYTES) return showToast(t('create.photoTooLarge'), 'error');
    const form = new FormData();
    form.append('file', { uri: a.uri, name: 'avatar.jpg', type } as unknown as Blob);
    try {
      await api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' }, transformRequest: (d) => d });
      await refreshUser();
      showToast(t('profile.photoUpdated'), 'success');
    } catch (e) {
      showToast(describeError(e, t), 'error');
    }
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setConfirmText('');
  };

  const deleteAccount = async () => {
    if (confirmText !== 'DELETE' || busy) return;
    setBusy(true);
    try {
      await api.delete('/users/me', { data: { confirm: 'DELETE' } });
      setDeleteOpen(false);
      showToast(t('profile.deleted'), 'success');
      await signOut('deleted');
    } catch (e) {
      showToast(describeError(e, t), 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmSignOut = () =>
    Alert.alert(t('profile.signOut'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: () => void signOut('user') },
    ]);

  if (!user) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: tokens.colors.background }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: tokens.space.lg }}>
        <Stack.Screen options={{ title: t('tabs.profile') }} />
        {loadError ? <StateView kind="error" title={describeError(loadError, t)} actionLabel={t('common.retry')} onAction={refresh} /> : <StateView kind="loading" />}
        <Button title={t('profile.signOut')} variant="plain" onPress={confirmSignOut} />
      </ScrollView>
    );
  }

  const stats: [string, number][] = [
    [t('profile.posts'), user._count.posts],
    [t('profile.votes'), user._count.votes],
    [t('profile.comments'), user._count.comments],
  ];

  return (
    <>
      <Stack.Screen options={{ title: t('tabs.profile') }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: tokens.colors.background }}
        contentContainerStyle={{ padding: tokens.space.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={tokens.colors.accent} colors={[tokens.colors.accent]} />}
      >
        {/* Identity */}
        <View style={{ alignItems: 'center', gap: tokens.space.sm, marginBottom: tokens.space.xl }}>
          <PressableScale accessibilityLabel={t('profile.changePhoto')} onPress={changePhoto} style={{ borderRadius: 48 }}>
            <Avatar uri={mediaUrl(user.avatar)} name={user.name} size={88} />
            <View
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: tokens.colors.accent,
                borderWidth: 2,
                borderColor: tokens.colors.background,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="camera" size={15} color={tokens.colors.onAccent} />
            </View>
          </PressableScale>
          <Text variant="title2" weight="700" align="center">
            {user.name ?? '—'}
          </Text>
          <Text variant="subheadline" tone="secondary" align="center">
            {user.email}
          </Text>
          <Text variant="footnote" tone="secondary" align="center">
            {t('profile.level', { level: user.gamification.level, rank: user.gamification.rank })}
          </Text>
          {!editingName ? (
            <Button
              title={t('profile.editName')}
              size="small"
              variant="tinted"
              icon="pencil"
              onPress={() => {
                setName(user.name ?? '');
                setEditingName(true);
              }}
            />
          ) : null}
        </View>

        {editingName ? (
          <Card style={{ gap: tokens.space.md, marginBottom: tokens.space.xxl }}>
            <TextField label={t('auth.name')} value={name} onChangeText={setName} max={60} autoFocus returnKeyType="done" onSubmitEditing={saveName} />
            <View style={{ flexDirection: 'row', gap: tokens.space.sm }}>
              <Button title={t('common.cancel')} variant="tinted" onPress={() => setEditingName(false)} style={{ flex: 1 }} />
              <Button title={t('common.save')} onPress={saveName} loading={busy} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : null}

        <Card style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: tokens.space.xxl }}>
          {stats.map(([label, n]) => (
            <View key={label} style={{ alignItems: 'center', flex: 1 }} accessible accessibilityLabel={`${label}: ${n}`}>
              <Text variant="title2" weight="700">
                {String(n)}
              </Text>
              <Text variant="caption1" tone="secondary" align="center">
                {label}
              </Text>
            </View>
          ))}
        </Card>

        <ListSection>
          <ListRow title={t('profile.area')} value={area?.label ?? undefined} icon="location" iconColor="#34C759" onPress={() => router.push('/city-picker')} />
          <ListRow title={t('profile.alerts')} icon="notifications" iconColor="#FF3B30" onPress={() => router.push('/alerts')} />
          <ListRow title={t('profile.saved')} icon="bookmark" iconColor="#FF9500" onPress={() => router.push('/saved')} />
          <ListRow title={t('profile.contacts')} icon="mail" onPress={() => router.push('/contact-requests')} />
        </ListSection>

        <ListSection header={t('profile.theme')}>
          <View style={{ padding: tokens.space.md }}>
            <SegmentedControl
              accessibilityLabel={t('profile.theme')}
              options={(['light', 'dark', 'system'] as const).map((m) => ({ value: m, label: t(`profile.${m}`) }))}
              value={themeMode}
              onChange={setThemeMode}
            />
          </View>
        </ListSection>

        <ListSection header={t('profile.language')}>
          {LANGUAGES.map((l) => (
            <ListRow key={l} title={t(`language.${l}`)} accessory={preference === l ? 'check' : 'none'} onPress={() => setPreference(l)} />
          ))}
        </ListSection>

        <ListSection>
          {config.privacyUrl ? <ListRow title={t('profile.privacy')} icon="document-text" iconColor="#8E8E93" onPress={() => void Linking.openURL(config.privacyUrl!)} /> : null}
          {config.supportEmail ? <ListRow title={t('profile.support')} icon="help-circle" iconColor="#8E8E93" onPress={() => void Linking.openURL(`mailto:${config.supportEmail}`)} /> : null}
          {__DEV__ ? <ListRow title="Design kit (dev only)" icon="color-palette" iconColor="#AF52DE" onPress={() => router.push('/dev/gallery')} /> : null}
        </ListSection>

        <ListSection>
          <ListRow title={t('profile.signOut')} accessory="none" onPress={confirmSignOut} />
          <ListRow title={t('profile.deleteAccount')} accessory="none" destructive onPress={() => setDeleteOpen(true)} />
        </ListSection>
      </ScrollView>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={closeDelete}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: tokens.colors.scrim, justifyContent: 'center', padding: tokens.space.xl }}>
          <Card style={{ gap: tokens.space.md }}>
            <Text variant="title3" weight="700">
              {t('profile.deleteTitle')}
            </Text>
            <Text variant="subheadline" tone="secondary">
              {t('profile.deleteBody')}
            </Text>
            <TextField label={t('profile.deleteTypeHere')} value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" autoCorrect={false} />
            <Button title={t('profile.deleteAccount')} variant="destructive" onPress={deleteAccount} loading={busy} disabled={confirmText !== 'DELETE'} block />
            <Button title={t('common.cancel')} variant="plain" onPress={closeDelete} block />
          </Card>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
