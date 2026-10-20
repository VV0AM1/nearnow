import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { getJSON, getString, KEYS, setJSON, setString } from '@/lib/storage';
import { DEFAULT_RADIUS_KM } from '@/constants/places';

export interface SelectedArea {
  latitude: number;
  longitude: number;
  label: string | null;
  /** 'device' = from GPS at the moment the user chose it; 'city' = picked manually. */
  source: 'device' | 'city';
}

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'blocked';

export type LocateResult =
  | { ok: true; area: SelectedArea }
  | { ok: false; reason: 'denied' | 'blocked' | 'unavailable' };

interface LocationValue {
  ready: boolean;
  area: SelectedArea | null;
  onboarded: boolean;
  permission: PermissionState;
  radiusKm: number;
  setArea: (area: SelectedArea) => void;
  setRadiusKm: (km: number) => void;
  completeOnboarding: () => void;
  /** Asks for foreground permission (only when the user taps) and reads the position once. */
  locateDevice: () => Promise<LocateResult>;
}

const LocationContext = createContext<LocationValue | null>(null);

const isArea = (v: unknown): v is SelectedArea => {
  const a = v as SelectedArea;
  return (
    !!a &&
    typeof a.latitude === 'number' &&
    typeof a.longitude === 'number' &&
    Math.abs(a.latitude) <= 90 &&
    Math.abs(a.longitude) <= 180 &&
    (a.source === 'device' || a.source === 'city')
  );
};

/** ~110 m precision is plenty for browsing and avoids sending an exact position. */
const coarse = (n: number) => Math.round(n * 1000) / 1000;

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [area, setAreaState] = useState<SelectedArea | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [radiusKm, setRadius] = useState(DEFAULT_RADIUS_KM);

  useEffect(() => {
    (async () => {
      const [saved, done, radius] = await Promise.all([getJSON(KEYS.area, isArea), getString(KEYS.onboarded), getString(KEYS.feedRadius)]);
      setAreaState(saved);
      setOnboarded(done === '1');
      const r = Number(radius);
      if (r >= 0.5 && r <= 50) setRadius(r);
      try {
        const p = await Location.getForegroundPermissionsAsync();
        setPermission(p.granted ? 'granted' : p.canAskAgain ? (p.status === 'undetermined' ? 'unknown' : 'denied') : 'blocked');
      } catch {
        // ignore
      }
      setReady(true);
    })();
  }, []);

  const setArea = useCallback((a: SelectedArea) => {
    setAreaState(a);
    void setJSON(KEYS.area, a);
  }, []);

  const setRadiusKm = useCallback((km: number) => {
    setRadius(km);
    void setString(KEYS.feedRadius, String(km));
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboarded(true);
    void setString(KEYS.onboarded, '1');
  }, []);

  const locateDevice = useCallback(async (): Promise<LocateResult> => {
    let perm;
    try {
      perm = await Location.requestForegroundPermissionsAsync();
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
    if (!perm.granted) {
      const state = perm.canAskAgain ? 'denied' : 'blocked';
      setPermission(state);
      return { ok: false, reason: state };
    }
    setPermission('granted');
    try {
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15_000)),
      ]).catch(async () => (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })) ?? Promise.reject(new Error('none')));
      const latitude = coarse(pos.coords.latitude);
      const longitude = coarse(pos.coords.longitude);
      let label: string | null = null;
      try {
        // Device (OS) geocoder; no third-party request is made from the app.
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        label = place?.district || place?.subregion || place?.city || null;
        if (place?.city && label && label !== place.city) label = `${label}, ${place.city}`;
      } catch {
        label = null;
      }
      return { ok: true, area: { latitude, longitude, label, source: 'device' } };
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  }, []);

  const value = useMemo(
    () => ({ ready, area, onboarded, permission, radiusKm, setArea, setRadiusKm, completeOnboarding, locateDevice }),
    [ready, area, onboarded, permission, radiusKm, setArea, setRadiusKm, completeOnboarding, locateDevice],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useArea() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useArea must be used inside LocationProvider');
  return ctx;
}
