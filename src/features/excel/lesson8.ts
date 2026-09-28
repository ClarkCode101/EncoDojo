/**
 * Aralin 8, "Paglinis ng text": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks8.ts / lesson8Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_8: Record<string, string> = {
  trim: 'TRIM (sobrang space)',
  proper: 'PROPER(TRIM(...))',
  fillName: 'Kopyahin ang formula pababa',
  upper: 'UPPER',
  left: 'LEFT',
  right: 'RIGHT',
};

export const LESSON_8: LessonTopic[] = [
  {
    title: 'TRIM: sobrang space',
    body: [
      'Madalas may sobrang space ang data na galing sa form o ibang file: "  juan   dela cruz ". Mahirap itong hanapin at i-sort.',
      'Ang =TRIM(A2) ay nagtatanggal ng space sa unahan at hulihan, at isang space na lang ang natitira sa gitna.',
    ],
    keys: [{ keys: '=TRIM(...)', what: 'tanggalin ang sobrang space' }],
    tasks: ['trim'],
  },
  {
    title: 'PROPER: tamang malaki at maliit na titik',
    body: [
      'Ang =PROPER(...) ay naglalagay ng malaking titik sa simula ng bawat salita: juan DELA cruz → Juan Dela Cruz.',
      'Puwedeng pagsamahin ang formula: =PROPER(TRIM(A2)). Uunahin ang nasa loob (TRIM), tapos ang PROPER.',
    ],
    keys: [
      { keys: '=PROPER(TRIM(...))', what: 'linisin ang space at ang titik' },
      { keys: 'Ctrl + D', what: 'kopyahin pababa' },
    ],
    tasks: ['proper', 'fillName'],
  },
  {
    title: 'UPPER at LOWER',
    body: [
      'Ang =UPPER(...) ay ginagawang malalaking titik lahat (tn-00457 → TN-00457). Ang =LOWER(...) naman, maliliit lahat.',
      'Gamit ito sa mga code at Ref No., para pare-pareho ang itsura.',
    ],
    keys: [
      { keys: '=UPPER(...)', what: 'lahat malaki' },
      { keys: '=LOWER(...)', what: 'lahat maliit' },
    ],
    tasks: ['upper'],
  },
  {
    title: 'LEFT at RIGHT: kunin ang bahagi',
    body: [
      'Ang =LEFT(cell, ilan) ay kumukuha ng mga titik mula sa kaliwa; ang =RIGHT(cell, ilan), mula sa kanan.',
      'Halimbawa, sa TN-00457: =LEFT(D2,2) ay TN, at =RIGHT(D2,5) ay 00457.',
    ],
    keys: [
      { keys: '=LEFT(..., 2)', what: 'mula sa kaliwa' },
      { keys: '=RIGHT(..., 5)', what: 'mula sa kanan' },
    ],
    tasks: ['left', 'right'],
  },
];
