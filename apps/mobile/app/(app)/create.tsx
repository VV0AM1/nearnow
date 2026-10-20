import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useArea } from '@/context/LocationContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { buildPostFormData, emptyDraft, isDirty, type LfWindow, type PickedImage, type PostDraft } from '@/lib/post-form';
import { CONTENT_MAX, IMAGE_TYPES, MAX_IMAGE_BYTES, TITLE_MAX, validTitle } from '@/lib/validation';
import { LOST_FOUND_ITEM_TYPES, type Category, type CreatedPost } from '@/lib/types';
import { CATEGORY_META, CATEGORY_ORDER, ITEM_TYPE_ICON } from '@/constants/categories';
import { LeafletMap, type LeafletMapHandle } from '@/components/LeafletMap';
import { CategoryBadge } from '@/components/PostStatus';
import type { FromMap } from '@/lib/map-bridge';
import { Banner, Button, Card, Chip, GlassSurface, Icon, IconButton, ListRow, ListSection, ListSwitchRow, PressableScale, Text, TextField, continuous, useTokens } from '@/design';

type Step = 1 | 2 | 3 | 4;
const STEPS: Step[] = [1, 2, 3, 4];
/** Grid the server snaps approximate locations to (`approximateCoordinate`, shown as "~300 m"). */
const APPROX_CELL_KM = 0.3;

