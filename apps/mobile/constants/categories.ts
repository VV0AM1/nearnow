import type { Ionicons } from '@expo/vector-icons';
import type { Category, LostFoundItemType } from '@/lib/types';
import { CATEGORY_IDS } from '@/lib/types';

type IconName = keyof typeof Ionicons.glyphMap;

export interface CategoryMeta {
  id: Category;
  /** i18n key */
  label: string;
  color: string;
  icon: IconName;
  /** Marker shape on the map so colour is never the only signal. */
  shape: 'circle' | 'square' | 'diamond' | 'triangle';
}

/** Reserve strong red for genuinely urgent content; everything else is calm. */
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  DANGER: { id: 'DANGER', label: 'category.DANGER', color: '#dc2626', icon: 'alert-circle', shape: 'triangle' },
  CRIME: { id: 'CRIME', label: 'category.CRIME', color: '#ea580c', icon: 'warning', shape: 'diamond' },
  SAFETY: { id: 'SAFETY', label: 'category.SAFETY', color: '#0d9488', icon: 'shield-checkmark', shape: 'diamond' },
  LOST_FOUND: { id: 'LOST_FOUND', label: 'category.LOST_FOUND', color: '#ca8a04', icon: 'search', shape: 'square' },
  EVENT: { id: 'EVENT', label: 'category.EVENT', color: '#7c3aed', icon: 'calendar', shape: 'circle' },
  RECOMMENDATION: { id: 'RECOMMENDATION', label: 'category.RECOMMENDATION', color: '#db2777', icon: 'heart', shape: 'circle' },
  GENERAL: { id: 'GENERAL', label: 'category.GENERAL', color: '#2563eb', icon: 'chatbubble-ellipses', shape: 'circle' },
};

/** Display order for filters and the create flow (urgent help last, so it is never a default). */
export const CATEGORY_ORDER: Category[] = ['GENERAL', 'EVENT', 'LOST_FOUND', 'RECOMMENDATION', 'SAFETY', 'CRIME', 'DANGER'];

export const isCategory = (v: unknown): v is Category => typeof v === 'string' && (CATEGORY_IDS as readonly string[]).includes(v);

/** Symbol for each Lost & Found item type (shown next to its text label). */
export const ITEM_TYPE_ICON: Record<LostFoundItemType, IconName> = {
  KEYS: 'key',
  WALLET_BAG: 'wallet',
  ELECTRONICS: 'phone-portrait',
  DOCUMENT: 'card',
  PET: 'paw',
  CLOTHING: 'shirt',
  OTHER: 'cube',
};
