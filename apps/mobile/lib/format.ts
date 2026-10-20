import { format, formatDistanceToNow, type Locale } from 'date-fns';

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
