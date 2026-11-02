/** API contracts shared by every screen. Mirrors apps/api (post-mapper, notifications). */

export const CATEGORY_IDS = ['GENERAL', 'CRIME', 'SAFETY', 'LOST_FOUND', 'EVENT', 'RECOMMENDATION', 'DANGER'] as const;
export type Category = (typeof CATEGORY_IDS)[number];

export type PostStatus = 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'REMOVED';
export type VerificationStatus = 'UNVERIFIED' | 'COMMUNITY_CONFIRMED' | 'OFFICIAL_SOURCE';
export type ConfirmationState = 'STILL_HAPPENING' | 'NO_LONGER_PRESENT';
export type LostFoundDirection = 'LOST' | 'FOUND';
export const LOST_FOUND_ITEM_TYPES = ['KEYS', 'WALLET_BAG', 'ELECTRONICS', 'DOCUMENT', 'PET', 'CLOTHING', 'OTHER'] as const;
export type LostFoundItemType = (typeof LOST_FOUND_ITEM_TYPES)[number];
export type LostFoundStatus = 'OPEN' | 'RETURNED' | 'CLOSED';

export interface PublicUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  category: Category;
  latitude: number;
  longitude: number;
  isApproximateLocation: boolean;
  author: PublicUser | null;
  neighborhood: { id: string; name: string; city: string | null; country: string | null } | null;
  status: PostStatus;
  isStale: boolean;
  verificationStatus: VerificationStatus;
  source: { type: 'COMMUNITY' | 'OFFICIAL'; name: string | null; url: string | null };
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  lastConfirmedAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  likes: number;
  commentCount: number;
  confirmations: { stillHappening: number; noLongerPresent: number };
  distanceKm?: number;
  lostFound: {
    direction: LostFoundDirection;
    itemType: LostFoundItemType;
    occurredFrom: string;
    occurredTo: string;
    status: LostFoundStatus;
  } | null;
  viewer?: { isAuthor: boolean; hasVoted: boolean; hasSaved: boolean; confirmation: ConfirmationState | null };
}

export interface CreatedPost extends Post {
  alertSummary?: { notified: number; pushDelivered: number };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  postId: string;
  author: PublicUser | null;
}

export type NotificationType =
  | 'INFO'
  | 'ALERT'
  | 'WELCOME'
  | 'POST_NEARBY'
  | 'COMMENT'
  | 'POST_UPDATE'
  | 'MATCH_SUGGESTION'
  | 'CONTACT_REQUEST';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string | null;
  message: string;
  read: boolean;
  createdAt: string;
  postId: string | null;
  post: { id: string; title: string; category: Category; status: PostStatus } | null;
}

export interface NotificationPage {
  items: AppNotification[];
  unreadCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AlertSettings {
  radiusKm: number;
  latitude: number | null;
  longitude: number | null;
  areaLabel: string | null;
  hasAlertArea: boolean;
  categories: Category[];
  pushEnabled: boolean;
  paused: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  timezone: string | null;
  pushAvailable: boolean;
}

export interface SelfUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  createdAt: string;
}

export interface Profile extends SelfUser {
  reputation: number;
  _count: { posts: number; votes: number; comments: number };
  gamification: { level: number; rank: string; points: number; nextLevelPoints: number; progress: number };
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: SelfUser;
}

export interface MatchSuggestion {
  label: string;
  score: number;
  reasons: string[];
  post: Post;
}

export type ContactStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';

export interface ContactRequests {
  incoming: {
    id: string;
    postId: string;
    postTitle: string | null;
    from: PublicUser | null;
    message: string;
    status: ContactStatus;
    responseMessage: string | null;
    createdAt: string;
  }[];
  outgoing: {
    id: string;
    postId: string;
    postTitle: string | null;
    to: PublicUser | null;
    message: string;
    status: ContactStatus;
    responseMessage: string | null;
    createdAt: string;
  }[];
}

export interface AreaActivity {
  generatedAt: string;
  windowDays: number;
  radiusKm: number;
  totalReports: number;
  areas: {
    id: string | null;
    name: string;
    city: string | null;
    reports: number;
    resolved: number;
    byCategory: Partial<Record<Category, number>>;
    lastReportAt: string | null;
  }[];
  method: string;
  disclaimer: string;
}

export type TimeWindow = '24h' | '7d' | '30d' | 'all';
