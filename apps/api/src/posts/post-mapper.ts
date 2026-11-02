import {
  Category,
  ConfirmationState,
  LostFoundDirection,
  LostFoundItemType,
  LostFoundStatus,
  PostStatus,
  Prisma,
  SourceType,
  VerificationStatus,
} from '@prisma/client';
import {
  publicUserSelect,
  PublicUser,
  toPublicUser,
} from '../common/public-user';
import { effectiveStatus, isStale } from './post-lifecycle';

export const postInclude = {
  author: { select: publicUserSelect },
  neighborhood: {
    select: {
      id: true,
      name: true,
      city: { select: { name: true, country: true } },
    },
  },
  lostFound: true,
  _count: { select: { comments: true } },
} satisfies Prisma.PostInclude;

export type PostRecord = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export interface ViewerState {
  isAuthor: boolean;
  hasVoted: boolean;
  hasSaved: boolean;
  confirmation: ConfirmationState | null;
}

export interface PostDto {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  category: Category;
  latitude: number;
  longitude: number;
  isApproximateLocation: boolean;
  author: PublicUser | null;
  neighborhood: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
  } | null;
  status: PostStatus;
  isStale: boolean;
  verificationStatus: VerificationStatus;
  source: { type: SourceType; name: string | null; url: string | null };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  lastConfirmedAt: Date | null;
  resolvedAt: Date | null;
  resolutionNote: string | null;
  likes: number;
  commentCount: number;
  /** Kept for older web clients that read `_count.comments`. */
  _count: { comments: number };
  confirmations: { stillHappening: number; noLongerPresent: number };
  distanceKm?: number;
  lostFound: {
    direction: LostFoundDirection;
    itemType: LostFoundItemType;
    occurredFrom: Date;
    occurredTo: Date;
    status: LostFoundStatus;
  } | null;
  viewer?: ViewerState;
}

export interface MapOptions {
  now?: Date;
  confirmations?: { stillHappening: number; noLongerPresent: number };
  distanceKm?: number;
  viewer?: ViewerState;
}

export function toPostDto(post: PostRecord, opts: MapOptions = {}): PostDto {
  const now = opts.now ?? new Date();
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    category: post.category,
    latitude: post.latitude,
    longitude: post.longitude,
    isApproximateLocation: post.isApproximateLocation,
    author: toPublicUser(post.author),
    neighborhood: post.neighborhood
      ? {
          id: post.neighborhood.id,
          name: post.neighborhood.name,
          city: post.neighborhood.city?.name ?? null,
          country: post.neighborhood.city?.country ?? null,
        }
      : null,
    status: effectiveStatus(post, now),
    isStale: isStale(post, now),
    verificationStatus: post.verificationStatus,
    source: {
      type: post.sourceType,
      name: post.sourceName,
      url: post.sourceUrl,
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    expiresAt: post.expiresAt,
    lastConfirmedAt: post.lastConfirmedAt,
    resolvedAt: post.resolvedAt,
    resolutionNote: post.resolutionNote,
    likes: post.likes,
    commentCount: post._count.comments,
    _count: { comments: post._count.comments },
    confirmations: opts.confirmations ?? {
      stillHappening: 0,
      noLongerPresent: 0,
    },
    ...(opts.distanceKm !== undefined
      ? { distanceKm: Math.round(opts.distanceKm * 100) / 100 }
      : {}),
    lostFound: post.lostFound
      ? {
          direction: post.lostFound.direction,
          itemType: post.lostFound.itemType,
          occurredFrom: post.lostFound.occurredFrom,
          occurredTo: post.lostFound.occurredTo,
          status: post.lostFound.status,
        }
      : null,
    ...(opts.viewer ? { viewer: opts.viewer } : {}),
  };
}
