import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { appConfig } from '../common/env';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

const EXPO_TOKEN = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/;
const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

/** Expo recommends checking receipts ~15 minutes after sending; they expire after 24 hours. */
export const RECEIPT_DELAY_MS = 15 * 60 * 1000;
export const RECEIPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RECEIPT_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const MAX_PENDING_RECEIPTS = 10_000;

interface PendingReceipt {
  token: string;
  sentAt: number;
}

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  details?: { error?: string };
};
type ExpoReceipt = {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

/**
 * Operating-system push via Expo's push service. Disabled unless PUSH_PROVIDER=expo;
 * the app's build must also have APNs/FCM credentials configured in EAS. Socket.IO
 * events are separate and only reach a connected app.
 *
 * Delivery is two-step: Expo first returns a "ticket" (accepted or rejected), and the
 * final delivery result ("receipt") is fetched later. Tokens reported as
 * DeviceNotRegistered at either step are revoked so we stop sending to uninstalled apps.
 * Pending receipts are kept in memory: after a restart some receipts go unchecked,
 * which only delays the clean-up of dead tokens until their next failed ticket.
 */
@Injectable()
export class PushService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PushService.name);
  private readonly pending = new Map<string, PendingReceipt>();
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  get enabled() {
    return appConfig().pushProvider === 'expo';
  }

  onModuleInit() {
    if (!this.enabled || process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(
      () => void this.checkReceipts(),
      RECEIPT_CHECK_INTERVAL_MS,
    );
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async registerDevice(userId: string, token: string, platform: string) {
    if (!EXPO_TOKEN.test(token))
      throw new BadRequestException('Invalid push token');
    await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, lastSeenAt: new Date(), revokedAt: null },
      create: { userId, token, platform },
    });
    return { registered: true, pushAvailable: this.enabled };
  }

  async revokeDevice(userId: string, token: string) {
    await this.prisma.deviceToken.updateMany({
      where: { userId, token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  revokeAllForUser(userId: string) {
    return this.prisma.deviceToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Number of receipts still waiting to be checked (for tests/diagnostics). */
  get pendingReceipts() {
    return this.pending.size;
  }

  /** Returns the number of devices Expo accepted the message for. */
  async sendToUsers(userIds: string[], message: PushMessage): Promise<number> {
    if (!this.enabled || !userIds.length) return 0;
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds }, revokedAt: null },
      select: { token: true },
    });
    let accepted = 0;
    for (let i = 0; i < devices.length; i += 100) {
      const batch = devices.slice(i, i + 100);
      accepted += await this.sendBatch(
        batch.map((d) => d.token),
        message,
      );
    }
    return accepted;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(process.env.EXPO_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
        : {}),
    };
  }

  private async revokeTokens(tokens: string[]) {
    if (!tokens.length) return;
    await this.prisma.deviceToken.updateMany({
      where: { token: { in: tokens }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async sendBatch(
    tokens: string[],
    message: PushMessage,
  ): Promise<number> {
    try {
      const res = await fetch(EXPO_SEND_URL, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(
          tokens.map((to) => ({ to, sound: 'default', ...message })),
        ),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push request failed with HTTP ${res.status}`);
        return 0;
      }
      const body = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = body.data ?? [];
      const now = Date.now();
      const dead: string[] = [];
      tickets.forEach((ticket, idx) => {
        const token = tokens[idx];
        if (!token) return;
        if (ticket.status === 'ok' && ticket.id) {
          if (this.pending.size < MAX_PENDING_RECEIPTS) {
            this.pending.set(ticket.id, { token, sentAt: now });
          }
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          dead.push(token);
        }
      });
      await this.revokeTokens(dead);
      return tickets.filter((t) => t.status === 'ok').length;
    } catch (e) {
      this.logger.warn(`Expo push delivery error: ${(e as Error).message}`);
      return 0;
    }
  }

  /**
   * Fetches final delivery receipts for tickets older than RECEIPT_DELAY_MS, revokes
   * tokens of uninstalled apps and drops receipts Expo no longer keeps.
   * Returns how many receipts reported a delivery error.
   */
  async checkReceipts(now = Date.now()): Promise<number> {
    for (const [id, p] of this.pending) {
      if (now - p.sentAt > RECEIPT_MAX_AGE_MS) this.pending.delete(id);
    }
    const due = [...this.pending.entries()].filter(
      ([, p]) => now - p.sentAt >= RECEIPT_DELAY_MS,
    );
    let failures = 0;
    for (let i = 0; i < due.length; i += 300) {
      const chunk = due.slice(i, i + 300);
      let receipts: Record<string, ExpoReceipt>;
      try {
        const res = await fetch(EXPO_RECEIPTS_URL, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({ ids: chunk.map(([id]) => id) }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          this.logger.warn(
            `Expo receipts request failed with HTTP ${res.status}`,
          );
          continue; // keep them pending and retry on the next run
        }
        receipts =
          ((await res.json()) as { data?: Record<string, ExpoReceipt> }).data ??
          {};
      } catch (e) {
        this.logger.warn(`Expo receipts error: ${(e as Error).message}`);
        continue;
      }
      const dead: string[] = [];
      for (const [id, p] of chunk) {
        const receipt = receipts[id];
        if (!receipt) continue; // not ready yet; retried until it expires
        this.pending.delete(id);
        if (receipt.status === 'error') {
          failures += 1;
          if (receipt.details?.error === 'DeviceNotRegistered')
            dead.push(p.token);
          else
            this.logger.warn(
              `Push delivery failed: ${receipt.details?.error ?? receipt.message ?? 'unknown'}`,
            );
        }
      }
      await this.revokeTokens(dead);
    }
    return failures;
  }
}
