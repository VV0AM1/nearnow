import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  it('cannot block its own account', async () => {
    const service = new AdminService({} as any, {} as any);
    await expect(service.toggleBlockUser('me', 'me')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('blocking revokes device tokens and writes an audit entry', async () => {
    const tx: any = {
      user: { update: jest.fn() },
      deviceToken: { updateMany: jest.fn() },
    };
    const prisma: any = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'u', isBlocked: false, deletedAt: null }),
      },
      $transaction: (fn: any) => fn(tx),
    };
    const audit: any = { record: jest.fn() };
    await expect(
      new AdminService(prisma, audit).toggleBlockUser('u', 'admin', 'spam'),
    ).resolves.toEqual({ id: 'u', isBlocked: true });
    expect(tx.deviceToken.updateMany).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      'admin',
      'BLOCK_ACCOUNT',
      'USER',
      'u',
      'spam',
      tx,
    );
  });
});
