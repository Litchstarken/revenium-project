import { describe, test, expect } from 'vitest';
import { formatCurrency, formatNumber, isAnomaly } from '@/lib/utils';

describe('utils', () => {
  test('formatCurrency formats numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  test('formatNumber formats large numbers with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  test('isAnomaly detects values above threshold', () => {
    const avg = 100;
    expect(isAnomaly(250, avg)).toBe(true); // 2.5x
    expect(isAnomaly(199, avg)).toBe(false);
  });
});
