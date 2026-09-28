/**
 * Aralin 5's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { LESSON_5, TASK_LABEL_5 } from './lesson5';
import type { LessonContent } from './lessons';
import { COLUMN_WIDTHS_5 } from './sheetLayout';
import { makeQuiz5, makeTaskSet5 } from './tasks5';

export const CONTENT_5: LessonContent = {
  topics: LESSON_5,
  makeSet: makeTaskSet5,
  makeQuiz: makeQuiz5,
  columnWidths: COLUMN_WIDTHS_5,
  labels: TASK_LABEL_5,
  compute: computeSheet,
};
