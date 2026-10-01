/**
 * The Excel learning track ("Matuto", owner's decision 2026-09-27): lessons
 * one at a time. Learning tracks are NOT part of the Assessment or the belt;
 * they teach Microsoft Office skills (Excel now, Word and others later).
 *
 * A lesson is "pasado" when any saved round of it reached the targets. It can
 * always be done again (no lesson is ever locked or "finished for good").
 */
import type { Lang } from '../../lib/i18n';
import type { Rng } from '../../lib/random';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { JOB_READY_EXCEL } from '../../lib/targets';
import { lesson1, type LessonTopic } from './lesson1';
import { lesson2 } from './lesson2';
import { lesson3 } from './lesson3';
import { lesson4 } from './lesson4';
import { lesson5, taskLabels5 } from './lesson5';
import { lesson6, taskLabels6 } from './lesson6';
import { lesson7, taskLabels7 } from './lesson7';
import { lesson8, taskLabels8 } from './lesson8';
import { lesson9, taskLabels9 } from './lesson9';
import { lesson10, taskLabels10 } from './lesson10';
import { lesson11, taskLabels11 } from './lesson11';
import { lesson12, taskLabels12 } from './lesson12';
import { lesson13, taskLabels13 } from './lesson13';
import { lesson14, taskLabels14 } from './lesson14';
import type { ToolName } from './DataTools';
import type { Sheet, TabCells } from './sheet';
import { COLUMN_WIDTHS, COLUMN_WIDTHS_2, COLUMN_WIDTHS_3 } from './sheetLayout';
import { makeQuiz, makeTaskSet, taskLabels, type ExcelTask } from './tasks';
import { makeQuiz2, makeTaskSet2, taskLabels2 } from './tasks2';
import { makeQuiz3, makeTaskSet3, taskLabels3 } from './tasks3';
import { makeQuiz4, makeTaskSet4, taskLabels4 } from './tasks4';

/** The topics of a lesson in a language. */
export type TopicsOf = (lang: Lang) => LessonTopic[];
/** Short names of the task kinds in a language (results table). */
export type LabelsOf = (lang: Lang) => Record<string, string>;

/** What a ready lesson needs: its topics, its sheet + tasks, its quiz, and how to show it. All texts in `lang`. */
export type LessonContent = {
  topics: TopicsOf;
  /** A sheet with one task of every kind the topics use. */
  makeSet: (rng: Rng, lang: Lang) => { sheet: Sheet; tasks: Record<string, ExcelTask> };
  /** The Pagsusulit: a new sheet and its tasks. */
  makeQuiz: (rng: Rng, lang: Lang) => { sheet: Sheet; tasks: ExcelTask[] };
  columnWidths: string[];
  /** Short names of the task kinds (results table). */
  labels: LabelsOf;
  /** Show the tools toolbar and dialogs (Aralin 4+): true = all tools, or only the ones the lesson teaches. */
  tools?: boolean | ToolName[];
  /** Formula lessons: computes the formulas for the view and the checks. */
  compute?: ComputeSheet;
};

/** Computes the formulas of the sheet (only the formula lessons have it; see formulaEngine.ts). */
export type ComputeSheet = (cells: string[][], tabs?: TabCells) => string[][];

/**
 * A lesson in the list. `topics` and `labels` are always here (the list shows
 * the topics); the content is either here already, or loaded with `load`
 * (the formula lessons, so HyperFormula is only downloaded when needed).
 * `topics: null` = parating pa.
 */
export type Lesson = {
  level: number;
  /** Taglish title; `en.title` is the English one (see `lessonTitle`). */
  title: string;
  en: { title: string };
  topics: TopicsOf | null;
  labels: LabelsOf;
  content: LessonContent | null;
  load?: () => Promise<LessonContent>;
};

/** The lesson's title in a language. */
export const lessonTitle = (lesson: Lesson, lang: Lang) => (lang === 'en' ? lesson.en.title : lesson.title);

