import React, { forwardRef } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { LeafletMap } from '../LeafletMap';
import type { NearMapHandle, NearMapProps } from './types';

export type { NearMapHandle, NearMapProps } from './types';

/**
 * MapLibre needs its native module, which Expo Go does not contain. Expo Go keeps
 * the Leaflet WebView; development and release builds use MapLibre + OpenFreeMap.
 * The MapLibre view is required lazily so Expo Go never loads it.
 */
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const NativeMap = forwardRef<NearMapHandle, NearMapProps>(function AndroidMap(props, ref) {
  if (inExpoGo) return <LeafletMap ref={ref} {...props} />;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MapLibreMap } = require('./MapLibreMap') as typeof import('./MapLibreMap');
  return <MapLibreMap ref={ref} {...props} />;
});
