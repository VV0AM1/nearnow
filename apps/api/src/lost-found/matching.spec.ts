import { LostFoundDirection, LostFoundItemType } from '@prisma/client';
import { MatchCandidate, rankMatches, scoreMatch, tokenize } from './matching';

const day = (d: number) => new Date(Date.UTC(2026, 9, d));
const report = (over: Partial<MatchCandidate>): MatchCandidate => ({
  id: 'x',
  direction: LostFoundDirection.LOST,
  itemType: LostFoundItemType.KEYS,
  occurredFrom: day(10),
  occurredTo: day(11),
  latitude: 41.39,
  longitude: 2.17,
  title: 'Lost keys with red keyring',
  content: 'Near the market',
  ...over,
});

describe('lost & found matching', () => {
  const lost = report({ id: 'lost' });

  it('only pairs opposite directions', () => {
    expect(scoreMatch(lost, report({ id: 'other-lost' }))).toBeNull();
  });

  it('scores a close, same-type, same-time found report highly with readable reasons', () => {
    const m = scoreMatch(
      lost,
      report({
        id: 'found',
        direction: LostFoundDirection.FOUND,
        title: 'Found keys, red keyring',
      }),
    )!;
    expect(m.score).toBeGreaterThanOrEqual(85);
    expect(m.reasons).toEqual(
      expect.arrayContaining([
        'Same type of item',
        'Time windows overlap',
        'Less than 500 m apart',
      ]),
    );
    expect(m.reasons.find((r) => r.startsWith('Similar words'))).toContain(
      'keyring',
    );
  });

  it('rejects incompatible types, far distances and distant dates', () => {
    const found = { direction: LostFoundDirection.FOUND };
    expect(
      scoreMatch(
        lost,
        report({ ...found, id: 'a', itemType: LostFoundItemType.PET }),
      ),
    ).toBeNull();
    expect(
      scoreMatch(lost, report({ ...found, id: 'b', latitude: 41.5 })),
    ).toBeNull();
    expect(
      scoreMatch(
        lost,
        report({
          ...found,
          id: 'c',
          occurredFrom: day(20),
          occurredTo: day(21),
        }),
      ),
    ).toBeNull();
  });

  it('is deterministic and ordered best-first', () => {
    const cands = [
      report({
        id: 'far',
        direction: LostFoundDirection.FOUND,
        latitude: 41.41,
      }),
      report({ id: 'near', direction: LostFoundDirection.FOUND }),
      report({
        id: 'other-type',
        direction: LostFoundDirection.FOUND,
        itemType: LostFoundItemType.OTHER,
      }),
    ];
    const a = rankMatches(lost, cands).map((m) => m.candidateId);
    const b = rankMatches(lost, [...cands].reverse()).map((m) => m.candidateId);
    expect(a).toEqual(b);
    expect(a[0]).toBe('near');
  });

  it('tokenizes across accents and ignores stop words and bare numbers', () => {
    expect([
      ...tokenize('Perdí la cartera MARRÓN 1234 cerca del parc'),
    ]).toEqual(['perdi', 'cartera', 'marron', 'parc']);
  });
});
