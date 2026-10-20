/**
 * Message contract between React Native and the Leaflet WebView.
 * Post titles and other user text never enter the WebView: markers carry only an id,
 * coordinates and a style from a fixed set, so injected HTML is impossible.
 */
export type MarkerShape = 'circle' | 'square' | 'diamond' | 'triangle';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  shape: MarkerShape;
  dim: boolean;
}

export type FromMap =
  | { type: 'READY' }
  | { type: 'MARKER_PRESS'; id: string }
  | { type: 'MOVE_END'; lat: number; lng: number; radiusKm: number; byUser: boolean }
  | { type: 'TILE_ERROR' };

export type ToMap =
  | { type: 'SET_MARKERS'; markers: MapMarker[] }
  | { type: 'SET_VIEW'; lat: number; lng: number; zoom?: number }
  | { type: 'SET_AREA'; lat: number; lng: number; radiusKm: number };

const isNum = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const ID = /^[0-9a-f-]{36}$/i;

/** Parses and validates a message from the WebView; anything unexpected is dropped. */
export function parseMapMessage(raw: string): FromMap | null {
  if (raw.length > 2000) return null;
  let m: unknown;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  const msg = m as Record<string, unknown>;
  switch (msg?.type) {
    case 'READY':
    case 'TILE_ERROR':
      return { type: msg.type };
    case 'MARKER_PRESS':
      return typeof msg.id === 'string' && ID.test(msg.id) ? { type: 'MARKER_PRESS', id: msg.id } : null;
    case 'MOVE_END':
      return isNum(msg.lat, -90, 90) && isNum(msg.lng, -180, 180) && isNum(msg.radiusKm, 0, 20000)
        ? { type: 'MOVE_END', lat: msg.lat, lng: msg.lng, radiusKm: msg.radiusKm, byUser: msg.byUser === true }
        : null;
    default:
      return null;
  }
}

const COLOR = /^#[0-9a-f]{6}$/i;
const SHAPES: MarkerShape[] = ['circle', 'square', 'diamond', 'triangle'];

/** Script injected into the WebView. JSON.stringify yields a safe JS literal. */
export function toMapScript(msg: ToMap): string {
  if (msg.type === 'SET_MARKERS') {
    const markers = msg.markers.filter((mk) => ID.test(mk.id) && COLOR.test(mk.color) && SHAPES.includes(mk.shape));
    return `window.__nn && window.__nn.receive(${JSON.stringify({ ...msg, markers })});true;`;
  }
  return `window.__nn && window.__nn.receive(${JSON.stringify(msg)});true;`;
}
