import { describe, expect, it } from 'vitest';
import { buildPassage, charsNeeded, levelForDifficulty } from './buildPassage';
import { makeRng } from '../../lib/random';
import { passages } from '../../data/passages';

describe('levelForDifficulty', () => {
  it('maps 6 difficulties onto 3 passage levels', () => {
    expect([1, 2, 3, 4, 5, 6].map((d) => levelForDifficulty(d as 1))).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe('buildPassage', () => {
  it('is long enough for the chosen time', () => {
    const text = buildPassage(makeRng(1), 1, charsNeeded(5));
    expect(text.length).toBeGreaterThanOrEqual(charsNeeded(5));
  });

  it('is the same for the same seed', () => {
    expect(buildPassage(makeRng(42), 2, 1000)).toBe(buildPassage(makeRng(42), 2, 1000));
  });

  it('has no double spaces or line breaks', () => {
    const text = buildPassage(makeRng(7), 3, 3000);
    expect(text).not.toMatch(/ {2}|\n/);
  });

  it('only uses characters found on a normal keyboard', () => {
    for (const p of passages) {
      expect(p.text).toMatch(/^[\x20-\x7E]+$/);
    }
  });
});
