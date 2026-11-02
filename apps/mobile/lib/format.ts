import { format, formatDistanceToNow, isSameDay, subDays, type Locale } from 'date-fns';

export function timeAgo(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDistanceToNow(d, { addSuffix: true, locale });
}

export function shortDate(iso: string, locale: Locale): string {
  return format(new Date(iso), 'd MMM, HH:mm', { locale });
}

export function formatKm(km: number): string {
  return km < 1 ? (Math.round(km * 10) / 10).toString() : Math.round(km).toString();
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Groups newest-first items into day sections ("Today", "Yesterday", then dates), keeping order. */
export function groupByDay<T extends { createdAt: string }>(items: T[], labels: { today: string; yesterday: string }, locale: Locale, now = new Date()): { title: string; data: T[] }[] {
  const yesterday = subDays(now, 1);
  const sections: { title: string; data: T[] }[] = [];
  for (const item of items) {
    const d = new Date(item.createdAt);
    const title = isSameDay(d, now) ? labels.today : isSameDay(d, yesterday) ? labels.yesterday : format(d, d.getFullYear() === now.getFullYear() ? 'EEEE d MMMM' : 'd MMMM yyyy', { locale });
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(item);
    else sections.push({ title, data: [item] });
  }
  return sections;
}
