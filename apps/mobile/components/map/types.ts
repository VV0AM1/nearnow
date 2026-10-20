import type { FromMap, ToMap } from '@/lib/map-bridge';

/**
 * One contract for every map engine (Apple Maps, MapLibre, the Leaflet WebView
 * fallback): screens send `ToMap` messages and receive validated `FromMap` events.
 */
export interface NearMapHandle {
  send: (msg: ToMap) => void;
}

export interface NearMapProps {
  initial: { lat: number; lng: number; zoom: number };
  onMessage: (msg: FromMap) => void;
  /** Location-picking mode: no markers, the screen draws its own centre pin. */
  pinMode?: boolean;
  accessibilityLabel: string;
}
