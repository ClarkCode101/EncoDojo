/**
 * The Excel learning track ("Matuto", owner's decision 2026-09-27): lessons
 * one at a time. Learning tracks are NOT part of the Assessment or the belt;
 * they teach Microsoft Office skills (Excel now, Word and others later).
 *
 * A lesson is "pasado" when any saved round of it reached the targets. It can
 * always be done again (no lesson is ever locked or "finished for good").
 */
import type { Rng } from '../../lib/random';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { JOB_READY_EXCEL } from '../../lib/targets';
import { LESSON_1, type LessonTopic } from './lesson1';
import { LESSON_2 } from './lesson2';
import { LESSON_3 } from './lesson3';
import type { Sheet } from './sheet';
import { COLUMN_WIDTHS, COLUMN_WIDTHS_2, COLUMN_WIDTHS_3 } from './sheetLayout';
import { TASK_LABEL, makeQuiz, makeTaskSet, type ExcelTask } from './tasks';
import { TASK_LABEL_2, makeQuiz2, makeTaskSet2 } from './tasks2';
import { TASK_LABEL_3, makeQuiz3, makeTaskSet3 } from './tasks3';

/** What a ready lesson needs: its topics, its sheet + tasks, its quiz, and how to show it. */
export type LessonContent = {
  topics: LessonTopic[];
  /** A sheet with one task of every kind the topics use. */
  makeSet: (rng: Rng) => { sheet: Sheet; tasks: Record<string, ExcelTask> };
  /** The Pagsusulit: a new sheet and its tasks. */
  makeQuiz: (rng: Rng) => { sheet: Sheet; tasks: ExcelTask[] };
  columnWidths: string[];
  /** Short names of the task kinds (results table). */
  labels: Record<string, string>;
};

export type Lesson = { level: number; title: string; content: LessonContent | null };

/** The lessons, in the suggested order (never locked). `content: null` = parating pa. */
export const LESSONS: Lesson[] = [
  {
    level: 1,
    title: 'Navigation at shortcuts',
    content: { topics: LESSON_1, makeSet: makeTaskSet, makeQuiz, columnWidths: COLUMN_WIDTHS, labels: TASK_LABEL },
  },
  {
    level: 2,
    title: 'Pag-encode ng data',
    content: {
      topics: LESSON_2,
      makeSet: makeTaskSet2,
      makeQuiz: makeQuiz2,
      columnWidths: COLUMN_WIDTHS_2,
      labels: TASK_LABEL_2,
    },
  },
  {
    level: 3,
    title: 'Formatting',
    content: {
      topics: LESSON_3,
      makeSet: makeTaskSet3,
      makeQuiz: makeQuiz3,
      columnWidths: COLUMN_WIDTHS_3,
      labels: TASK_LABEL_3,
    },
  },
  { level: 4, title: 'Sort, filter, find & replace', content: null },
  { level: 5, title: 'Formulas (SUM, IF, VLOOKUP)', content: null },
];

export const readyLessons = () => LESSONS.filter((l) => l.content !== null);
export const lessonByLevel = (level: number): Lesson => LESSONS.find((l) => l.level === level) ?? LESSONS[0];

/**
 * True when a saved Pagsusulit was passed (`metrics.passed`). The first,
 * timed version saved no `passed`; those count when both old targets were met.
 */
export function isPassingRound(s: Session): boolean {
  if (s.type !== 'excel') return false;
  if (typeof s.metrics.passed === 'number') return s.metrics.passed === 1;
  return (
    display(s.metrics.taskAccuracy) >= JOB_READY_EXCEL.taskAccuracy &&
    display(s.metrics.shortcutRate) >= JOB_READY_EXCEL.shortcutRate
  );
}

/** The levels of the lessons passed at least once. Older rounds without `level` are lesson 1. */
export function passedLessons(sessions: Session[]): Set<number> {
  return new Set(sessions.filter(isPassingRound).map((s) => s.metrics.level ?? 1));
}
