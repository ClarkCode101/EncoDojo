/**
 * Aralin 13's content, loaded with import() only when the lesson opens: it
 * brings the tasks and HyperFormula (formulaEngine.ts), so the rest of the
 * app never downloads the formula engine.
 */
import { computeSheet } from './formulaEngine';
import { lesson13, taskLabels13 } from './lesson13';
import type { LessonContent } from './lessons';
import { makeQuiz13, makeTaskSet13 } from './tasks13';

export const CONTENT_13: LessonContent = {
  topics: lesson13,
  makeSet: makeTaskSet13,
  makeQuiz: makeQuiz13,
  columnWidths: [], // every tab keeps its own widths (sheet.colWidths)
  labels: taskLabels13,
  compute: computeSheet,
};
