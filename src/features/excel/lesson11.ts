/**
 * Aralin 11, "Petsa": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks11.ts / lesson11Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_11: Record<string, string> = {
  typeDate: 'I-type ang petsa (mm/dd/yyyy)',
  today: '=TODAY()',
  dueDate: 'Petsa + araw (Due Date)',
  age: 'Bilang ng araw (=TODAY()-B2)',
  textMonth: 'TEXT: pangalan ng buwan',
  fixDate: 'Ayusin ang dd/mm na text',
};

export const LESSON_11: LessonTopic[] = [
  {
    title: 'Ang petsa ay numero',
    body: [
      'Sa Excel, numero ang totoong petsa, kaya nasa KANAN ito ng cell. I-type bilang mm/dd/yyyy: 08/05/2026 ay August 5, 2026.',
      'Kapag nasa KALIWA ang petsa, text ito: hindi ito masosort nang tama at hindi makukuwenta.',
    ],
    keys: [
      { keys: 'mm/dd/yyyy', what: 'buwan/araw/taon' },
      { keys: '=TODAY()', what: 'petsa ngayon (nagbabago araw-araw)' },
      { keys: 'Ctrl + ;', what: 'petsa ngayon (hindi nagbabago)' },
    ],
    tasks: ['typeDate', 'today'],
  },
  {
    title: 'Kuwenta gamit ang petsa',
    body: [
      'Dahil numero ang petsa, puwede itong dagdagan at bawasan. =B2+30 ay 30 araw pagkatapos ng B2 (Due Date).',
      'Ang bawas ng dalawang petsa ay bilang ng araw: =TODAY()-B2 ay ilang araw na mula sa B2 (Age).',
    ],
    keys: [
      { keys: '=B2+30', what: '30 araw pagkatapos' },
      { keys: '=TODAY()-B2', what: 'ilang araw na' },
    ],
    tasks: ['dueDate', 'age'],
  },
  {
    title: 'TEXT: ibang anyo ng petsa',
    body: [
      'Ang =TEXT(B2,"mmmm") ay August. Ang "mmm d, yyyy" ay Aug 5, 2026. Ang "dddd" ay ang araw, gaya ng Wednesday.',
      'Text na ang resulta (para sa report o label), hindi na petsang makukuwenta.',
    ],
    keys: [{ keys: '=TEXT(B2,"mmmm")', what: 'pangalan ng buwan' }],
    tasks: ['textMonth'],
  },
  {
    title: 'Petsang dd/mm (text)',
    body: [
      'Sa ibang system o bansa, dd/mm/yyyy ang gamit: 25/08/2026. Sa Excel na mm/dd, text ito. Mag-ingat din sa 05/08/2026: August 5 ito sa dd/mm, pero May 8 kung mm/dd.',
      'Ayusin gamit ang =DATE(taon, buwan, araw), kasama ang RIGHT, MID at LEFT (Aralin 8).',
    ],
    keys: [
      { keys: '=DATE(...)', what: 'gumawa ng petsa' },
      { keys: '=MID(F2,4,2)', what: '2 titik mula sa ika-4' },
    ],
    tasks: ['fixDate'],
  },
];
