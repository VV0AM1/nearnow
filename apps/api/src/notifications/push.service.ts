import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { appConfig } from '../common/env';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

const EXPO_TOKEN = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/;

/**
 * Operating-system push via Expo's push service. Disabled unless PUSH_PROVIDER=expo;
 * the app's build must also have APNs/FCM credentials configured in EAS. Socket.IO
 * events are separate and only reach a connected app.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  get enabled() {
    return appConfig().pushProvider === 'expo';
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

  private async sendBatch(
    tokens: string[],
    message: PushMessage,
  ): Promise<number> {
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(
          tokens.map((to) => ({ to, sound: 'default', ...message })),
        ),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push request failed with HTTP ${res.status}`);
        return 0;
      }
      const body = (await res.json()) as {
        data?: { status: string; details?: { error?: string } }[];
      };
      const tickets = body.data ?? [];
      const dead = tokens.filter(
        (_, idx) => tickets[idx]?.details?.error === 'DeviceNotRegistered',
      );
      if (dead.length) {
        await this.prisma.deviceToken.updateMany({
          where: { token: { in: dead } },
          data: { revokedAt: new Date() },
        });
      }
      return tickets.filter((t) => t.status === 'ok').length;
    } catch (e) {
      this.logger.warn(`Expo push delivery error: ${(e as Error).message}`);
      return 0;
    }
  }
}
