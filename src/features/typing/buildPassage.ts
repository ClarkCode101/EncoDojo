import { passages, type PassageLevel } from '../../data/passages';
import type { Difficulty } from '../../lib/storage';
import { shuffle, type Rng } from '../../lib/random';

/** Difficulty 1-2 -> level 1, 3-4 -> level 2, 5-6 -> level 3. */
export function levelForDifficulty(difficulty: Difficulty): PassageLevel {
  return Math.ceil(difficulty / 2) as PassageLevel;
}

/**
 * Enough characters that even a very fast typist (about 120 WPM) will not
 * reach the end before time runs out.
 */
export function charsNeeded(minutes: number): number {
  return minutes * 120 * 5;
}

/**
 * Join shuffled passages of one level (with single spaces) until the text is
 * at least `minChars` long.
 */
export function buildPassage(rng: Rng, level: PassageLevel, minChars: number): string {
  const pool = passages.filter((p) => p.level === level).map((p) => p.text);
  const parts: string[] = [];
  let length = 0;

  while (length < minChars) {
    for (const text of shuffle(rng, pool)) {
      parts.push(text);
      length += text.length + 1;
      if (length >= minChars) break;
    }
  }

  return parts.join(' ');
}
