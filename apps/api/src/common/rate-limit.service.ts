import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface Bucket {
  count: number;
  resetAt: number;
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

/**
 * Fixed-window, in-process rate limiter.
 *
 * Good enough for a single API instance. When the API is scaled horizontally the
 * counters must move to a shared store (REDIS_URL is already provisioned).
 */
@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Bucket>();
  private lastSweep = 0;
  private now: () => number = Date.now;

  /** Test hook: replace the clock. */
  useClock(now: () => number) {
    this.now = now;
  }

  /** Records one hit for `key`; throws 429 when more than `limit` hits fall inside the window. */
  consume(
    key: string,
    limit: number,
    windowMs: number,
    message = 'Too many requests. Please try again later.',
  ) {
    if (!this.tryConsume(key, limit, windowMs)) {
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  tryConsume(key: string, limit: number, windowMs: number): boolean {
    const now = this.now();
    this.sweep(now);
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }

  reset(key?: string) {
    if (key) this.buckets.delete(key);
    else this.buckets.clear();
  }

  private sweep(now: number) {
    if (now - this.lastSweep < MINUTE) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}
