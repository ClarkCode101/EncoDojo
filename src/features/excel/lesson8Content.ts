/**
 * Aralin 8's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { LESSON_8, TASK_LABEL_8 } from './lesson8';
import type { LessonContent } from './lessons';
import { COLUMN_WIDTHS_8 } from './sheetLayout';
import { makeQuiz8, makeTaskSet8 } from './tasks8';

export const CONTENT_8: LessonContent = {
  topics: LESSON_8,
  makeSet: makeTaskSet8,
  makeQuiz: makeQuiz8,
  columnWidths: COLUMN_WIDTHS_8,
  labels: TASK_LABEL_8,
  compute: computeSheet,
};
