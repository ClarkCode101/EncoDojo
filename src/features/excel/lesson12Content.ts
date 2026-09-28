/**
 * Aralin 12's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts; the Total formulas),
 * so the rest of the app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { LESSON_12, TASK_LABEL_12 } from './lesson12';
import type { LessonContent } from './lessons';
import { makeQuiz12, makeTaskSet12, WIDTHS_12 } from './tasks12';

export const CONTENT_12: LessonContent = {
  topics: LESSON_12,
  makeSet: makeTaskSet12,
  makeQuiz: makeQuiz12,
  columnWidths: WIDTHS_12, // the sheet keeps its own widths (they move with inserted columns)
  labels: TASK_LABEL_12,
  tools: ['freeze'],
  compute: computeSheet,
};
