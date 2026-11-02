/**
 * Default map engine (web, tests): the Leaflet WebView. iOS and Android resolve
 * `NativeMap.ios.tsx` / `NativeMap.android.tsx` instead.
 */
export { LeafletMap as NativeMap } from '../LeafletMap';
export type { NearMapHandle, NearMapProps } from './types';
