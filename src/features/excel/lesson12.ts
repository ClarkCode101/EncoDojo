/**
 * Aralin 12, "Rows at columns": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks12.ts / lesson12Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_12: Record<string, string> = {
  insertRow: 'Magdagdag ng row',
  deleteRow: 'Magbura ng row',
  insertCol: 'Magdagdag ng column',
  deleteCol: 'Magbura ng column',
  hideCol: 'Itago ang column',
  freeze: 'Freeze Panes',
};

export const LESSON_12: LessonTopic[] = [
  {
    title: 'Magdagdag at magbura ng row',
    body: [
      'Shift + Space: piliin ang buong row. Tapos Ctrl + + para magdagdag ng row sa itaas nito, o Ctrl + - para burahin ito.',
      'Kusang aayos ang mga formula: ang =SUM(E2:E9) ay magiging =SUM(E2:E10) kapag may idinagdag na row sa loob nito.',
    ],
    keys: [
      { keys: 'Shift + Space', what: 'piliin ang buong row' },
      { keys: 'Ctrl + +', what: 'magdagdag (Ctrl, Shift at =)' },
      { keys: 'Ctrl + -', what: 'magbura' },
    ],
    tasks: ['insertRow', 'deleteRow'],
  },
  {
    title: 'Magdagdag at magbura ng column',
    body: [
      'Ctrl + Space: piliin ang buong column. Pareho ang Ctrl + + at Ctrl + -: ang bagong column ay mapupunta sa kaliwa.',
      'Mag-ingat sa pagbura: kapag may formula na tumuturo sa nabura, lalabas ang #REF!.',
    ],
    keys: [
      { keys: 'Ctrl + Space', what: 'piliin ang buong column' },
      { keys: 'Ctrl + +', what: 'magdagdag' },
      { keys: 'Ctrl + -', what: 'magbura' },
    ],
    tasks: ['insertCol', 'deleteCol'],
  },
  {
    title: 'Itago ang column',
    body: [
      'Ctrl + 0 (zero): itago ang column. Hindi nabubura ang laman, hindi lang nakikita (halimbawa, bago mag-print).',
      'Para ibalik: piliin ang mga column sa magkabilang gilid, tapos Ctrl + Shift + 0 (o right-click, Unhide).',
    ],
    keys: [
      { keys: 'Ctrl + 0', what: 'itago ang column' },
      { keys: 'Ctrl + Shift + 0', what: 'ibalik' },
    ],
    tasks: ['hideCol'],
  },
  {
    title: 'Freeze Panes',
    body: [
      'Sa mahabang sheet, nawawala ang header kapag nag-scroll. Ang Freeze Panes ay nagpapanatili ng mga row sa itaas at column sa kaliwa.',
      'Ang Freeze Panes ay nagpi-freeze sa itaas at kaliwa ng napiling cell: sa B2, row 1 at column A. (Sa Excel: View > Freeze Panes.)',
    ],
    keys: [{ keys: 'Freeze Panes', what: 'sa toolbar' }],
    tasks: ['freeze'],
  },
];
