/**
 * Rules for turning what the user types into scores.
 *
 * Extra spaces: if the user types a space right after another space, and the
 * passage does NOT have a space there, we treat it as an "extra space". It
 * counts as one mistake but is NOT added to the typed text. That way the next
 * letter still lines up with the passage instead of every following letter
 * being marked wrong.
 */
import { compareTyping, type Mistake } from '../../lib/scoring';

/**
 * True when `next` is `prevTyped` plus one extra space that should be
 * swallowed (see the note at the top of this file).
 */
export function isExtraSpace(passage: string, prevTyped: string, next: string): boolean {
  return (
    next.length === prevTyped.length + 1 &&
    next.startsWith(prevTyped) &&
    next.endsWith(' ') &&
    prevTyped.endsWith(' ') &&
    passage[prevTyped.length] !== ' '
  );
}

/**
 * Combine the typed text and the swallowed extra spaces into one set of numbers.
 *
 * @param extraSpaces positions (index in the passage) where an extra space was typed
 */
export function typingStats(passage: string, typed: string, extraSpaces: number[]) {
  const compared = compareTyping(passage, typed);

  const extraMistakes: Mistake[] = extraSpaces.map((index) => ({ expected: '', typed: ' ', index }));
  // Sort by position; at the same position the extra space came first.
  const mistakes = [...extraMistakes, ...compared.mistakes].sort((a, b) => a.index - b.index);

  return {
    /** every key that produced a character, including extra spaces */
    typedChars: typed.length + extraSpaces.length,
    correctChars: compared.correctChars,
    /** mistakes still present at the end (wrong characters + extra spaces) */
    errors: compared.errors + extraSpaces.length,
    mistakes,
  };
}
