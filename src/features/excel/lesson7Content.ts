/**
 * Aralin 7's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { LESSON_7, TASK_LABEL_7 } from './lesson7';
import type { LessonContent } from './lessons';
import { COLUMN_WIDTHS_7 } from './sheetLayout';
import { makeQuiz7, makeTaskSet7 } from './tasks7';

export const CONTENT_7: LessonContent = {
  topics: LESSON_7,
  makeSet: makeTaskSet7,
  makeQuiz: makeQuiz7,
  columnWidths: COLUMN_WIDTHS_7,
  labels: TASK_LABEL_7,
  compute: computeSheet,
};
