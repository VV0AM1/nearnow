export interface Place {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

/** Pilot cities offered without needing location permission (centre coordinates). */
export const PILOT_CITIES: Place[] = [
  { name: 'Barcelona', country: 'Spain', latitude: 41.3851, longitude: 2.1734 },
  { name: "L'Hospitalet de Llobregat", country: 'Spain', latitude: 41.3596, longitude: 2.1002 },
  { name: 'Badalona', country: 'Spain', latitude: 41.45, longitude: 2.2474 },
];

export const RADIUS_OPTIONS_KM = [1, 2, 5, 10, 25] as const;
export const DEFAULT_RADIUS_KM = 5;
