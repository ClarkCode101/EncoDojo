/**
 * Aralin 5, "Unang formulas": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks5.ts / lesson5Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_5: Record<string, string> = {
  firstFormula: 'Unang formula (=B2*C2)',
  fillFormula: 'Kopyahin ang formula pababa',
  autoSum: 'Kabuuan gamit ang AutoSum',
  average: 'AVERAGE',
  max: 'MAX',
  count: 'COUNT',
};

export const LESSON_5: LessonTopic[] = [
  {
    title: 'Ang formula',
    body: [
      'Ang formula ay nagsisimula sa =. Ang Excel ang magkukuwenta para sa iyo.',
      'Gamitin ang pangalan ng cell (B2, C2), hindi ang numero mismo. Kapag nagbago ang numero, kusang magbabago ang sagot.',
      'Mga simbolo: + dagdag, - bawas, * multiply, / divide.',
    ],
    keys: [
      { keys: '=', what: 'simula ng formula' },
      { keys: 'Enter', what: 'i-save at ipakita ang sagot' },
    ],
    tasks: ['firstFormula'],
  },
  {
    title: 'Kopyahin ang formula',
    body: [
      'Hindi na kailangang i-type ulit ang formula sa bawat row. Kopyahin ito pababa.',
      'Kusang lilipat ang mga cell: ang =B2*C2, kapag kinopya sa row 3, ay magiging =B3*C3.',
    ],
    keys: [
      { keys: 'Shift + ↓', what: 'piliin ang mga cell pababa' },
      { keys: 'Ctrl + D', what: 'kopyahin ang formula pababa' },
    ],
    tasks: ['fillFormula'],
  },
  {
    title: 'Kabuuan: SUM at AutoSum',
    body: [
      'Ang =SUM(D2:D9) ay ang kabuuan ng D2 hanggang D9. Ang tutuldok (:) ay "hanggang".',
      'Mas mabilis: Alt + = (AutoSum). Kusang isusulat ang =SUM ng mga numero sa itaas. Enter lang.',
    ],
    keys: [
      { keys: '=SUM(...)', what: 'kabuuan' },
      { keys: 'Alt + =', what: 'AutoSum, tapos Enter' },
    ],
    tasks: ['autoSum'],
  },
  {
    title: 'AVERAGE, MAX at COUNT',
    body: [
      'Pare-pareho ang anyo: =PANGALAN(unang cell:huling cell), halimbawa =AVERAGE(B2:B9).',
      'AVERAGE: karaniwan. MAX: pinakamalaki (MIN: pinakamaliit). COUNT: ilan ang cell na may numero.',
    ],
    keys: [
      { keys: '=AVERAGE(...)', what: 'karaniwan' },
      { keys: '=MAX(...)', what: 'pinakamalaki' },
      { keys: '=MIN(...)', what: 'pinakamaliit' },
      { keys: '=COUNT(...)', what: 'ilan ang may numero' },
    ],
    tasks: ['average', 'max', 'count'],
  },
];
