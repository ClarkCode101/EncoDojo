/**
 * Scoring for the Copy Test.
 *
 * - A field is CORRECT only when it matches the record exactly (same letters,
 *   capitals, punctuation, and spaces). Spaces at the very start or end are
 *   ignored because they can't be seen. This is how encoding QC works: one
 *   wrong character makes the whole field wrong.
 * - Field accuracy = correct fields / submitted fields.
 * - Speed is shown two ways:
 *   - Net KPH (like alphanumeric hiring tests): characters typed minus
 *     character mistakes, per hour. This is the speed target.
 *   - Net WPM, the same formula as the Typing Test (extra info).
 *   Characters typed in the record that was still unfinished when time ran
 *   out count toward speed, but only SUBMITTED records count toward mistakes
 *   and accuracy.
 */
import { accuracyPct, grossWpm, kph, netWpm } from '../../lib/scoring';
import { makeId, type CopyMode, type Session, type SessionMistake } from '../../lib/storage';
import { alignTyping } from '../typing/alignTyping';
import { FIELDS, type CopyRecord } from './records';

export type SubmittedRecord = { expected: CopyRecord; typed: CopyRecord };

/**
 * Net KPH of a saved copy result. The first Copy Test sessions (before KPH was
 * added) only have Net WPM; 1 WPM is about 300 KPH (5 characters x 60 minutes).
 */
export function copyKphOf(metrics: Record<string, number>): number {
  return typeof metrics.kph === 'number' ? metrics.kph : (metrics.netWpm ?? 0) * 300;
}

/** Leading/trailing spaces are invisible, so they don't count as mistakes. */
export function cleanField(value: string): string {
  return value.trim();
}

export function isFieldCorrect(expected: string, typed: string): boolean {
  return cleanField(typed) === expected;
}

/**
 * How many single-character mistakes separate `typed` from `expected`
 * (wrong, extra, or missing characters — missing ones at the end count too).
 */
export function fieldErrors(expected: string, typed: string): number {
  const a = alignTyping(expected, cleanField(typed));
  return a.errors + (expected.length - a.cursor);
}

/** Total characters typed in a record (for speed). */
export function typedLength(record: CopyRecord): number {
  return FIELDS.reduce((sum, f) => sum + cleanField(record[f.key]).length, 0);
}

export function scoreCopy(submitted: SubmittedRecord[], unfinished: CopyRecord | null, elapsedSec: number) {
  let correctFields = 0;
  let errors = 0;
  const mistakes: SessionMistake[] = [];

  submitted.forEach(({ expected, typed }, i) => {
    for (const { key } of FIELDS) {
      if (isFieldCorrect(expected[key], typed[key])) {
        correctFields++;
      } else {
        errors += fieldErrors(expected[key], typed[key]);
        mistakes.push({ expected: expected[key], typed: cleanField(typed[key]), index: i + 1, field: key });
      }
    }
  });

  const totalFields = submitted.length * FIELDS.length;
  const typedChars =
    submitted.reduce((sum, r) => sum + typedLength(r.typed), 0) + (unfinished ? typedLength(unfinished) : 0);

  return {
    metrics: {
      kph: kph(Math.max(0, typedChars - errors), elapsedSec),
      grossWpm: grossWpm(typedChars, elapsedSec),
      netWpm: netWpm(typedChars, errors, elapsedSec),
      fieldAccuracy: accuracyPct(correctFields, totalFields),
      records: submitted.length,
      correctFields,
      totalFields,
      errors,
      typedChars,
    },
    mistakes,
  };
}

/** Keep saved sessions small. */
const MAX_SAVED_MISTAKES = 100;

/**
 * The finished Copy Test run as a Session (used by both the form and the
 * spreadsheet layouts). `metrics.sheet` is 1 for the spreadsheet layout.
 */
export function buildCopySession(
  submitted: SubmittedRecord[],
  unfinished: CopyRecord | null,
  elapsedSec: number,
  seconds: number,
  mode: CopyMode,
): Session {
  const { metrics, mistakes } = scoreCopy(submitted, unfinished, elapsedSec);
  return {
    id: makeId(),
    type: 'copy',
    startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
    durationSec: elapsedSec,
    metrics: { ...metrics, seconds, sheet: mode === 'sheet' ? 1 : 0 },
    mistakes: mistakes.slice(0, MAX_SAVED_MISTAKES),
  };
}
