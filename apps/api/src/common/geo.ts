const EARTH_RADIUS_KM = 6371;

export interface LatLng {
  latitude: number;
  longitude: number;
}

export function isValidLatitude(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

export function isValidLongitude(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance (haversine), numerically stable for small distances. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Bounding box that contains every point within `radiusKm` of the centre.
 * The cosine is clamped so the longitude span stays finite near the poles.
 */
export function boundingBox(center: LatLng, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111.32;
  const cosLat = Math.max(0.01, Math.cos(toRad(center.latitude)));
  const lngDelta = Math.min(180, radiusKm / (111.32 * cosLat));
  return {
    minLat: Math.max(-90, center.latitude - latDelta),
    maxLat: Math.min(90, center.latitude + latDelta),
    minLng: center.longitude - lngDelta,
    maxLng: center.longitude + lngDelta,
  };
}

/**
 * Rounds a coordinate to a grid of roughly `metres` so a published location
 * does not pinpoint a home or exact spot.
 */
export function approximateCoordinate(value: number, metres = 300): number {
  const step = metres / 111_320;
  return Number((Math.round(value / step) * step).toFixed(6));
}
