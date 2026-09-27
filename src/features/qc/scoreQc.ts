/**
 * Scoring for QC / Spot the Difference.
 *
 * For every field of every checked record the user makes a decision:
 * "may mali" (flagged) or "tama" (not flagged). A decision is correct when it
 * matches the truth. Just flagging nothing is NOT a good score: about 1 field
 * in 5 has a mistake, and missing one counts as a wrong decision.
 *
 * Metrics (saved in the session, raw values):
 * - records: records checked (submitted)
 * - correctRecords: records where the flags matched the mistakes exactly
 * - decisions / correctDecisions / decisionAccuracy (%): the main accuracy
 * - errorsTotal, caught, missed, falseAlarms
 * - perMinute: records checked per minute (the speed)
 */
import { makeId, type Session, type SessionMistake } from '../../lib/storage';
import type { FieldKey } from '../copy/records';
import { QC_FIELDS, type QcItem } from './qcItems';

/** A checked record: the item and the fields the user flagged. */
export type CheckedItem = { item: QcItem; flagged: FieldKey[] };

/** Keep saved sessions small. */
const MAX_SAVED_MISTAKES = 100;

export function scoreQc(checked: CheckedItem[], elapsedSec: number) {
  let correctRecords = 0;
  let correctDecisions = 0;
  let errorsTotal = 0;
  let caught = 0;
  let falseAlarms = 0;
  const mistakes: SessionMistake[] = [];

  checked.forEach(({ item, flagged }, i) => {
    let recordOk = true;
    for (const { key } of QC_FIELDS) {
      const wrong = item.errors.includes(key);
      const marked = flagged.includes(key);
      if (wrong) errorsTotal += 1;
      if (wrong && marked) caught += 1;
      if (!wrong && marked) falseAlarms += 1;
      if (wrong === marked) {
        correctDecisions += 1;
      } else {
        recordOk = false;
        // expected = the original value, typed = the encoded one. They are the same
        // when the user flagged a field that was actually right (a false alarm).
        mistakes.push({ expected: item.original[key], typed: item.encoded[key], index: i + 1, field: key });
      }
    }
    if (recordOk) correctRecords += 1;
  });

  const records = checked.length;
  const decisions = records * QC_FIELDS.length;
  const minutes = elapsedSec / 60;
  return {
    metrics: {
      records,
      correctRecords,
      decisions,
      correctDecisions,
      // Nothing checked yet = 0% (not 100%): there is nothing to be proud of.
      decisionAccuracy: decisions === 0 ? 0 : (correctDecisions / decisions) * 100,
      errorsTotal,
      caught,
      missed: errorsTotal - caught,
      falseAlarms,
      perMinute: minutes > 0 ? records / minutes : 0,
    },
    mistakes,
  };
}

/** True when a saved mistake is a "false alarm" (the field was right but was flagged). */
export function isFalseAlarm(m: SessionMistake): boolean {
  return m.expected === m.typed;
}

/** The finished run as a Session (type 'qc'). */
export function buildQcSession(checked: CheckedItem[], elapsedSec: number, seconds: number): Session {
  const { metrics, mistakes } = scoreQc(checked, elapsedSec);
  return {
    id: makeId(),
    type: 'qc',
    startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
    durationSec: elapsedSec,
    metrics: { ...metrics, seconds },
    mistakes: mistakes.slice(0, MAX_SAVED_MISTAKES),
  };
}
