/** Small geodesy helpers for the native map views (no dependencies, unit-tested). */

const EARTH_KM = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Centre-to-corner distance of a visible region — the same measure the Leaflet map reports. */
export function regionRadiusKm(r: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }): number {
  return Math.max(haversineKm(r.latitude, r.longitude, r.latitude + r.latitudeDelta / 2, r.longitude + r.longitudeDelta / 2), 0.001);
}

/** Map span for a web-mercator zoom level on a view of `widthPx` × `heightPx`. */
export function zoomToDeltas(zoom: number, latitude: number, widthPx: number, heightPx: number) {
  const longitudeDelta = (360 / 2 ** zoom) * (widthPx / 256);
  const latitudeDelta = longitudeDelta * (heightPx / widthPx) * Math.cos(rad(latitude));
  return { latitudeDelta, longitudeDelta };
}

/** Closed GeoJSON ring approximating a circle of `radiusKm` around a point. */
export function circleRing(lat: number, lng: number, radiusKm: number, steps = 64): [number, number][] {
  const ring: [number, number][] = [];
  const dLat = (radiusKm / EARTH_KM) * (180 / Math.PI);
  const dLng = dLat / Math.cos(rad(lat));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return ring;
}
