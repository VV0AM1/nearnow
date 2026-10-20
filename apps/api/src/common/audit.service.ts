import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export type AuditTarget = 'POST' | 'REPORT' | 'USER' | 'CONTACT_REQUEST';

/** Records moderation-sensitive actions in ModerationAction. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    actorId: string,
    action: string,
    targetType: AuditTarget,
    targetId: string,
    reason?: string | null,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.moderationAction.create({
      data: { actorId, action, targetType, targetId, reason: reason ?? null },
    });
  }

  forTarget(targetType: AuditTarget, targetId: string) {
    return this.prisma.moderationAction.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        action: true,
        reason: true,
        createdAt: true,
        actor: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
