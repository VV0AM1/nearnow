import { useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { Button, Card, Chip, Field, SectionTitle, StateView, useColors } from '@/components/ui';

function Row({ icon, label, value, onPress, danger }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress: () => void; danger?: boolean }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
      <Ionicons name={icon} size={22} color={danger ? c.danger : c.text} />
      <Text style={{ flex: 1, color: danger ? c.danger : c.text, fontSize: 16 }}>{label}</Text>
      {value ? <Text style={{ color: c.muted }}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t, preference, setPreference } = useI18n();
  const c = useColors();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
        {loadError ? <StateView kind="error" title={describeError(loadError, t)} actionLabel={t('common.retry')} onAction={refresh} /> : <StateView kind="loading" />}
        <Button title={t('profile.signOut')} variant="ghost" onPress={confirmSignOut} />
      </SafeAreaView>
    );
  }

  const avatar = mediaUrl(user.avatar);
  const languages: LocalePreference[] = ['system', 'en', 'es', 'ca'];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.changePhoto')} onPress={changePhoto}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 72, height: 72, borderRadius: 36 }} />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{(user.name ?? '?').slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>
              {user.name ?? '—'}
            </Text>
            <Text style={{ color: c.muted }}>{user.email}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>{t('profile.level', { level: user.gamification.level, rank: user.gamification.rank })}</Text>
          </View>
        </View>

        {editingName ? (
          <Card>
            <Field label={t('auth.name')} value={name} onChangeText={setName} max={60} autoFocus />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title={t('common.cancel')} variant="secondary" onPress={() => setEditingName(false)} style={{ flex: 1 }} />
              <Button title={t('common.save')} onPress={saveName} loading={busy} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Button
            title={t('profile.editName')}
            variant="secondary"
            icon="create-outline"
            onPress={() => {
              setName(user.name ?? '');
              setEditingName(true);
            }}
          />
        )}

        <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {[
            [t('profile.posts'), user._count.posts],
            [t('profile.votes'), user._count.votes],
            [t('profile.comments'), user._count.comments],
          ].map(([label, n]) => (
            <View key={String(label)} style={{ alignItems: 'center' }} accessible accessibilityLabel={`${label}: ${n}`}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>{n}</Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Row icon="location-outline" label={t('profile.area')} value={area?.label ?? undefined} onPress={() => router.push('/city-picker')} />
          <Row icon="notifications-outline" label={t('profile.alerts')} onPress={() => router.push('/alerts')} />
          <Row icon="bookmark-outline" label={t('profile.saved')} onPress={() => router.push('/saved')} />
          <Row icon="mail-outline" label={t('profile.contacts')} onPress={() => router.push('/contact-requests')} />
        </Card>

        <SectionTitle>{t('profile.language')}</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {languages.map((l) => (
            <Chip key={l} label={t(`language.${l}`)} selected={preference === l} onPress={() => setPreference(l)} />
          ))}
        </View>

        <SectionTitle>{t('profile.theme')}</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['light', 'dark', 'system'] as const).map((m) => (
            <Chip key={m} label={t(`profile.${m}`)} selected={themeMode === m} onPress={() => setThemeMode(m)} />
          ))}
        </View>

        <Card>
          {config.privacyUrl ? <Row icon="document-text-outline" label={t('profile.privacy')} onPress={() => void Linking.openURL(config.privacyUrl!)} /> : null}
          {config.supportEmail ? <Row icon="help-circle-outline" label={t('profile.support')} onPress={() => void Linking.openURL(`mailto:${config.supportEmail}`)} /> : null}
          <Row icon="log-out-outline" label={t('profile.signOut')} onPress={confirmSignOut} />
          <Row icon="trash-outline" label={t('profile.deleteAccount')} onPress={() => setDeleteOpen(true)} danger />
          {__DEV__ ? <Row icon="color-palette-outline" label="Design kit (dev only)" onPress={() => router.push('/dev/gallery')} /> : null}
        </Card>
      </ScrollView>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <Card style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>
              {t('profile.deleteTitle')}
            </Text>
            <Text style={{ color: c.muted, lineHeight: 20 }}>{t('profile.deleteBody')}</Text>
            <Field label={t('profile.deleteTypeHere')} value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" autoCorrect={false} />
            <Button title={t('profile.deleteAccount')} variant="danger" onPress={deleteAccount} loading={busy} disabled={confirmText !== 'DELETE'} />
            <Button
              title={t('common.cancel')}
              variant="ghost"
              onPress={() => {
                setDeleteOpen(false);
                setConfirmText('');
              }}
            />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
