/**
 * Blocks the most damaging kinds of private data from being published in a post:
 * payment card numbers and bank account numbers (IBAN). These commonly appear in
 * lost-wallet posts and must never be shown publicly.
 */
export type SensitiveDataKind = 'PAYMENT_CARD' | 'IBAN';

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function ibanValid(raw: string): boolean {
  const iban = raw.toUpperCase();
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of code) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function findSensitiveData(
  text: string | null | undefined,
): SensitiveDataKind | null {
  if (!text) return null;

  for (const match of text.matchAll(/(?:\d[ -]?){13,19}/g)) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhnValid(digits))
      return 'PAYMENT_CARD';
  }

  for (const match of text
    .toUpperCase()
    .matchAll(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]){11,30}\b/g)) {
    // The pattern may run into a following word ("... 1332 PLEASE"), so try each length.
    const compact = match[0].replace(/ /g, '');
    for (let len = Math.min(34, compact.length); len >= 15; len--) {
      if (ibanValid(compact.slice(0, len))) return 'IBAN';
    }
  }
  return null;
}

export const SENSITIVE_DATA_MESSAGE: Record<SensitiveDataKind, string> = {
  PAYMENT_CARD:
    'Please remove the card number. Never post payment card details — describe the item instead.',
  IBAN: 'Please remove the bank account number. Never post account details publicly.',
};
