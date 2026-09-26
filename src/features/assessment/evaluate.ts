/**
 * Turns the two parts of an Assessment (typing + numpad) into one saved
 * result, and checks it against the job-ready targets.
 *
 * Everything the report needs is computed from the saved Session, so old
 * assessments can be shown again later exactly the same way.
 */
import { display } from '../../lib/scoring';
import { makeId, type Session } from '../../lib/storage';
import { JOB_READY_NUMPAD, JOB_READY_TYPING } from '../../lib/targets';
import { MIXED_DIFFICULTY } from '../numpad/entries';

/** Fixed rules, so every attempt is comparable. */
export const ASSESSMENT = {
  typingSeconds: 60,
  numpadSeconds: 60,
  /** Same mix as the "Halo-halo" mode in Numpad Practice (long numbers, amounts, reference numbers). */
  numpadDifficulty: MIXED_DIFFICULTY,
} as const;

/** Keep the saved assessment small. */
const MAX_MISTAKES_PER_PART = 100;

export type Check = {
  section: 'typing' | 'numpad';
  label: string;
  value: number;
  target: number;
  unit: string;
  pass: boolean;
};

/** Combine the typing and numpad sessions into one 'assessment' session. */
export function buildAssessmentSession(typing: Session, numpad: Session): Session {
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
  };
  const checks = assessmentChecks(metrics);
  metrics.targetsMet = checks.filter((c) => c.pass).length;
  metrics.targetsTotal = checks.length;
  metrics.jobReady = checks.every((c) => c.pass) ? 1 : 0;

  return {
    id: makeId(),
    type: 'assessment',
    startedAt: typing.startedAt,
    durationSec: typing.durationSec + numpad.durationSec,
    metrics,
    mistakes: [
      ...typing.mistakes.slice(0, MAX_MISTAKES_PER_PART).map((m) => ({ ...m, section: 'typing' as const })),
      ...numpad.mistakes.slice(0, MAX_MISTAKES_PER_PART).map((m) => ({ ...m, section: 'numpad' as const })),
    ],
  };
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
  return [
    check('typing', 'Bilis (Net WPM)', m.typingNetWpm, JOB_READY_TYPING.netWpm),
    check('typing', 'Accuracy (tama)', m.typingAccuracy, JOB_READY_TYPING.accuracy, '%'),
    check('numpad', 'Bilis (KPH)', m.numpadKph, JOB_READY_NUMPAD.kph),
    check('numpad', 'Tamang numero', m.numpadEntryAccuracy, JOB_READY_NUMPAD.entryAccuracy, '%'),
  ];
}

/** The saved assessment taken just before `current`, or null. */
export function previousAssessment(sessions: Session[], current: Session): Session | null {
  const earlier = sessions.filter(
    (s) => s.type === 'assessment' && s.id !== current.id && s.startedAt < current.startedAt,
  );
  if (earlier.length === 0) return null;
  return earlier.reduce((a, b) => (a.startedAt >= b.startedAt ? a : b));
}
