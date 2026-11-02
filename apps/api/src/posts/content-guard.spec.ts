import { findSensitiveData } from './content-guard';

describe('content guard', () => {
  it('detects payment card numbers (Luhn-valid) with or without separators', () => {
    expect(
      findSensitiveData('Found a card 4111 1111 1111 1111 near the bus stop'),
    ).toBe('PAYMENT_CARD');
    expect(findSensitiveData('card no 4111-1111-1111-1111')).toBe(
      'PAYMENT_CARD',
    );
  });

  it('detects IBANs', () => {
    expect(
      findSensitiveData('Refund to ES91 2100 0418 4502 0005 1332 please'),
    ).toBe('IBAN');
  });

  it('does not flag ordinary numbers', () => {
    expect(
      findSensitiveData('Bus 24 delayed 15 minutes at stop 1234'),
    ).toBeNull();
    expect(findSensitiveData('Call 612 345 678')).toBeNull();
    expect(findSensitiveData('4111 1111 1111 1112')).toBeNull(); // fails Luhn
    expect(findSensitiveData(undefined)).toBeNull();
  });
});
