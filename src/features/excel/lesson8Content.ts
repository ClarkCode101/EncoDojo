/**
 * Aralin 8's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { lesson8, taskLabels8 } from './lesson8';
import type { LessonContent } from './lessons';
import { COLUMN_WIDTHS_8 } from './sheetLayout';
import { makeQuiz8, makeTaskSet8 } from './tasks8';

export const CONTENT_8: LessonContent = {
  topics: lesson8,
  makeSet: makeTaskSet8,
  makeQuiz: makeQuiz8,
  columnWidths: COLUMN_WIDTHS_8,
  labels: taskLabels8,
  compute: computeSheet,
};
