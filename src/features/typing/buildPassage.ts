import { passages, type PassageLevel } from '../../data/passages';
import type { Difficulty } from '../../lib/storage';
import { shuffle, type Rng } from '../../lib/random';
import { generateParagraph } from './generatePassage';

/** Share of paragraphs taken from the hand-written passages (the rest are generated). */
const HANDWRITTEN_SHARE = 0.25;

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
 * Join paragraphs of one level (with single spaces) until the text is at
 * least `minChars` long. Most paragraphs are freshly generated so passages
 * can't be memorized; now and then a hand-written one is mixed in.
 */
export function buildPassage(rng: Rng, level: PassageLevel, minChars: number): string {
  const handwritten = shuffle(
    rng,
    passages.filter((p) => p.level === level).map((p) => p.text),
  );
  const parts: string[] = [];
  let length = 0;

  while (length < minChars) {
    const useHandwritten = handwritten.length > 0 && rng() < HANDWRITTEN_SHARE;
    const text = useHandwritten ? handwritten.pop()! : generateParagraph(rng, level);
    parts.push(text);
    length += text.length + 1;
  }

  return parts.join(' ');
}