/** The lessons, in the suggested order (never locked). `content: null` = parating pa. */
export const LESSONS: Lesson[] = [
  {
    level: 1,
    title: 'Navigation at shortcuts',
    en: { title: 'Navigation and shortcuts' },
    topics: lesson1,
    labels: taskLabels,
    content: { topics: lesson1, makeSet: makeTaskSet, makeQuiz, columnWidths: COLUMN_WIDTHS, labels: taskLabels },
  },
  {
    level: 2,
    title: 'Pag-encode ng data',
    en: { title: 'Entering data' },
    topics: lesson2,
    labels: taskLabels2,
    content: {
      topics: lesson2,
      makeSet: makeTaskSet2,
      makeQuiz: makeQuiz2,
      columnWidths: COLUMN_WIDTHS_2,
      labels: taskLabels2,
    },
  },
  {
    level: 3,
    title: 'Formatting',
    en: { title: 'Formatting' },
    topics: lesson3,
    labels: taskLabels3,
    content: {
      topics: lesson3,
      makeSet: makeTaskSet3,
      makeQuiz: makeQuiz3,
      columnWidths: COLUMN_WIDTHS_3,
      labels: taskLabels3,
    },
  },
  {
    level: 4,
    title: 'Sort, filter, find & replace',
    en: { title: 'Sort, filter, find & replace' },
    topics: lesson4,
    labels: taskLabels4,
    content: {
      topics: lesson4,
      makeSet: makeTaskSet4,
      makeQuiz: makeQuiz4,
      columnWidths: COLUMN_WIDTHS,
      labels: taskLabels4,
      tools: true,
    },
  },
  {
    level: 5,
    title: 'Unang formulas',
    en: { title: 'First formulas' },
    topics: lesson5,
    labels: taskLabels5,
    content: null,
    // HyperFormula comes with this lesson only.
    load: () => import('./lesson5Content').then((m) => m.CONTENT_5),
  },
  {
    level: 6,
    title: 'IF, COUNTIF at SUMIF',
    en: { title: 'IF, COUNTIF and SUMIF' },
    topics: lesson6,
    labels: taskLabels6,
    content: null,
    load: () => import('./lesson6Content').then((m) => m.CONTENT_6),
  },
  {
    level: 7,
    title: 'VLOOKUP',
    en: { title: 'VLOOKUP' },
    topics: lesson7,
    labels: taskLabels7,
    content: null,
    load: () => import('./lesson7Content').then((m) => m.CONTENT_7),
  },
  {
    level: 8,
    title: 'Paglinis ng text (TRIM, PROPER)',
    en: { title: 'Cleaning up text (TRIM, PROPER)' },
    topics: lesson8,
    labels: taskLabels8,
    content: null,
    load: () => import('./lesson8Content').then((m) => m.CONTENT_8),
  },
  {
    level: 9,
    title: 'Pagdugtong at paghiwalay',
    en: { title: 'Joining and splitting' },
    topics: lesson9,
    labels: taskLabels9,
    content: null,
    load: () => import('./lesson9Content').then((m) => m.CONTENT_9),
  },
  {
    level: 10,
    title: 'Pag-check ng trabaho',
    en: { title: 'Checking your work' },
    topics: lesson10,
    labels: taskLabels10,
    content: null,
    load: () => import('./lesson10Content').then((m) => m.CONTENT_10),
  },
  {
    level: 11,
    title: 'Petsa',
    en: { title: 'Dates' },
    topics: lesson11,
    labels: taskLabels11,
    content: null,
    load: () => import('./lesson11Content').then((m) => m.CONTENT_11),
  },
  {
    level: 12,
    title: 'Rows at columns',
    en: { title: 'Rows and columns' },
    topics: lesson12,
    labels: taskLabels12,
    content: null,
    load: () => import('./lesson12Content').then((m) => m.CONTENT_12),
  },
  {
    level: 13,
    title: 'Maraming tab',
    en: { title: 'Many tabs' },
    topics: lesson13,
    labels: taskLabels13,
    content: null,
    load: () => import('./lesson13Content').then((m) => m.CONTENT_13),
  },
  {
    level: 14,
    title: 'Pivot Table',
    en: { title: 'Pivot Table' },
    topics: lesson14,
    labels: taskLabels14,
    content: null,
    load: () => import('./lesson14Content').then((m) => m.CONTENT_14),
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
