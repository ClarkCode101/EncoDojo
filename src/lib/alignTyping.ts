/**
 * Lines up what the user typed with the passage (like a "diff"), so that ONE
 * slip costs ONE mistake instead of making every following letter wrong.
 *
 * Kinds of mistakes it understands:
 *   wrong key      "wiht"  for "with"   -> 2 wrong
 *   extra key      "withh" for "with"   -> 1 extra
 *   skipped letter "wth"   for "with"   -> 1 skipped
 *   space in word  "wi th" for "with"   -> 1 extra (the space)
 *   double space   "a  b"  for "a b"    -> 1 extra (the space)
 *
 * How it works: "edit distance" (Levenshtein). We find the cheapest way to
 * line up the typed text with the start of the passage, where:
 *   same character = 0, wrong key = 1, extra key = 1, skipped letter = 1.
 * The total cost is the number of mistakes.
 *
 * To stay fast, we assume the typed text never drifts more than BAND
 * characters ahead of or behind the passage (only a narrow strip of the
 * table is filled in).
 */
import type { Mistake } from './scoring';

export type CharStatus = 'correct' | 'wrong' | 'skipped';

export type Alignment = {
  /** Status of each passage character before `cursor`. */
  statuses: CharStatus[];
  /** extrasBefore[i] = how many extra keys were typed just before passage[i]. */
  extrasBefore: number[];
  /** Position in the passage of the next character to type. */
  cursor: number;
  correctChars: number;
  /** wrong + extra + skipped */
  errors: number;
  /** In passage order. Extra key: expected ''. Skipped letter: typed ''. */
  mistakes: Mistake[];
};

/** Short description of a mistake: "Wrong key", "Extra key", or "Skipped". */
export function mistakeKind(mistake: Mistake): 'Wrong key' | 'Extra key' | 'Skipped' {
  if (mistake.expected === '') return 'Extra key';
  if (mistake.typed === '') return 'Skipped';
  return 'Wrong key';
}

/** How far (in characters) the typing may drift from the passage. */
export const BAND = 20;

const FAR = 1_000_000; // "impossible" cost for cells outside the strip

export function alignTyping(passage: string, typed: string): Alignment {
  const n = typed.length;
  const m = Math.min(passage.length, n + BAND);
  const width = 2 * BAND + 1;

  // cost[i][k] = cheapest way to line up typed[0..i) with passage[0..j),
  // where j = i + k - BAND (only a strip around the diagonal is stored).
  const cost: Int32Array[] = [];
  const at = (i: number, j: number): number => {
    const k = j - i + BAND;
    if (j < 0 || j > m || k < 0 || k >= width) return FAR;
    return cost[i][k];
  };

  for (let i = 0; i <= n; i++) {
    const row = new Int32Array(width).fill(FAR);
    cost.push(row);
    for (let k = 0; k < width; k++) {
      const j = i + k - BAND;
      if (j < 0 || j > m) continue;
      if (i === 0) {
        row[k] = j; // nothing typed yet: j letters skipped
        continue;
      }
      let best = FAR;
      if (j > 0) best = at(i - 1, j - 1) + (typed[i - 1] === passage[j - 1] ? 0 : 1); // same / wrong key
      best = Math.min(best, at(i - 1, j) + 1); // extra key
      if (j > 0) best = Math.min(best, at(i, j - 1) + 1); // skipped letter
      row[k] = best;
    }
  }

  // Where in the passage did the typing end? Pick the cheapest end point.
  // On a tie prefer the later one (treat it as a wrong key, not a skip).
  let end = 0;
  for (let j = Math.max(0, n - BAND); j <= Math.min(m, n + BAND); j++) {
    if (at(n, j) <= at(n, end)) end = j;
  }

  // Walk back from the end to see which choice was made at each step.
  const statuses: CharStatus[] = new Array(end);
  const extrasBefore: number[] = new Array(end + 1).fill(0);
  const mistakes: Mistake[] = [];
  let i = n;
  let j = end;
  while (i > 0 || j > 0) {
    const here = at(i, j);
    if (i > 0 && j > 0) {
      const same = typed[i - 1] === passage[j - 1];
      if (at(i - 1, j - 1) + (same ? 0 : 1) === here) {
        statuses[j - 1] = same ? 'correct' : 'wrong';
        if (!same) mistakes.push({ expected: passage[j - 1], typed: typed[i - 1], index: j - 1 });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && at(i - 1, j) + 1 === here) {
      extrasBefore[j]++;
      mistakes.push({ expected: '', typed: typed[i - 1], index: j });
      i--;
      continue;
    }
    statuses[j - 1] = 'skipped';
    mistakes.push({ expected: passage[j - 1], typed: '', index: j - 1 });
    j--;
  }
  mistakes.reverse();

  const correctChars = statuses.filter((s) => s === 'correct').length;
  return { statuses, extrasBefore, cursor: end, correctChars, errors: at(n, end), mistakes };
}
