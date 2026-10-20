import type { Category, LostFoundDirection, LostFoundItemType } from './types';

export type LfWindow = 'today' | 'yesterday' | 'week';

export interface PostDraft {
  category: Category | null;
  latitude: number | null;
  longitude: number | null;
  approximate: boolean;
  title: string;
  content: string;
  lfDirection: LostFoundDirection | null;
  lfItemType: LostFoundItemType | null;
  lfWindow: LfWindow;
}

export interface PickedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

export const emptyDraft = (): PostDraft => ({
  category: null,
  latitude: null,
  longitude: null,
  approximate: true,
  title: '',
  content: '',
  lfDirection: null,
  lfItemType: null,
  lfWindow: 'today',
});

export const isDirty = (d: PostDraft, image: PickedImage | null) => !!(d.category || d.title.trim() || d.content.trim() || image);

export function lostFoundRange(w: LfWindow, now = new Date()): { from: Date; to: Date } {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (w === 'today') return { from: startOfToday, to: now };
  if (w === 'yesterday') return { from: new Date(startOfToday.getTime() - 86_400_000), to: startOfToday };
  return { from: new Date(now.getTime() - 7 * 86_400_000), to: now };
}

/**
 * Multipart body for POST /posts. The image goes in field "file" (what the API's
 * FileInterceptor expects); everything else is a plain string field.
 */
export function buildPostFormData(d: PostDraft, image: PickedImage | null, now = new Date()): FormData {
  if (!d.category || d.latitude === null || d.longitude === null) throw new Error('Incomplete draft');
  const form = new FormData();
  form.append('title', d.title.trim());
  if (d.content.trim()) form.append('content', d.content.trim());
  form.append('category', d.category);
  form.append('latitude', String(d.latitude));
  form.append('longitude', String(d.longitude));
  form.append('approximateLocation', d.approximate ? 'true' : 'false');
  if (d.category === 'LOST_FOUND' && d.lfDirection && d.lfItemType) {
    const { from, to } = lostFoundRange(d.lfWindow, now);
    form.append('lostFoundDirection', d.lfDirection);
    form.append('lostFoundItemType', d.lfItemType);
    form.append('occurredFrom', from.toISOString());
    form.append('occurredTo', to.toISOString());
  }
  if (image) {
    // React Native's FormData accepts { uri, name, type } file descriptors.
    form.append('file', { uri: image.uri, name: image.fileName, type: image.mimeType } as unknown as Blob);
  }
  return form;
}
