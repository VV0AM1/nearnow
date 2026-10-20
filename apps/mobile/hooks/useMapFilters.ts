import { useSyncExternalStore } from 'react';
import type { Filters } from '@/components/FilterBar';

/**
 * Map filters shared between the Map tab and its filter sheet (a separate route).
 * In memory only: filters reset when the app restarts.
 */
let current: Filters | null = null;
const listeners = new Set<() => void>();

export function setMapFilters(next: Filters) {
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current map filters; `fallback` seeds the store the first time. */
export function useMapFilters(fallback: Filters): Filters {
  const value = useSyncExternalStore(subscribe, () => current);
  return value ?? fallback;
}
