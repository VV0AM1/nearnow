import { HttpException } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  it('allows `limit` hits per window then rejects with 429, and resets after the window', () => {
    let now = 0;
    const rl = new RateLimitService();
    rl.useClock(() => now);
    for (let i = 0; i < 3; i++) rl.consume('k', 3, 1000);
    expect(() => rl.consume('k', 3, 1000)).toThrow(HttpException);
    try {
      rl.consume('k', 3, 1000);
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(429);
    }
    now = 1001;
    expect(rl.tryConsume('k', 3, 1000)).toBe(true);
  });

  it('keeps keys independent', () => {
    const rl = new RateLimitService();
    expect(rl.tryConsume('a', 1, 1000)).toBe(true);
    expect(rl.tryConsume('a', 1, 1000)).toBe(false);
    expect(rl.tryConsume('b', 1, 1000)).toBe(true);
  });
});
