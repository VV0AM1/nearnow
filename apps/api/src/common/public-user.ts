import { Prisma } from '@prisma/client';

/** Fields of another user that may be shown publicly. Never includes email. */
export const publicUserSelect = {
  id: true,
  name: true,
  avatar: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export interface PublicUser {
  id: string;
  name: string;
  avatar: string | null;
}

export function toPublicUser(
  user: PublicUserRecord | null | undefined,
): PublicUser | null {
  if (!user) return null;
  if (user.deletedAt)
    return { id: user.id, name: 'Deleted user', avatar: null };
  return {
    id: user.id,
    name: user.name?.trim() || 'Neighbour',
    avatar: user.avatar ?? null,
  };
}
