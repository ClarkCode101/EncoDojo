import { describe, expect, it } from 'vitest';
import { cleanNumpadInput, formatAmount, makeEntry } from './entries';
import { makeRng } from '../../lib/random';
import type { Difficulty } from '../../lib/storage';

function sample(difficulty: Difficulty, count = 200): string[] {
  const rng = makeRng(difficulty * 1000);
  return Array.from({ length: count }, () => makeEntry(rng, difficulty));
}

describe('formatAmount', () => {
  it('adds commas and 2 decimals', () => {
    expect(formatAmount(12450.75)).toBe('12,450.75');
    expect(formatAmount(1234567.5)).toBe('1,234,567.50');
    expect(formatAmount(5)).toBe('5.00');
    expect(formatAmount(999.99)).toBe('999.99');
  });
});

describe('makeEntry', () => {
  it('level 1 gives 1-3 digit integers', () => {
    for (const e of sample(1)) expect(e).toMatch(/^[1-9]\d{0,2}$/);
  });

  it('level 2 gives 4-5 digit integers', () => {
    for (const e of sample(2)) expect(e).toMatch(/^[1-9]\d{3,4}$/);
  });

  it('level 3 gives amounts below 1,000 with cents', () => {
    for (const e of sample(3)) expect(e).toMatch(/^\d{1,3}\.\d{2}$/);
  });

  it('level 4 gives amounts with commas', () => {
    for (const e of sample(4)) expect(e).toMatch(/^\d{1,3}(,\d{3})?\.\d{2}$/);
  });

  it('level 5 includes 10-digit reference numbers', () => {
    const entries = sample(5);
    expect(entries.some((e) => /^20(19|2[0-6])\d{6}$/.test(e))).toBe(true);
  });

  it('levels 1-6 only use digits, dot, and comma', () => {
    for (const d of [1, 2, 3, 4, 5, 6] as Difficulty[]) {
      for (const e of sample(d, 50)) expect(e).toMatch(/^[0-9.,]+$/);
    }
  });

  it('is the same for the same seed', () => {
    expect(makeEntry(makeRng(9), 6)).toBe(makeEntry(makeRng(9), 6));
  });
});

describe('cleanNumpadInput', () => {
  it('removes letters and symbols', () => {
    expect(cleanNumpadInput('12a,4-5.0+')).toBe('12,45.0');
  });
});
