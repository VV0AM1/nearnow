import { LostFoundDirection, LostFoundItemType } from '@prisma/client';
import { distanceKm } from '../common/geo';

/**
 * Transparent, deterministic "possible match" scoring between a lost and a found
 * report. Every point comes from a rule the user can read in `reasons`; a score is
 * a suggestion, never a claim that two reports describe the same item.
 */
export const MATCH_MAX_DISTANCE_KM = 5;
export const MATCH_MAX_GAP_DAYS = 3;
export const MATCH_MIN_SCORE = 40;

export interface MatchCandidate {
  id: string;
  direction: LostFoundDirection;
  itemType: LostFoundItemType;
  occurredFrom: Date;
  occurredTo: Date;
  latitude: number;
  longitude: number;
  title: string;
  content: string | null;
}

export interface MatchScore {
  candidateId: string;
  score: number;
  distanceKm: number;
  reasons: string[];
}

const DAY = 24 * 60 * 60 * 1000;

const STOPWORDS = new Set(
  (
    'the and for with near from this that have has was were lost found item please help call contact ' +
    'una uno unos unas los las del con por para que perdido perdida encontrado encontrada cerca ' +
    'els les amb per perdut perduda trobat trobada prop'
  ).split(' '),
);

export function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  return new Set(words);
}

function gapDays(a: MatchCandidate, b: MatchCandidate): number {
  if (a.occurredFrom <= b.occurredTo && b.occurredFrom <= a.occurredTo)
    return 0;
  const gap =
    a.occurredTo < b.occurredFrom
      ? b.occurredFrom.getTime() - a.occurredTo.getTime()
      : a.occurredFrom.getTime() - b.occurredTo.getTime();
  return gap / DAY;
}

export function scoreMatch(
  source: MatchCandidate,
  candidate: MatchCandidate,
): MatchScore | null {
  if (source.id === candidate.id || source.direction === candidate.direction)
    return null;

  const reasons: string[] = [];
  let score = 0;

  if (source.itemType === candidate.itemType) {
    score += 35;
    reasons.push('Same type of item');
  } else if (
    source.itemType === LostFoundItemType.OTHER ||
    candidate.itemType === LostFoundItemType.OTHER
  ) {
    score += 10;
    reasons.push('Item type could match');
  } else {
    return null;
  }

  const gap = gapDays(source, candidate);
  if (gap > MATCH_MAX_GAP_DAYS) return null;
  if (gap === 0) {
    score += 25;
    reasons.push('Time windows overlap');
  } else if (gap <= 1) {
    score += 15;
    reasons.push('Within a day of each other');
  } else {
    score += 5;
    reasons.push(`Within ${MATCH_MAX_GAP_DAYS} days of each other`);
  }

  const d = distanceKm(source, candidate);
  if (d > MATCH_MAX_DISTANCE_KM) return null;
  if (d <= 0.5) {
    score += 25;
    reasons.push('Less than 500 m apart');
  } else if (d <= 2) {
    score += 18;
    reasons.push('Less than 2 km apart');
  } else {
    score += 10;
    reasons.push(`Less than ${MATCH_MAX_DISTANCE_KM} km apart`);
  }

  const a = tokenize(`${source.title} ${source.content ?? ''}`);
  const b = tokenize(`${candidate.title} ${candidate.content ?? ''}`);
  const shared = [...a].filter((w) => b.has(w)).sort();
  if (shared.length) {
    const union = new Set([...a, ...b]).size;
    score += Math.round((shared.length / union) * 15);
    reasons.push(`Similar words: ${shared.slice(0, 3).join(', ')}`);
  }

  return {
    candidateId: candidate.id,
    score: Math.min(100, score),
    distanceKm: d,
    reasons,
  };
}

/** Matches above the threshold, best first; ties broken by distance then id for stable output. */
export function rankMatches(
  source: MatchCandidate,
  candidates: MatchCandidate[],
  minScore = MATCH_MIN_SCORE,
): MatchScore[] {
  return candidates
    .map((c) => scoreMatch(source, c))
    .filter((m): m is MatchScore => !!m && m.score >= minScore)
    .sort(
      (x, y) =>
        y.score - x.score ||
        x.distanceKm - y.distanceKm ||
        x.candidateId.localeCompare(y.candidateId),
    );
}
