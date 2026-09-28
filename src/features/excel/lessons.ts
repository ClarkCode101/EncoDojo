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
import { LESSON_4 } from './lesson4';
import { LESSON_5, TASK_LABEL_5 } from './lesson5';
import { LESSON_6, TASK_LABEL_6 } from './lesson6';
import { LESSON_7, TASK_LABEL_7 } from './lesson7';
import { LESSON_8, TASK_LABEL_8 } from './lesson8';
import { LESSON_9, TASK_LABEL_9 } from './lesson9';
import { LESSON_10, TASK_LABEL_10 } from './lesson10';
import type { ToolName } from './DataTools';
import type { Sheet } from './sheet';
import { COLUMN_WIDTHS, COLUMN_WIDTHS_2, COLUMN_WIDTHS_3 } from './sheetLayout';
import { TASK_LABEL, makeQuiz, makeTaskSet, type ExcelTask } from './tasks';
import { TASK_LABEL_2, makeQuiz2, makeTaskSet2 } from './tasks2';
import { TASK_LABEL_3, makeQuiz3, makeTaskSet3 } from './tasks3';
import { TASK_LABEL_4, makeQuiz4, makeTaskSet4 } from './tasks4';

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
  /** Show the tools toolbar and dialogs (Aralin 4+): true = all tools, or only the ones the lesson teaches. */
  tools?: boolean | ToolName[];
  /** Formula lessons: computes the formulas for the view and the checks. */
  compute?: ComputeSheet;
};

/** Computes the formulas of the sheet (only the formula lessons have it; see formulaEngine.ts). */
export type ComputeSheet = (cells: string[][]) => string[][];

/**
 * A lesson in the list. `topics` and `labels` are always here (the list shows
 * the topics); the content is either here already, or loaded with `load`
 * (the formula lessons, so HyperFormula is only downloaded when needed).
 * `topics: null` = parating pa.
 */
export type Lesson = {
  level: number;
  title: string;
  topics: LessonTopic[] | null;
  labels: Record<string, string>;
  content: LessonContent | null;
  load?: () => Promise<LessonContent>;
};

/** The lessons, in the suggested order (never locked). `content: null` = parating pa. */
export const LESSONS: Lesson[] = [
  {
    level: 1,
    title: 'Navigation at shortcuts',
    topics: LESSON_1,
    labels: TASK_LABEL,
    content: { topics: LESSON_1, makeSet: makeTaskSet, makeQuiz, columnWidths: COLUMN_WIDTHS, labels: TASK_LABEL },
  },
  {
    level: 2,
    title: 'Pag-encode ng data',
    topics: LESSON_2,
    labels: TASK_LABEL_2,
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
    topics: LESSON_3,
    labels: TASK_LABEL_3,
    content: {
      topics: LESSON_3,
      makeSet: makeTaskSet3,
      makeQuiz: makeQuiz3,
      columnWidths: COLUMN_WIDTHS_3,
      labels: TASK_LABEL_3,
    },
  },
  {
    level: 4,
    title: 'Sort, filter, find & replace',
    topics: LESSON_4,
    labels: TASK_LABEL_4,
    content: {
      topics: LESSON_4,
      makeSet: makeTaskSet4,
      makeQuiz: makeQuiz4,
      columnWidths: COLUMN_WIDTHS,
      labels: TASK_LABEL_4,
      tools: true,
    },
  },
  {
    level: 5,
    title: 'Unang formulas',
    topics: LESSON_5,
    labels: TASK_LABEL_5,
    content: null,
    // HyperFormula comes with this lesson only.
    load: () => import('./lesson5Content').then((m) => m.CONTENT_5),
  },
  {
    level: 6,
    title: 'IF, COUNTIF at SUMIF',
    topics: LESSON_6,
    labels: TASK_LABEL_6,
    content: null,
    load: () => import('./lesson6Content').then((m) => m.CONTENT_6),
  },
  {
    level: 7,
    title: 'VLOOKUP',
    topics: LESSON_7,
    labels: TASK_LABEL_7,
    content: null,
    load: () => import('./lesson7Content').then((m) => m.CONTENT_7),
  },
  {
    level: 8,
    title: 'Paglinis ng text (TRIM, PROPER)',
    topics: LESSON_8,
    labels: TASK_LABEL_8,
    content: null,
    load: () => import('./lesson8Content').then((m) => m.CONTENT_8),
  },
  {
    level: 9,
    title: 'Pagdugtong at paghiwalay',
    topics: LESSON_9,
    labels: TASK_LABEL_9,
    content: null,
    load: () => import('./lesson9Content').then((m) => m.CONTENT_9),
  },
  {
    level: 10,
    title: 'Pag-check ng trabaho',
    topics: LESSON_10,
    labels: TASK_LABEL_10,
    content: null,
    load: () => import('./lesson10Content').then((m) => m.CONTENT_10),
  },
];

export const readyLessons = () => LESSONS.filter((l) => l.topics !== null);
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
