/**
 * Aralin 7, "VLOOKUP": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks7.ts / lesson7Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_7: Record<string, string> = {
  vlookupItem: 'VLOOKUP (Item)',
  vlookupPrice: 'VLOOKUP na may $ (Price)',
  fillPrice: 'Kopyahin ang VLOOKUP pababa',
  iferror: 'IFERROR ("Not found")',
  xlookup: 'XLOOKUP',
  xlookupNotFound: 'XLOOKUP na may "Not found"',
};

export const LESSON_7: LessonTopic[] = [
  {
    title: 'VLOOKUP: hanapin sa listahan',
    body: [
      'Hinahanap ng VLOOKUP ang code sa unang column ng isang listahan, tapos kinukuha ang katabi nito.',
      '=VLOOKUP(ano ang hahanapin, ang listahan, pang-ilang column, FALSE). Ang FALSE ay "eksaktong kapareho lang".',
    ],
    keys: [{ keys: '=VLOOKUP(...)', what: 'hanapin sa listahan' }],
    tasks: ['vlookupItem'],
  },
  {
    title: 'Ang $: hindi gagalaw ang listahan',
    body: [
      'Kapag kinopya pababa, gagalaw din ang F2:H9 (magiging F3:H10) at may item na hindi na makikita.',
      'Lagyan ng $: ang $F$2:$H$9 ay hindi gagalaw kahit kopyahin. Ang A2 ay walang $, kaya lilipat ito sa A3, A4, ...',
    ],
    keys: [
      { keys: '$F$2:$H$9', what: 'hindi gagalaw kapag kinopya' },
      { keys: 'Ctrl + D', what: 'kopyahin pababa' },
    ],
    tasks: ['vlookupPrice', 'fillPrice'],
  },
  {
    title: 'Kapag wala: #N/A at IFERROR',
    body: [
      'Lalabas ang #N/A kapag wala sa listahan ang hinahanap. Kadalasan, mali ang pagka-type ng code.',
      'Ang =IFERROR(formula, "Not found") ay magpapakita ng "Not found" sa halip na #N/A.',
    ],
    keys: [{ keys: '=IFERROR(...)', what: 'ibang ipapakita kapag may error' }],
    tasks: ['iferror'],
  },
  {
    title: 'XLOOKUP: ang bagong paraan',
    body: [
      'Nasa Excel 365, Excel 2021 at Google Sheets: =XLOOKUP(ano ang hahanapin, saan hahanapin, ano ang kukunin). Walang bibilanging column.',
      'May pang-apat pa: ang ipapakita kapag wala, gaya ng "Not found". Sa lumang Excel, VLOOKUP pa rin.',
    ],
    keys: [{ keys: '=XLOOKUP(...)', what: 'hanapin at kunin' }],
    tasks: ['xlookup', 'xlookupNotFound'],
  },
];
