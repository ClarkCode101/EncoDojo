/**
 * Scoring for the Copy Test: the shared field-by-field scoring
 * (lib/fieldScoring.ts) applied to the Copy Test's 5 fields.
 */
import { scoreRecords, type FieldSpec, type FilledRecord, type Values } from '../../lib/fieldScoring';
import { makeId, type CopyMode, type Session } from '../../lib/storage';
import { FIELDS, type CopyRecord } from './records';

// Re-exported so Copy Test code can keep importing them from here.
export { cleanField, fieldErrors, isFieldCorrect } from '../../lib/fieldScoring';

export type SubmittedRecord = { expected: CopyRecord; typed: CopyRecord };

/**
 * Net KPH of a saved copy result. The first Copy Test sessions (before KPH was
 * added) only have Net WPM; 1 WPM is about 300 KPH (5 characters x 60 minutes).
 */
export function copyKphOf(metrics: Record<string, number>): number {
  return typeof metrics.kph === 'number' ? metrics.kph : (metrics.netWpm ?? 0) * 300;
}

/** A record + what was typed, in the shape the shared scoring (and the entry runners) use. */
export function copyRecord(expected: CopyRecord, typed: Values): FilledRecord {
  return { fields: FIELDS, expected, typed };
}

export function scoreCopy(submitted: SubmittedRecord[], unfinished: CopyRecord | null, elapsedSec: number) {
  return scoreRecords(
    submitted.map(({ expected, typed }) => copyRecord(expected, typed)),
    unfinished ? { fields: FIELDS, typed: unfinished } : null,
    elapsedSec,
  );
}

/** Keep saved sessions small. */
const MAX_SAVED_MISTAKES = 100;

/**
 * The finished Copy Test run as a Session (used by both the form and the
 * spreadsheet layouts). `metrics.sheet` is 1 for the spreadsheet layout.
 */
export function buildCopySession(
  submitted: FilledRecord[],
  unfinished: { fields: readonly FieldSpec[]; typed: Values } | null,
  elapsedSec: number,
  seconds: number,
  mode: CopyMode,
): Session {
  const { metrics, mistakes } = scoreRecords(submitted, unfinished, elapsedSec);
  return {
    id: makeId(),
    type: 'copy',
    startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
    durationSec: elapsedSec,
    metrics: { ...metrics, seconds, sheet: mode === 'sheet' ? 1 : 0 },
    mistakes: mistakes.slice(0, MAX_SAVED_MISTAKES),
  };
}
