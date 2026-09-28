/**
 * Aralin 9's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { LESSON_9, TASK_LABEL_9 } from './lesson9';
import type { LessonContent } from './lessons';
import { COLUMN_WIDTHS_9 } from './sheetLayout';
import { makeQuiz9, makeTaskSet9 } from './tasks9';

export const CONTENT_9: LessonContent = {
  topics: LESSON_9,
  makeSet: makeTaskSet9,
  makeQuiz: makeQuiz9,
  columnWidths: COLUMN_WIDTHS_9,
  labels: TASK_LABEL_9,
  tools: true, // the Data toolbar has Text to Columns
  compute: computeSheet,
};
