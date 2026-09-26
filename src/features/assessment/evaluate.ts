/**
 * Turns the parts of an Assessment (typing + numpad + copy + encoding) into one saved
 * result, and checks it against the job-ready targets.
 *
 * Everything the report needs is computed from the saved Session, so old
 * assessments can be shown again later exactly the same way.
 */
import { display } from '../../lib/scoring';
import { makeId, type Session } from '../../lib/storage';
import { JOB_READY_COPY, JOB_READY_ENCODING, JOB_READY_NUMPAD, JOB_READY_TYPING } from '../../lib/targets';
import { copyKphOf } from '../copy/scoreCopy';
import { MIXED_DIFFICULTY } from '../numpad/entries';

/** Fixed rules, so every attempt is comparable. */
export const ASSESSMENT = {
  typingSeconds: 60,
  numpadSeconds: 60,
  /** A record takes 20-40 seconds, so the Copy Test part gets 2 minutes. */
  copySeconds: 120,
  /** A document takes 30-60 seconds; 3 minutes = about one of each document type. Always the Form layout. */
  encodingSeconds: 180,
  /** Same mix as the "Halo-halo" mode in Numpad Practice (long numbers, amounts, reference numbers). */
  numpadDifficulty: MIXED_DIFFICULTY,
} as const;

/** Keep the saved assessment small. */
const MAX_MISTAKES_PER_PART = 100;

export type Check = {
  section: 'typing' | 'numpad' | 'copy' | 'encoding';
  label: string;
  value: number;
  target: number;
  unit: string;
  pass: boolean;
};

/** Combine the typing, numpad, copy, and encoding sessions into one 'assessment' session. */
export function buildAssessmentSession(typing: Session, numpad: Session, copy: Session, encoding: Session): Session {
  const metrics: Record<string, number> = {
    typingNetWpm: typing.metrics.netWpm,
    typingGrossWpm: typing.metrics.grossWpm,
    typingAccuracy: typing.metrics.accuracy,
    typingKeystrokeAccuracy: typing.metrics.keystrokeAccuracy,
    typingErrors: typing.metrics.errors,
    typingChars: typing.metrics.typedChars,
    numpadKph: numpad.metrics.kph,
    numpadEntryAccuracy: numpad.metrics.entryAccuracy,
    numpadEntries: numpad.metrics.entries,
    numpadCorrectEntries: numpad.metrics.correctEntries,
    // No records submitted = nothing was copied correctly (not "100% of nothing").
    copyFieldAccuracy: copy.metrics.records > 0 ? copy.metrics.fieldAccuracy : 0,
    copyKph: copyKphOf(copy.metrics),
    copyNetWpm: copy.metrics.netWpm,
    copyRecords: copy.metrics.records,
    copyCorrectFields: copy.metrics.correctFields,
    copyTotalFields: copy.metrics.totalFields,
    // Same rule: no documents finished = 0%.
    encodingFieldAccuracy: encoding.metrics.documents > 0 ? encoding.metrics.fieldAccuracy : 0,
    encodingKph: encoding.metrics.kph,
    encodingDocuments: encoding.metrics.documents,
    encodingCorrectFields: encoding.metrics.correctFields,
    encodingTotalFields: encoding.metrics.totalFields,
  };
  const checks = assessmentChecks(metrics);
  metrics.targetsMet = checks.filter((c) => c.pass).length;
  metrics.targetsTotal = checks.length;
  metrics.jobReady = checks.every((c) => c.pass) ? 1 : 0;

  return {
    id: makeId(),
    type: 'assessment',
    startedAt: typing.startedAt,
    durationSec: typing.durationSec + numpad.durationSec + copy.durationSec + encoding.durationSec,
    metrics,
    mistakes: [
      ...typing.mistakes.slice(0, MAX_MISTAKES_PER_PART).map((m) => ({ ...m, section: 'typing' as const })),
      ...numpad.mistakes.slice(0, MAX_MISTAKES_PER_PART).map((m) => ({ ...m, section: 'numpad' as const })),
      ...copy.mistakes.slice(0, MAX_MISTAKES_PER_PART).map((m) => ({ ...m, section: 'copy' as const })),
      ...encoding.mistakes.slice(0, MAX_MISTAKES_PER_PART).map((m) => ({ ...m, section: 'encoding' as const })),
    ],
  };
}

/** Copy Test speed (net KPH) of an assessment; early ones only saved WPM (1 WPM ~ 300 KPH). */
export function assessmentCopyKph(m: Record<string, number>): number {
  return typeof m.copyKph === 'number' ? m.copyKph : (m.copyNetWpm ?? 0) * 300;
}

/** True when the assessment includes the Copy Test part (older ones had only typing + numpad). */
export function hasCopyPart(m: Record<string, number>): boolean {
  return typeof m.copyFieldAccuracy === 'number';
}

/** True when the assessment includes Document Encoding (older ones stopped at the Copy Test). */
export function hasEncodingPart(m: Record<string, number>): boolean {
  return typeof m.encodingFieldAccuracy === 'number';
}

/** Each job-ready target and whether it was met (using rounded values, like the screen). */
export function assessmentChecks(m: Record<string, number>): Check[] {
  const check = (section: Check['section'], label: string, value: number, target: number, unit = ''): Check => ({
    section,
    label,
    value,
    target,
    unit,
    pass: display(value) >= target,
  });
  const checks = [
    check('typing', 'Bilis (Net WPM)', m.typingNetWpm, JOB_READY_TYPING.netWpm),
    check('typing', 'Accuracy (tama)', m.typingAccuracy, JOB_READY_TYPING.accuracy, '%'),
    check('numpad', 'Bilis (KPH)', m.numpadKph, JOB_READY_NUMPAD.kph),
    check('numpad', 'Tamang numero', m.numpadEntryAccuracy, JOB_READY_NUMPAD.entryAccuracy, '%'),
  ];
  if (hasCopyPart(m)) {
    checks.push(
      check('copy', 'Tamang field', m.copyFieldAccuracy, JOB_READY_COPY.fieldAccuracy, '%'),
      check('copy', 'Bilis (KPH)', assessmentCopyKph(m), JOB_READY_COPY.kph),
    );
  }
  if (hasEncodingPart(m)) {
    checks.push(
      check('encoding', 'Tamang field', m.encodingFieldAccuracy, JOB_READY_ENCODING.fieldAccuracy, '%'),
      check('encoding', 'Bilis (KPH)', m.encodingKph, JOB_READY_ENCODING.kph),
    );
  }
  return checks;
}

/** The saved assessment taken just before `current`, or null. */
export function previousAssessment(sessions: Session[], current: Session): Session | null {
  const earlier = sessions.filter(
    (s) => s.type === 'assessment' && s.id !== current.id && s.startedAt < current.startedAt,
  );
  if (earlier.length === 0) return null;
  return earlier.reduce((a, b) => (a.startedAt >= b.startedAt ? a : b));
}
