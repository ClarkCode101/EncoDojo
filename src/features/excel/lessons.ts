/**
 * The Excel learning track ("Matuto", owner's decision 2026-09-27): lessons
 * one at a time. Learning tracks are NOT part of the Assessment or the belt;
 * they teach Microsoft Office skills (Excel now, Word and others later).
 *
 * A lesson is "pasado" when any saved round of it reached the targets. It can
 * always be done again (no lesson is ever locked or "finished for good").
 */
import type { Session } from '../../lib/storage';
import { display } from '../../lib/scoring';
import { JOB_READY_EXCEL } from '../../lib/targets';

export type Lesson = { level: number; title: string; ready: boolean };

export const LESSONS: Lesson[] = [
  { level: 1, title: 'Navigation at shortcuts', ready: true },
  { level: 2, title: 'Formatting', ready: false },
  { level: 3, title: 'Sort, filter, find & replace', ready: false },
  { level: 4, title: 'Formulas (SUM, IF, VLOOKUP)', ready: false },
];

/** True when a saved round reached both targets (rounded, like the screen). */
export function isPassingRound(s: Session): boolean {
  return (
    s.type === 'excel' &&
    display(s.metrics.taskAccuracy) >= JOB_READY_EXCEL.taskAccuracy &&
    display(s.metrics.shortcutRate) >= JOB_READY_EXCEL.shortcutRate
  );
}

/** The levels of the lessons passed at least once. Older rounds without `level` are lesson 1. */
export function passedLessons(sessions: Session[]): Set<number> {
  return new Set(sessions.filter(isPassingRound).map((s) => s.metrics.level ?? 1));
}
