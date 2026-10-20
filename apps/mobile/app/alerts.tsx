import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import api from '@/services/api';
import { useArea } from '@/context/LocationContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/lib/i18n';
import { describeError } from '@/lib/errors';
import { minutesToTime } from '@/lib/format';
import { registerForPush } from '@/lib/push';
import type { AlertSettings, Category } from '@/lib/types';
import { CATEGORY_META, CATEGORY_ORDER } from '@/constants/categories';
import { Button, Card, Chip, SectionTitle, StateView, useColors } from '@/components/ui';

const RADII = [0.5, 1, 2, 5, 10, 25];
const QUIET_PRESETS: [number, number][] = [
  [22 * 60, 7 * 60],
  [23 * 60, 8 * 60],
];

function SwitchRow({ label, hint, value, onChange, disabled }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 16 }}>{label}</Text>
        {hint ? <Text style={{ color: c.muted, fontSize: 12 }}>{hint}</Text> : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} disabled={disabled} />
    </View>
  );
}

/** Alert preferences stored on the server — they drive real delivery rules. */
export default function AlertsScreen() {
  const { t } = useI18n();
  const c = useColors();
  const { showToast } = useToast();
  const { area } = useArea();
  const [s, setS] = useState<AlertSettings | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .get<AlertSettings>('/notifications/me/settings')
      .then((res) => setS(res.data))
      .catch(setError);
  }, []);
  useEffect(load, [load]);

  const save = async (patch: Partial<AlertSettings>) => {
    if (!s) return;
    const prev = s;
    setS({ ...s, ...patch, hasAlertArea: patch.latitude !== undefined ? patch.latitude !== null : s.hasAlertArea });
    setSaving(true);
    try {
      const res = await api.patch<AlertSettings>('/notifications/me/settings', patch);
      setS(res.data);
      showToast(t('alerts.saved'), 'success');
    } catch (e) {
      setS(prev);
      showToast(describeError(e, t), 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePush = async (on: boolean) => {
    setPushNote(null);
    if (on) {
      const status = await registerForPush(true);
      if (status === 'denied') return setPushNote(t('alerts.pushDenied'));
      if (status !== 'registered') return setPushNote(t('alerts.pushUnavailable'));
    }
    await save({ pushEnabled: on });
  };

  const toggleCategory = (id: Category) => {
    if (!s) return;
    const next = s.categories.includes(id) ? s.categories.filter((x) => x !== id) : [...s.categories, id];
    void save({ categories: next });
  };

  if (error) return <StateView kind="error" title={describeError(error, t)} actionLabel={t('common.retry')} onAction={load} />;
  if (!s) return <StateView kind="loading" />;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const quietOn = s.quietHoursStart !== null && s.quietHoursEnd !== null;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ color: c.muted, lineHeight: 20 }}>{t('alerts.intro')}</Text>

      <SectionTitle>{t('alerts.area')}</SectionTitle>
      <Card style={{ gap: 8 }}>
        <Text style={{ color: s.hasAlertArea ? c.text : c.warning }}>{s.hasAlertArea ? (s.areaLabel ?? `${s.latitude?.toFixed(3)}, ${s.longitude?.toFixed(3)}`) : t('alerts.noArea')}</Text>
        {area ? (
          <Button
            title={t('alerts.useSelected', { label: area.label ?? t('area.near') })}
            variant="secondary"
            disabled={saving}
            onPress={() => save({ latitude: area.latitude, longitude: area.longitude, areaLabel: area.label ?? null, timezone })}
          />
        ) : null}
        {s.hasAlertArea ? <Button title={t('alerts.clearArea')} variant="ghost" disabled={saving} onPress={() => save({ latitude: null, longitude: null })} /> : null}
      </Card>

      <SectionTitle>{t('alerts.radius')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {RADII.map((r) => (
          <Chip key={r} label={t('common.km', { km: r })} selected={s.radiusKm === r} onPress={() => save({ radiusKm: r })} />
        ))}
      </View>

      <SectionTitle>{t('alerts.categories')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORY_ORDER.map((id) => (
          <Chip key={id} label={t(CATEGORY_META[id].label)} color={CATEGORY_META[id].color} selected={s.categories.includes(id)} onPress={() => toggleCategory(id)} />
        ))}
      </View>
      <Text style={{ color: c.muted, fontSize: 12 }}>{t('alerts.urgentNote')}</Text>

      <Card>
        <SwitchRow label={t('alerts.pause')} value={s.paused} onChange={(v) => save({ paused: v })} disabled={saving} />
        <SwitchRow
          label={t('alerts.push')}
          hint={s.pushAvailable ? t('alerts.pushHint') : t('alerts.pushUnavailable')}
          value={s.pushEnabled}
          onChange={togglePush}
          disabled={saving || !s.pushAvailable}
        />
        {pushNote ? <Text style={{ color: c.warning }}>{pushNote}</Text> : null}
        <SwitchRow
          label={t('alerts.quiet')}
          hint={quietOn ? t('alerts.quietRange', { from: minutesToTime(s.quietHoursStart!), to: minutesToTime(s.quietHoursEnd!) }) : undefined}
          value={quietOn}
          onChange={(v) => save(v ? { quietHoursStart: QUIET_PRESETS[0][0], quietHoursEnd: QUIET_PRESETS[0][1], timezone } : { quietHoursStart: null, quietHoursEnd: null })}
          disabled={saving}
        />
        {quietOn ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {QUIET_PRESETS.map(([from, to]) => (
              <Chip
                key={from}
                label={t('alerts.quietRange', { from: minutesToTime(from), to: minutesToTime(to) })}
                selected={s.quietHoursStart === from && s.quietHoursEnd === to}
                onPress={() => save({ quietHoursStart: from, quietHoursEnd: to, timezone })}
              />
            ))}
          </View>
        ) : null}
      </Card>
    </ScrollView>
  );
}
