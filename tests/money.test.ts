import { describe, expect, it } from 'vitest';

import {
  formatMinorUnits,
  formatMoney,
  parseDecimalToMinorUnits,
} from '@/lib/money';
import { defaultSplits } from '@/lib/splits';

describe('minor unit formatting', () => {
  it('renders BRL cents without float arithmetic', () => {
    expect(formatMinorUnits(1500, 'BRL')).toBe('15.00');
    expect(formatMinorUnits(9999, 'BRL')).toBe('99.99');
    expect(formatMinorUnits(5, 'BRL')).toBe('0.05');
  });

  it('appends the currency code', () => {
    expect(formatMoney(12500, 'BRL')).toBe('125.00 BRL');
  });
});

describe('decimal parsing', () => {
  it('parses well-formed decimals to integer minor units', () => {
    expect(parseDecimalToMinorUnits('15.00', 'BRL')).toBe(1500);
    expect(parseDecimalToMinorUnits('99.99', 'BRL')).toBe(9999);
    expect(parseDecimalToMinorUnits('0.07', 'BRL')).toBe(7);
    expect(parseDecimalToMinorUnits('1,50', 'BRL')).toBe(150);
  });

  it('rejects input it cannot represent exactly', () => {
    expect(parseDecimalToMinorUnits('', 'BRL')).toBeNull();
    expect(parseDecimalToMinorUnits('15.001', 'BRL')).toBeNull();
    expect(parseDecimalToMinorUnits('abc', 'BRL')).toBeNull();
  });
});

describe('default splits', () => {
  it('always allocates the full amount, remainder to the seller', () => {
    for (const amount of [1500, 9999, 3, 12_345]) {
      const splits = defaultSplits(amount);
      const sum = splits.reduce((acc, line) => acc + line.amount, 0);

      expect(sum).toBe(amount);
      expect(splits.every((line) => Number.isInteger(line.amount))).toBe(true);
    }
  });
});
