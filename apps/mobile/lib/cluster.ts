/**
 * Screen-space marker clustering shared by the native map engines (the Leaflet
 * fallback clusters itself). Greedy and O(n²), which is fine for the 100-post cap.
 */

export interface ClusterInput {
  id: string;
  lat: number;
  lng: number;
}

export type Clustered<T extends ClusterInput> = { kind: 'single'; item: T } | { kind: 'cluster'; key: string; lat: number; lng: number; items: T[] };

/** Web-mercator world pixel coordinates at `zoom` (256 px tiles). */
export function project(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = 256 * 2 ** zoom;
  const s = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * scale, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale };
}

/** Zoom level implied by a longitude span shown across `widthPx`. */
export function zoomForSpan(longitudeDelta: number, widthPx: number): number {
  return Math.log2((360 * (widthPx / 256)) / Math.max(longitudeDelta, 1e-9));
}

/** Groups markers closer than `radiusPx` on screen at `zoom`. Order and ids are stable. */
export function clusterMarkers<T extends ClusterInput>(items: T[], zoom: number, radiusPx = 44): Clustered<T>[] {
  const points = items.map((item) => ({ item, ...project(item.lat, item.lng, zoom) }));
  const used = new Set<number>();
  const out: Clustered<T>[] = [];
  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const group = [points[i]];
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;
      if (Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y) <= radiusPx) {
        used.add(j);
        group.push(points[j]);
      }
    }
    if (group.length === 1) out.push({ kind: 'single', item: points[i].item });
    else {
      const members = group.map((g) => g.item);
      out.push({
        kind: 'cluster',
        key: members.map((m) => m.id).sort().join('|'),
        lat: members.reduce((a, m) => a + m.lat, 0) / members.length,
        lng: members.reduce((a, m) => a + m.lng, 0) / members.length,
        items: members,
      });
    }
  }
  return out;
}
