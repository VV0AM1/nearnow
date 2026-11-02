import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import api from '@/services/api';
import { useArea } from '@/context/LocationContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import type { SavedArea } from '@/lib/brief';
import type { Category } from '@/lib/types';
import { CATEGORY_META, CATEGORY_ORDER } from '@/constants/categories';
import { Banner, Button, Chip, IconButton, ListRow, ListSection, ListSwitchRow, StateView, Text, useTokens } from '@/design';

interface Prefs {
  enabled: boolean;
  categories: Category[];
}

/** Brief on/off, topics, and up to five saved areas (chosen by the user, never inferred). */
export default function BriefSettings() {
  const { t } = useI18n();
  const tokens = useTokens();
  const { showToast } = useToast();
  const { area } = useArea();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [areas, setAreas] = useState<SavedArea[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, a] = await Promise.all([api.get<Prefs>('/brief/preferences'), api.get<SavedArea[]>('/brief/areas')]);
      setPrefs(p.data);
      setAreas(a.data);
    } catch (e) {
      setError(e);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const update = async (patch: Partial<Prefs>) => {
    if (!prefs) return;
    const prev = prefs;
    setPrefs({ ...prefs, ...patch });
    try {
      const res = await api.patch<Prefs>('/brief/preferences', patch);
      setPrefs(res.data);
    } catch (e) {
      setPrefs(prev);
      showToast(describeError(e, t), 'error');
    }
  };

  const saveCurrent = async () => {
    if (!area) return;
    setSaving(true);
    try {
      const res = await api.post<SavedArea>('/brief/areas', { label: area.label ?? t('brief.currentArea'), latitude: area.latitude, longitude: area.longitude, radiusKm: 2 });
      setAreas((a) => [...a, res.data]);
      showToast(t('brief.saved'), 'success');
    } catch (e) {
      showToast(describeError(e, t), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: SavedArea) => {
    try {
      await api.delete(`/brief/areas/${a.id}`);
      setAreas((list) => list.filter((x) => x.id !== a.id));
      showToast(t('brief.removed'), 'success');
    } catch (e) {
      showToast(describeError(e, t), 'error');
    }
  };

  if (error && !prefs) return <StateView kind="error" title={describeError(error, t)} actionLabel={t('common.retry')} onAction={load} />;
  if (!prefs) return <StateView kind="loading" />;

  const toggleTopic = (c: Category) => void update({ categories: prefs.categories.includes(c) ? prefs.categories.filter((x) => x !== c) : [...prefs.categories, c] });

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: tokens.colors.background }} contentContainerStyle={{ padding: tokens.space.lg }}>
      <ListSection footer={t('brief.enabledHint')}>
        <ListSwitchRow title={t('brief.enabled')} icon="sparkles" value={prefs.enabled} onValueChange={(v) => void update({ enabled: v })} />
      </ListSection>

      <ListSection header={t('brief.topics')} footer={t('brief.topicsHint')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm, padding: tokens.space.md }}>
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} label={t(CATEGORY_META[c].label)} icon={CATEGORY_META[c].icon} color={CATEGORY_META[c].color} selected={prefs.categories.includes(c)} onPress={() => toggleTopic(c)} />
          ))}
        </View>
      </ListSection>

      <ListSection header={t('brief.savedAreas')} footer={t('brief.savedAreasHint')}>
        {areas.map((a) => (
          <ListRow
            key={a.id}
            title={a.label}
            subtitle={t('common.km', { km: a.radiusKm })}
            icon="location"
            iconColor="#34C759"
            accessory="none"
            right={<IconButton icon="trash-outline" label={t('brief.remove', { label: a.label })} color={tokens.colors.danger} onPress={() => void remove(a)} />}
          />
        ))}
        <View style={{ padding: tokens.space.md }}>
          <Button title={t('brief.saveCurrent')} icon="add" variant="tinted" block loading={saving} disabled={!area || areas.length >= 5} onPress={saveCurrent} />
        </View>
      </ListSection>

      <Banner tone="neutral" icon="notifications-outline" message={t('brief.notifyNote')} />
      <Text variant="footnote" tone="secondary" style={{ marginTop: tokens.space.lg, textAlign: 'center' }}>
        {area?.label ?? ''}
      </Text>
    </ScrollView>
  );
}
