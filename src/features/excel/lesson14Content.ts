/**
 * Aralin 14's content, loaded with import() only when the lesson opens (like
 * the other late lessons). A PivotTable has no formulas, so no formula engine.
 */
import { lesson14, taskLabels14 } from './lesson14';
import type { LessonContent } from './lessons';
import { makeQuiz14, makeTaskSet14 } from './tasks14';

export const CONTENT_14: LessonContent = {
  topics: lesson14,
  makeSet: makeTaskSet14,
  makeQuiz: makeQuiz14,
  columnWidths: [], // every tab keeps its own widths (sheet.colWidths)
  labels: taskLabels14,
  tools: ['pivot'],
};