export default function CreateScreen() {
  const { t } = useI18n();
  const tokens = useTokens();
  const router = useRouter();
  const { showToast } = useToast();
  const { area } = useArea();
  const map = useRef<LeafletMapHandle>(null);

  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [errors, setErrors] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const submittingRef = useRef(false);
  // Map scale for the approximate-location ring: centre-to-corner distance and the view size.
  const [viewKm, setViewKm] = useState<number | null>(null);
  const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);

  const update = (patch: Partial<PostDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const reset = () => {
    setDraft(emptyDraft());
    setImage(null);
    setStep(1);
    setErrors(null);
    setProgress(null);
  };

  const cancel = () => {
    if (!isDirty(draft, image)) return reset();
    Alert.alert(t('create.discardTitle'), t('create.discardBody'), [
      { text: t('create.keepEditing'), style: 'cancel' },
      { text: t('create.discard'), style: 'destructive', onPress: reset },
    ]);
  };

  const onMapMessage = useCallback((msg: FromMap) => {
    if (msg.type === 'MOVE_END') {
      setDraft((d) => ({ ...d, latitude: msg.lat, longitude: msg.lng }));
      setViewKm(msg.radiusKm);
    }
  }, []);

  const locateMe = async () => {
    const perm = await Location.requestForegroundPermissionsAsync().catch(() => null);
    if (!perm?.granted) return showToast(t('onboarding.locationDenied'), 'warning');
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      map.current?.send({ type: 'SET_VIEW', lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 17 });
      update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      showToast(t('onboarding.locationUnavailable'), 'warning');
    }
  };

  const pick = async (source: 'camera' | 'gallery') => {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return showToast(t(source === 'camera' ? 'create.cameraDenied' : 'create.galleryDenied'), 'warning');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 0.7, exif: false };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    const mimeType = a.mimeType ?? 'image/jpeg';
    if (!IMAGE_TYPES.includes(mimeType)) return showToast(t('create.photoType'), 'error');
    if (a.fileSize && a.fileSize > MAX_IMAGE_BYTES) return showToast(t('create.photoTooLarge'), 'error');
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    setImage({ uri: a.uri, mimeType, fileName: `photo.${ext}` });
  };

  const goNext = () => {
    setErrors(null);
    if (step === 1 && !draft.category) return;
    if (step === 2) {
      if (draft.latitude === null) {
        if (!area) return setErrors(t('create.needLocation'));
        update({ latitude: area.latitude, longitude: area.longitude });
      }
    }
    if (step === 3) {
      if (!validTitle(draft.title)) return setErrors(t('create.titleInvalid'));
      if (draft.category === 'LOST_FOUND' && (!draft.lfDirection || !draft.lfItemType)) return setErrors(t('create.lfIncomplete'));
    }
    setStep((s) => Math.min(4, s + 1) as Step);
  };

  const submit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setErrors(null);
    try {
      const body = buildPostFormData(draft, image);
      const res = await api.post<CreatedPost>('/posts', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (d) => d,
        timeout: 60_000,
        onUploadProgress: image ? (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)) : undefined,
      });
      showToast(t('create.success'), 'success');
      reset();
      router.push({ pathname: '/post/[id]', params: { id: res.data.id } });
    } catch (e) {
      setErrors(describeError(e, t));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setProgress(null);
    }
  };

  const header = (
    <View style={{ paddingHorizontal: tokens.space.sm, paddingTop: tokens.space.xs, paddingBottom: tokens.space.sm, gap: tokens.space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: tokens.minTouch }}>
        {step > 1 ? <IconButton icon="chevron-back" label={t('common.back')} onPress={() => setStep((s) => (s - 1) as Step)} color={tokens.colors.accent} /> : <View style={{ width: tokens.space.sm }} />}
        <View style={{ flex: 1, paddingHorizontal: tokens.space.xs }}>
          <Text variant="title2" weight="700">
            {t('create.title')}
          </Text>
          <Text variant="footnote" tone="secondary">
            {t('create.step', { n: step })}
          </Text>
        </View>
        {isDirty(draft, image) ? <Button title={t('common.cancel')} variant="plain" onPress={cancel} /> : null}
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('create.step', { n: step })}
        accessibilityValue={{ min: 1, max: 4, now: step }}
        style={{ flexDirection: 'row', gap: 6, paddingHorizontal: tokens.space.sm }}
      >
        {STEPS.map((s) => (
          <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: s <= step ? tokens.colors.accent : tokens.colors.separator }} />
        ))}
      </View>
    </View>
  );

  const footer = (
    <View style={{ padding: tokens.space.lg, borderTopWidth: 0.5, borderTopColor: tokens.colors.separator, backgroundColor: tokens.colors.surface, gap: tokens.space.sm }}>
      {errors ? <Banner tone="danger" icon="alert-circle" message={errors} /> : null}
      {progress !== null ? (
        <View style={{ height: 4, borderRadius: 2, backgroundColor: tokens.colors.accentSoft, overflow: 'hidden' }}>
          <View style={{ width: `${progress}%`, height: 4, backgroundColor: tokens.colors.accent }} />
        </View>
      ) : null}
      {step < 4 ? (
        <Button title={t('common.next')} size="large" block onPress={goNext} disabled={step === 1 && !draft.category} />
      ) : (
        <Button
          title={progress !== null ? t('create.uploading', { p: progress }) : submitting ? t('create.posting') : t('create.post')}
          icon="paper-plane"
          size="large"
          block
          haptic
          onPress={submit}
          loading={submitting}
        />
      )}
    </View>
  );

  if (step === 2) {
    // Pixels per km = half the view's diagonal / centre-to-corner distance reported by the map.
    const ringPx = viewKm && mapSize ? Math.min((APPROX_CELL_KM * Math.hypot(mapSize.width, mapSize.height)) / 2 / viewKm, Math.max(mapSize.width, mapSize.height) * 2) : null;
    const start = draft.latitude !== null ? { lat: draft.latitude, lng: draft.longitude! } : area ? { lat: area.latitude, lng: area.longitude } : null;
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: tokens.colors.background }}>
        {header}
        <Text variant="subheadline" tone="secondary" style={{ paddingHorizontal: tokens.space.lg, paddingBottom: tokens.space.sm }}>
          {t('create.moveMap')}
        </Text>
        <View style={{ flex: 1 }} onLayout={(e) => setMapSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
          {start ? <LeafletMap ref={map} initial={{ ...start, zoom: 16 }} onMessage={onMapMessage} pinMode accessibilityLabel={t('create.locationTitle')} /> : null}
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
            {draft.approximate && ringPx ? (
              <View style={{ position: 'absolute', width: ringPx, height: ringPx, borderRadius: ringPx / 2, backgroundColor: tokens.colors.accentSoft, borderWidth: 1.5, borderColor: tokens.colors.accent }} />
            ) : null}
            <View style={{ marginTop: -40 }}>
              <Icon name="location" size={44} color={tokens.colors.danger} />
            </View>
          </View>
          <View style={{ position: 'absolute', top: tokens.space.md, right: tokens.space.md }}>
            <GlassSurface style={{ borderRadius: tokens.radius.pill }}>
              <Button title={t('create.useMyLocation')} icon="navigate" variant="plain" size="small" onPress={locateMe} />
            </GlassSurface>
          </View>
        </View>
        <View style={{ backgroundColor: tokens.colors.surface }}>
          <ListSwitchRow title={t('create.approximate')} subtitle={t('create.approximateHint')} icon="eye-off" iconColor="#8E8E93" value={draft.approximate} onValueChange={(v) => update({ approximate: v })} />
        </View>
        {footer}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {header}
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: tokens.space.lg, gap: tokens.space.md }} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <>
              <Text variant="title3" weight="700">
                {t('create.chooseCategory')}
              </Text>
              <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.md }}>
                {CATEGORY_ORDER.filter((id) => id !== 'DANGER').map((id) => (
                  <CategoryTile key={id} id={id} selected={draft.category === id} onPress={() => update({ category: id })} />
                ))}
              </View>
              {draft.category ? (
                <Card>
                  <Text variant="subheadline">{t(`create.guidance.${draft.category}`)}</Text>
                </Card>
              ) : null}
              <Banner tone="danger" icon="alert-circle" message={t('create.guidance.DANGER')} />
            </>
          ) : null}

          {step === 3 && draft.category ? (
            <>
              <Text variant="subheadline" tone="secondary">
                {t(`create.guidance.${draft.category}`)}
              </Text>
              {draft.category === 'LOST_FOUND' ? (
                <View style={{ gap: tokens.space.sm, marginBottom: tokens.space.sm }}>
                  <Text variant="headline">{t('create.lfDirection')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
                    <Chip label={t('create.lost')} icon="help-circle-outline" selected={draft.lfDirection === 'LOST'} onPress={() => update({ lfDirection: 'LOST' })} />
                    <Chip label={t('create.found')} icon="hand-left-outline" selected={draft.lfDirection === 'FOUND'} onPress={() => update({ lfDirection: 'FOUND' })} />
                  </View>
                  <Text variant="headline" style={{ marginTop: tokens.space.sm }}>
                    {t('create.itemType')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
                    {LOST_FOUND_ITEM_TYPES.map((it) => (
                      <Chip key={it} label={t(`itemType.${it}`)} icon={ITEM_TYPE_ICON[it]} selected={draft.lfItemType === it} onPress={() => update({ lfItemType: it })} />
                    ))}
                  </View>
                  <Text variant="headline" style={{ marginTop: tokens.space.sm }}>
                    {t('create.when')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }}>
                    {(['today', 'yesterday', 'week'] as LfWindow[]).map((w) => (
                      <Chip
                        key={w}
                        label={t(w === 'today' ? 'create.whenToday' : w === 'yesterday' ? 'create.whenYesterday' : 'create.whenWeek')}
                        selected={draft.lfWindow === w}
                        onPress={() => update({ lfWindow: w })}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              <TextField label={t('create.titleLabel')} value={draft.title} onChangeText={(v) => update({ title: v })} placeholder={t('create.titlePlaceholder')} max={TITLE_MAX} returnKeyType="next" />
              <TextField
                label={t('create.descriptionLabel')}
                value={draft.content}
                onChangeText={(v) => update({ content: v })}
                placeholder={t('create.descriptionPlaceholder')}
                multiline
                max={CONTENT_MAX}
              />
              <Text variant="headline">{t('create.photo')}</Text>
              {image ? (
                <View style={{ flexDirection: 'row' }}>
                  <View>
                    <Image source={{ uri: image.uri }} contentFit="cover" accessibilityIgnoresInvertColors style={{ width: 120, height: 120, borderRadius: tokens.radius.md, ...continuous }} />
                    <View style={{ position: 'absolute', top: -10, right: -10 }}>
                      <IconButton icon="close-circle" label={t('create.removePhoto')} variant="filled" size={24} onPress={() => setImage(null)} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: tokens.space.sm }}>
                  <Button title={t('create.camera')} icon="camera-outline" variant="tinted" onPress={() => pick('camera')} style={{ flex: 1 }} />
                  <Button title={t('create.gallery')} icon="images-outline" variant="tinted" onPress={() => pick('gallery')} style={{ flex: 1 }} />
                </View>
              )}
              <Banner tone="warning" icon="shield-checkmark-outline" message={t('create.privacyWarning')} />
            </>
          ) : null}

          {step === 4 && draft.category ? (
            <>
              <Text variant="title3" weight="700">
                {t('create.reviewTitle')}
              </Text>
              <Card style={{ gap: tokens.space.sm }}>
                <CategoryBadge post={{ category: draft.category }} />
                <Text variant="headline">{draft.title.trim()}</Text>
                {draft.content.trim() ? (
                  <Text variant="subheadline" tone="secondary">
                    {draft.content.trim()}
                  </Text>
                ) : null}
                {image ? (
                  <Image
                    source={{ uri: image.uri }}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                    style={{ width: '100%', aspectRatio: 16 / 10, borderRadius: tokens.radius.md, ...continuous }}
                  />
                ) : null}
              </Card>
              <ListSection style={{ marginBottom: 0 }}>
                <ListRow title={t('create.publicLocation')} value={draft.approximate ? t('create.approxShort') : t('create.exact')} icon={draft.approximate ? 'eye-off' : 'location'} iconColor="#34C759" onPress={() => setStep(2)} />
              </ListSection>
              <Banner tone="warning" icon="shield-checkmark-outline" message={t('create.privacyWarning')} />
            </>
          ) : null}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Two-column category tile: symbol in the category colour, label, checkmark when chosen. */
function CategoryTile({ id, selected, onPress }: { id: Exclude<Category, 'DANGER'>; selected: boolean; onPress: () => void }) {
  const { t } = useI18n();
  const tokens = useTokens();
  const meta = CATEGORY_META[id];
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={t(meta.label)}
      onPress={onPress}
      haptic
      style={{
        width: '47.5%',
        flexGrow: 1,
        minHeight: 104,
        padding: tokens.space.md,
        gap: tokens.space.sm,
        borderRadius: tokens.radius.lg,
        backgroundColor: tokens.colors.surface,
        borderWidth: 2,
        borderColor: selected ? tokens.colors.accent : 'transparent',
        ...continuous,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${meta.color}22`, alignItems: 'center', justifyContent: 'center', ...continuous }}>
          <Icon name={meta.icon} size={22} color={meta.color} />
        </View>
        {selected ? <Icon name="checkmark-circle" size={22} color={tokens.colors.accent} /> : null}
      </View>
      <Text variant="headline">{t(meta.label)}</Text>
    </PressableScale>
  );
}
