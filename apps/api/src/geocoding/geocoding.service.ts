import { Injectable, Logger } from '@nestjs/common';
import { appConfig } from '../common/env';

export interface ReverseGeocodeResult {
  neighborhood: string;
  city: string;
  country: string;
}

/**
 * Server-side reverse geocoding behind a provider switch.
 *
 * Disabled unless GEOCODER_PROVIDER=nominatim. Nominatim's usage policy requires an
 * identifying User-Agent, at most one request per second and caching; this adapter
 * serialises requests, caches by ~110 m grid cell and fails closed (returns null).
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly cache = new Map<string, ReverseGeocodeResult | null>();
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  get enabled() {
    return appConfig().geocoderProvider === 'nominatim';
  }

  async reverse(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResult | null> {
    if (!this.enabled) return null;
    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    if (this.cache.has(key)) return this.cache.get(key) ?? null;

    const result = await this.enqueue(() =>
      this.fetchNominatim(latitude, longitude),
    );
    if (this.cache.size > 2000)
      this.cache.delete(this.cache.keys().next().value as string);
    this.cache.set(key, result);
    return result;
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastRequestAt + 1100 - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.lastRequestAt = Date.now();
      return task();
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async fetchNominatim(
    lat: number,
    lon: number,
  ): Promise<ReverseGeocodeResult | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lon}&accept-language=en`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': appConfig().geocoderUserAgent! },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { address?: Record<string, string> };
      const a = data.address;
      if (!a) return null;
      const city = a.city || a.town || a.village || a.municipality;
      const hood =
        a.neighbourhood ||
        a.suburb ||
        a.quarter ||
        a.city_district ||
        a.district;
      if (!city) return null;
      return {
        neighborhood: (hood || city).trim(),
        city: city.trim(),
        country: (a.country || '').trim(),
      };
    } catch (e) {
      this.logger.warn(`Reverse geocoding failed: ${(e as Error).message}`);
      return null;
    }
  }
}
