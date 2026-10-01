/**
 * Aralin 10's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { lesson10, taskLabels10 } from './lesson10';
import type { LessonContent } from './lessons';
import { COLUMN_WIDTHS_10 } from './sheetLayout';
import { makeQuiz10, makeTaskSet10 } from './tasks10';

export const CONTENT_10: LessonContent = {
  topics: lesson10,
  makeSet: makeTaskSet10,
  makeQuiz: makeQuiz10,
  columnWidths: COLUMN_WIDTHS_10,
  labels: taskLabels10,
  tools: ['cond', 'validation'],
  compute: computeSheet,
};
