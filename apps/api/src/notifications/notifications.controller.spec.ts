import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RateLimitService } from '../common/rate-limit.service';

describe('Notification ownership', () => {
  const make = (count: number) => {
    const prisma: any = {
      notification: { updateMany: jest.fn().mockResolvedValue({ count }) },
    };
    const service = new NotificationsService(
      prisma,
      {} as any,
      { enabled: false } as any,
      new RateLimitService(),
    );
    return { prisma, service };
  };

  it('scopes mark-as-read to the caller', async () => {
    const { prisma, service } = make(1);
    await service.markAsRead('me', 'n1');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'n1', userId: 'me' },
      data: { read: true },
    });
  });

  it("returns 404 for someone else's notification instead of updating it", async () => {
    await expect(
      make(0).service.markAsRead('me', 'theirs'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects half-specified alert areas', async () => {
    const { service } = make(0);
    await expect(
      service.updateSettings('me', { latitude: 41.3 }),
    ).rejects.toThrow(/together/);
    await expect(
      service.updateSettings('me', { timezone: 'Mars/Olympus' }),
    ).rejects.toThrow(/timezone/);
  });
});
