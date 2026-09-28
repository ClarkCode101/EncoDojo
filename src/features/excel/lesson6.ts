/**
 * Aralin 6, "IF, COUNTIF at SUMIF": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks6.ts / lesson6Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_6: Record<string, string> = {
  ifFirst: 'IF (Met o Below)',
  ifFill: 'Kopyahin ang IF pababa',
  countifText: 'COUNTIF (isang branch)',
  countifMore: 'COUNTIF (">=20000")',
  sumifText: 'SUMIF (isang branch)',
  sumifCell: 'SUMIF gamit ang isang cell',
};

export const LESSON_6: LessonTopic[] = [
  {
    title: 'IF: kung oo, ito; kung hindi, iyan',
    body: [
      'Ang IF ay nagtatanong: =IF(tanong, kung oo, kung hindi). Halimbawa: =IF(C2>=20000,"Met","Below").',
      'Ang text ay nasa loob ng " ". Mga tanong: >= (o higit pa), <= (o mas mababa), > , < , = (pareho), <> (hindi pareho).',
    ],
    keys: [
      { keys: '=IF(...)', what: 'kung oo, ito; kung hindi, iyan' },
      { keys: 'Ctrl + D', what: 'kopyahin pababa (gaya ng Aralin 5)' },
    ],
    tasks: ['ifFirst', 'ifFill'],
  },
  {
    title: 'COUNTIF: bilangin kung ilan',
    body: [
      'Ang =COUNTIF(saan titingin, ano ang hahanapin) ay bumibilang ng mga cell na pasok.',
      'Text: =COUNTIF(B2:B9,"Cebu City"). Numero na may tanong: nasa loob din ng " ", gaya ng ">=20000".',
    ],
    keys: [{ keys: '=COUNTIF(...)', what: 'ilan ang pasok' }],
    tasks: ['countifText', 'countifMore'],
  },
  {
    title: 'SUMIF: kabuuan ng mga pasok',
    body: [
      'Ang =SUMIF(saan titingin, ano ang hahanapin, ano ang idadagdag). Halimbawa: =SUMIF(B2:B9,"Cebu City",C2:C9).',
      'Puwedeng cell ang hahanapin, gaya ng F5 (walang " "). Palitan lang ang F5, magbabago ang sagot.',
    ],
    keys: [{ keys: '=SUMIF(...)', what: 'kabuuan ng mga pasok' }],
    tasks: ['sumifText', 'sumifCell'],
  },
];
