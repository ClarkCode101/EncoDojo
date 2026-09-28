/**
 * Aralin 6's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { LESSON_6, TASK_LABEL_6 } from './lesson6';
import type { LessonContent } from './lessons';
import { COLUMN_WIDTHS_6 } from './sheetLayout';
import { makeQuiz6, makeTaskSet6 } from './tasks6';

export const CONTENT_6: LessonContent = {
  topics: LESSON_6,
  makeSet: makeTaskSet6,
  makeQuiz: makeQuiz6,
  columnWidths: COLUMN_WIDTHS_6,
  labels: TASK_LABEL_6,
  compute: computeSheet,
};
