import { describe, expect, it } from 'vitest';
import { PLAIN_TEXT_LEVEL, buildPassage, charsNeeded } from './buildPassage';
import { makeRng } from '../../lib/random';
import { passages } from '../../data/passages';

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

  it('plain text (used by the Typing Test) has no amounts, dates, or codes', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const text = buildPassage(makeRng(seed), PLAIN_TEXT_LEVEL, charsNeeded(1));
      expect(text).not.toMatch(/\d/);
    }
  });

  it('plain text rarely repeats a sentence within one 1-minute passage', () => {
    let repeats = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const sentences = buildPassage(makeRng(seed), PLAIN_TEXT_LEVEL, charsNeeded(1)).split(/(?<=\.) /);
      repeats += sentences.length - new Set(sentences).size;
    }
    expect(repeats / 50).toBeLessThan(1); // on average less than one repeated sentence
  });

  it('only uses characters found on a normal keyboard', () => {
    for (const p of passages) {
      expect(p.text).toMatch(/^[\x20-\x7E]+$/);
    }
  });
});
