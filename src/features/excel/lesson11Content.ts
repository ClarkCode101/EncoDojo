/**
 * Aralin 11's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { lesson11, taskLabels11 } from './lesson11';
import type { LessonContent } from './lessons';
import { COLUMN_WIDTHS_11 } from './sheetLayout';
import { makeQuiz11, makeTaskSet11 } from './tasks11';

export const CONTENT_11: LessonContent = {
  topics: lesson11,
  makeSet: makeTaskSet11,
  makeQuiz: makeQuiz11,
  columnWidths: COLUMN_WIDTHS_11,
  labels: taskLabels11,
  compute: computeSheet,
};
