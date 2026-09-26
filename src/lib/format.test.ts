import { describe, expect, it } from 'vitest';
import { formatAmount, formatCentavos, formatDate } from './format';

describe('formatAmount', () => {
  it('adds commas and 2 decimals', () => {
    expect(formatAmount(12450.75)).toBe('12,450.75');
    expect(formatAmount(1234567.5)).toBe('1,234,567.50');
    expect(formatAmount(5)).toBe('5.00');
    expect(formatAmount(999.99)).toBe('999.99');
  });
});

describe('formatCentavos', () => {
  it('turns centavos into pesos', () => {
    expect(formatCentavos(1245075)).toBe('12,450.75');
    expect(formatCentavos(5)).toBe('0.05');
  });
});

describe('formatDate', () => {
  it('uses mm/dd/yyyy with leading zeros', () => {
    expect(formatDate(2026, 9, 5)).toBe('09/05/2026');
    expect(formatDate(1998, 12, 31)).toBe('12/31/1998');
  });
});
