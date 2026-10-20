import { useCallback, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useArea } from '@/context/LocationContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { buildPostFormData, emptyDraft, isDirty, type LfWindow, type PickedImage, type PostDraft } from '@/lib/post-form';
import { CONTENT_MAX, IMAGE_TYPES, MAX_IMAGE_BYTES, TITLE_MAX, validTitle } from '@/lib/validation';
import { LOST_FOUND_ITEM_TYPES, type CreatedPost } from '@/lib/types';
import { CATEGORY_META, CATEGORY_ORDER } from '@/constants/categories';
import { LeafletMap, type LeafletMapHandle } from '@/components/LeafletMap';
import type { FromMap } from '@/lib/map-bridge';
import { Button, Chip, Field, SectionTitle, useColors } from '@/components/ui';

type Step = 1 | 2 | 3 | 4;

export default function CreateScreen() {
  const { t } = useI18n();
  const c = useColors();
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
    if (msg.type === 'MOVE_END' || msg.type === 'READY') {
      if (msg.type === 'MOVE_END') setDraft((d) => ({ ...d, latitude: msg.lat, longitude: msg.lng }));
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
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
      {step > 1 ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => setStep((s) => (s - 1) as Step)} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>
          {t('create.title')}
        </Text>
        <Text style={{ color: c.muted, fontSize: 12 }}>{t('create.step', { n: step })}</Text>
      </View>
      {isDirty(draft, image) ? <Button title={t('common.cancel')} variant="ghost" onPress={cancel} /> : null}
    </View>
  );

  const footer = (
    <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.card, gap: 8 }}>
      {errors ? (
        <Text accessibilityLiveRegion="polite" style={{ color: c.danger }}>
          {errors}
        </Text>
      ) : null}
      {step < 4 ? (
        <Button title={t('common.next')} onPress={goNext} disabled={step === 1 && !draft.category} />
      ) : (
        <Button
          title={progress !== null ? t('create.uploading', { p: progress }) : submitting ? t('create.posting') : t('create.post')}
          onPress={submit}
          loading={submitting}
        />
      )}
    </View>
  );

  if (step === 2) {
    const start = draft.latitude !== null ? { lat: draft.latitude, lng: draft.longitude! } : area ? { lat: area.latitude, lng: area.longitude } : null;
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <Text style={{ color: c.muted, paddingHorizontal: 16, paddingBottom: 8 }}>{t('create.moveMap')}</Text>
        <View style={{ flex: 1 }}>
          {start ? <LeafletMap ref={map} initial={{ ...start, zoom: 16 }} onMessage={onMapMessage} pinMode accessibilityLabel={t('create.locationTitle')} /> : null}
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="location" size={44} color={c.danger} style={{ marginTop: -44 }} />
          </View>
          <View style={{ position: 'absolute', top: 8, right: 8 }}>
            <Button title={t('create.useMyLocation')} icon="navigate" variant="secondary" onPress={locateMe} />
          </View>
        </View>
        <View style={{ padding: 16, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '600' }}>{t('create.approximate')}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>{t('create.approximateHint')}</Text>
          </View>
          <Switch accessibilityLabel={t('create.approximate')} value={draft.approximate} onValueChange={(v) => update({ approximate: v })} />
        </View>
        {footer}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {header}
        <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <>
              <SectionTitle>{t('create.chooseCategory')}</SectionTitle>
              {CATEGORY_ORDER.filter((id) => id !== 'DANGER').map((id) => {
                const meta = CATEGORY_META[id];
                const selected = draft.category === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => update({ category: id })}
                    style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: selected ? meta.color : c.border, backgroundColor: c.card }}
                  >
                    <Ionicons name={meta.icon} size={24} color={meta.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{t(meta.label)}</Text>
                      <Text style={{ color: c.muted, marginTop: 2 }}>{t(`create.guidance.${id}`)}</Text>
                    </View>
                  </Pressable>
                );
              })}
              <Text style={{ color: c.muted, fontSize: 13, marginTop: 8 }}>{t('create.guidance.DANGER')}</Text>
            </>
          ) : null}

          {step === 3 && draft.category ? (
            <>
              <Text style={{ color: c.muted, marginBottom: 8 }}>{t(`create.guidance.${draft.category}`)}</Text>
              {draft.category === 'LOST_FOUND' ? (
                <View style={{ gap: 8, marginBottom: 8 }}>
                  <SectionTitle>{t('create.lfDirection')}</SectionTitle>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Chip label={t('create.lost')} selected={draft.lfDirection === 'LOST'} onPress={() => update({ lfDirection: 'LOST' })} />
                    <Chip label={t('create.found')} selected={draft.lfDirection === 'FOUND'} onPress={() => update({ lfDirection: 'FOUND' })} />
                  </View>
                  <SectionTitle>{t('create.itemType')}</SectionTitle>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {LOST_FOUND_ITEM_TYPES.map((it) => (
                      <Chip key={it} label={t(`itemType.${it}`)} selected={draft.lfItemType === it} onPress={() => update({ lfItemType: it })} />
                    ))}
                  </View>
                  <SectionTitle>{t('create.when')}</SectionTitle>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
              <Field label={t('create.titleLabel')} value={draft.title} onChangeText={(v) => update({ title: v })} placeholder={t('create.titlePlaceholder')} max={TITLE_MAX} />
              <Field
                label={t('create.descriptionLabel')}
                value={draft.content}
                onChangeText={(v) => update({ content: v })}
                placeholder={t('create.descriptionPlaceholder')}
                multiline
                max={CONTENT_MAX}
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
              <SectionTitle>{t('create.photo')}</SectionTitle>
              {image ? (
                <View>
                  <Image source={{ uri: image.uri }} style={{ width: '100%', height: 200, borderRadius: 12 }} accessibilityIgnoresInvertColors />
                  <Button title={t('create.removePhoto')} variant="ghost" icon="trash-outline" onPress={() => setImage(null)} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button title={t('create.camera')} icon="camera-outline" variant="secondary" onPress={() => pick('camera')} style={{ flex: 1 }} />
                  <Button title={t('create.gallery')} icon="images-outline" variant="secondary" onPress={() => pick('gallery')} style={{ flex: 1 }} />
                </View>
              )}
              <Text style={{ color: c.warning, fontSize: 13, marginTop: 8 }}>{t('create.privacyWarning')}</Text>
            </>
          ) : null}

          {step === 4 && draft.category ? (
            <>
              <SectionTitle>{t('create.reviewTitle')}</SectionTitle>
              <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, gap: 8 }}>
                <Text style={{ color: CATEGORY_META[draft.category].color, fontWeight: '700' }}>{t(CATEGORY_META[draft.category].label)}</Text>
                <Text style={{ color: c.text, fontSize: 17, fontWeight: '700' }}>{draft.title.trim()}</Text>
                {draft.content.trim() ? <Text style={{ color: c.muted }}>{draft.content.trim()}</Text> : null}
                {image ? <Image source={{ uri: image.uri }} style={{ width: '100%', height: 160, borderRadius: 10 }} accessibilityIgnoresInvertColors /> : null}
                <Text style={{ color: c.text }}>
                  {t('create.publicLocation')}: <Text style={{ fontWeight: '700' }}>{draft.approximate ? t('create.approxShort') : t('create.exact')}</Text>
                </Text>
              </View>
              <Text style={{ color: c.warning, fontSize: 13 }}>{t('create.privacyWarning')}</Text>
            </>
          ) : null}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
