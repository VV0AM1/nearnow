import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RateLimitService } from '../common/rate-limit.service';

function setup(overrides: Record<string, any> = {}) {
  const prisma: any = {
    post: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ authorId: 'author', status: 'ACTIVE' }),
    },
    report: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'r1', status: 'PENDING' }),
    },
    ...overrides,
  };
  const audit: any = { record: jest.fn() };
  return {
    prisma,
    service: new ReportsService(prisma, new RateLimitService(), audit),
  };
}

describe('ReportsService', () => {
  it('creates a report attributed to the authenticated reporter', async () => {
    const { prisma, service } = setup();
    await expect(
      service.create({ postId: 'p', reason: 'SPAM' }, 'reporter'),
    ).resolves.toMatchObject({ id: 'r1' });
    expect(prisma.report.create.mock.calls[0][0].data.reporterId).toBe(
      'reporter',
    );
  });

  it('rejects duplicate open reports from the same person', async () => {
    const { service } = setup({
      report: {
        findFirst: jest.fn().mockResolvedValue({ id: 'old' }),
        create: jest.fn(),
      },
    });
    await expect(
      service.create({ postId: 'p', reason: 'SPAM' }, 'reporter'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not let authors report their own post, nor report missing/removed posts', async () => {
    await expect(
      setup().service.create({ postId: 'p', reason: 'SPAM' }, 'author'),
    ).rejects.toBeInstanceOf(BadRequestException);
    const removed = setup({
      post: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ authorId: 'a', status: 'REMOVED' }),
      },
    });
    await expect(
      removed.service.create({ postId: 'p', reason: 'SPAM' }, 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rate-limits a single reporter', async () => {
    const { service } = setup();
    for (let i = 0; i < 10; i++)
      await service.create({ postId: 'p', reason: 'SPAM' }, 'spammer');
    await expect(
      service.create({ postId: 'p', reason: 'SPAM' }, 'spammer'),
    ).rejects.toMatchObject({ status: 429 });
  });
});
