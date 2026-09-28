/**
 * Aralin 10, "Pag-check ng trabaho": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks10.ts / lesson10Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_10: Record<string, string> = {
  cfDuplicates: 'Kulay sa doble (Duplicate Values)',
  cfBlanks: 'Kulay sa blangko (Blanks)',
  countBlank: 'COUNTBLANK',
  countifs: 'COUNTIFS',
  sumifs: 'SUMIFS',
  dropdown: 'Gumawa ng dropdown',
  useDropdown: 'Gamitin ang dropdown',
};

export const LESSON_10: LessonTopic[] = [
  {
    title: 'Conditional Formatting: kulay sa mali',
    body: [
      'Bago ipasa ang trabaho, hanapin ang mali. Piliin ang mga cell, Conditional Formatting: kukulayan ng pula ang mga doble (Duplicate Values) o ang walang laman (Blanks).',
      'Ang doble ay madalas na na-encode nang dalawang beses. Ang blangko ay kulang na data.',
    ],
    keys: [
      { keys: 'Ctrl + Shift + ↓', what: 'piliin hanggang dulo' },
      { keys: 'Conditional Formatting', what: 'sa toolbar' },
    ],
    tasks: ['cfDuplicates', 'cfBlanks'],
  },
  {
    title: 'COUNTBLANK: ilan ang kulang',
    body: [
      'Ang =COUNTBLANK(A2:E9) ay bumibilang ng walang laman. 0 ang gusto mong makita bago ipasa.',
      'Kabaligtaran nito ang =COUNTA(...): ilan ang MAY laman.',
    ],
    keys: [
      { keys: '=COUNTBLANK(...)', what: 'ilan ang walang laman' },
      { keys: '=COUNTA(...)', what: 'ilan ang may laman' },
    ],
    tasks: ['countBlank'],
  },
  {
    title: 'COUNTIFS at SUMIFS: dalawang kondisyon',
    body: [
      'Gaya ng COUNTIF at SUMIF, pero higit sa isang kondisyon: =COUNTIFS(C2:C9,"Lipa",E2:E9,"Unpaid").',
      'Sa SUMIFS, una ang idadagdag: =SUMIFS(D2:D9,C2:C9,"Lipa",E2:E9,"Paid").',
    ],
    keys: [
      { keys: '=COUNTIFS(...)', what: 'bilang, 2+ kondisyon' },
      { keys: '=SUMIFS(...)', what: 'kabuuan, 2+ kondisyon' },
    ],
    tasks: ['countifs', 'sumifs'],
  },
  {
    title: 'Dropdown: Data Validation',
    body: [
      'Sa dropdown, pipili na lang, kaya walang maling spelling. Piliin ang mga cell, Data Validation, List, Source: Paid,Unpaid.',
      'Alt + ↓ (o ang ▼) para buksan ang listahan. Ang value na wala sa listahan ay hindi tatanggapin.',
    ],
    keys: [
      { keys: 'Data Validation', what: 'gumawa ng dropdown' },
      { keys: 'Alt + ↓', what: 'buksan ang listahan' },
    ],
    tasks: ['dropdown', 'useDropdown'],
  },
];
