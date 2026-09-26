import { passages, type PassageLevel } from '../../data/passages';
import { shuffle, type Rng } from '../../lib/random';
import { generateParagraph } from './generatePassage';

/** Share of paragraphs taken from the hand-written passages (the rest are generated). */
const HANDWRITTEN_SHARE = 0.25;

/** Names of the typing levels, shown in the Level picker. */
export const TYPING_LEVEL_LABELS: Record<PassageLevel, string> = {
  1: 'Plain text',
  2: 'Names & addresses',
  3: 'Numbers & codes',
};

/**
 * Enough characters that even a very fast typist (about 120 WPM) will not
 * reach the end before time runs out.
 */
export function charsNeeded(minutes: number): number {
  return minutes * 120 * 5;
}

/**
 * For the Assessment: generated paragraphs that rotate through levels
 * 1 -> 2 -> 3 (plain sentences, then names/addresses, then numbers), so every
 * attempt tests the same mix of skills.
 */
export function buildMixedPassage(rng: Rng, minChars: number): string {
  const levels: PassageLevel[] = [1, 2, 3];
  const parts: string[] = [];
  let length = 0;
  for (let i = 0; length < minChars; i++) {
    const text = generateParagraph(rng, levels[i % levels.length]);
    parts.push(text);
    length += text.length + 1;
  }
  return parts.join(' ');
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
