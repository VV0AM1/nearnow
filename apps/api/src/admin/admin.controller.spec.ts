import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminController } from './admin.controller';

const ctx = (handler: (...a: any[]) => any, role?: Role) =>
  ({
    getHandler: () => handler,
    getClass: () => AdminController,
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  }) as unknown as ExecutionContext;

describe('Admin role checks', () => {
  const guard = new RolesGuard(new Reflector());
  const proto = AdminController.prototype;

  it('regular users cannot reach moderation endpoints', () => {
    expect(guard.canActivate(ctx(proto.getReports, Role.USER))).toBe(false);
    expect(guard.canActivate(ctx(proto.getReports))).toBe(false);
  });

  it('moderators can review content but not manage accounts', () => {
    expect(guard.canActivate(ctx(proto.getReports, Role.MODERATOR))).toBe(true);
    expect(guard.canActivate(ctx(proto.deletePost, Role.MODERATOR))).toBe(true);
    expect(guard.canActivate(ctx(proto.toggleBlockUser, Role.MODERATOR))).toBe(
      false,
    );
    expect(guard.canActivate(ctx(proto.getUsers, Role.MODERATOR))).toBe(false);
  });

  it('admins can do everything', () => {
    expect(guard.canActivate(ctx(proto.toggleBlockUser, Role.ADMIN))).toBe(
      true,
    );
  });
});
