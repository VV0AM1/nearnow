import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useArea } from '@/context/LocationContext';
import { useI18n } from '@/lib/i18n';
import { PILOT_CITIES, type Place } from '@/constants/places';
import { Field, useColors } from '@/components/ui';
import { AreaChooser } from '@/components/AreaChooser';

export default function CityPicker() {
  const { t } = useI18n();
  const c = useColors();
  const router = useRouter();
  const { setArea, completeOnboarding, area } = useArea();
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState<Place[]>([]);

  useEffect(() => {
    // Cities known to the server (labelled from posts); the pilot list works offline.
    api
      .get<Place[]>('/neighborhoods/cities')
      .then((res) => setRemote(res.data.filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')))
      .catch(() => undefined);
  }, []);

  const cities = useMemo(() => {
    const byName = new Map<string, Place>();
    for (const p of [...PILOT_CITIES, ...remote]) if (!byName.has(p.name) && p.name !== 'Unknown') byName.set(p.name, p);
    const q = query.trim().toLowerCase();
    return [...byName.values()].filter((p) => !q || p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q));
  }, [remote, query]);

  const done = () => {
    completeOnboarding();
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  };

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
      data={cities}
      keyExtractor={(p) => p.name}
      ListHeaderComponent={
        <View>
          <Text style={{ color: c.muted, marginBottom: 12 }}>{t('area.pilotNote')}</Text>
          <AreaChooser onChosen={done} showCityButton={false} />
          <View style={{ height: 16 }} />
          <Field label={t('area.search')} value={query} onChangeText={setQuery} autoCorrect={false} />
        </View>
      }
      ListEmptyComponent={<Text style={{ color: c.muted, textAlign: 'center', padding: 24 }}>{t('area.noCities')}</Text>}
      renderItem={({ item }) => {
        const selected = area?.source === 'city' && area.label === item.name;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              setArea({ latitude: item.latitude, longitude: item.longitude, label: item.name, source: 'city' });
              done();
            }}
            style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 }}
          >
            <Ionicons name="business-outline" size={20} color={c.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: c.muted }}>{item.country}</Text>
            </View>
            {selected ? <Ionicons name="checkmark" size={22} color={c.primary} /> : null}
          </Pressable>
        );
      }}
    />
  );
}
