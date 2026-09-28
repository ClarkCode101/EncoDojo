/**
 * Aralin 9, "Pagdugtong at paghiwalay": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks9.ts / lesson9Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_9: Record<string, string> = {
  flashLast: 'Flash Fill (Last Name)',
  flashFirst: 'Flash Fill (First Name)',
  textToColumns: 'Text to Columns',
  join: 'Pagdugtong gamit ang &',
  joinFill: 'Kopyahin ang formula pababa',
  pasteValues: 'Paste Values',
};

export const LESSON_9: LessonTopic[] = [
  {
    title: 'Flash Fill: gayahin ang halimbawa',
    body: [
      'I-type ang isang halimbawa (Dela Cruz mula sa "Dela Cruz, Juan"). Sa kasunod na cell, Ctrl + E: gagawin ng Excel ang pareho sa lahat ng row.',
      'Tingnan pa rin ang resulta: hula lang ito ng Excel. Sa Google Sheets, kusang lalabas ang mungkahi (Smart Fill); Enter para tanggapin.',
    ],
    keys: [{ keys: 'Ctrl + E', what: 'Flash Fill' }],
    tasks: ['flashLast', 'flashFirst'],
  },
  {
    title: 'Text to Columns: hatiin sa pangharang',
    body: [
      'Hinahati nito ang laman ng cell sa bawat comma (o space, o dash) papunta sa mga katabing column.',
      'Piliin ang mga cell, Data > Text to Columns. Sa Destination, isulat kung saan ilalagay (kung hindi, papalitan ang orihinal). Puwedeng may space sa unahan ng First Name; TRIM ang bahala.',
    ],
    keys: [
      { keys: 'Ctrl + Shift + ↓', what: 'piliin hanggang dulo' },
      { keys: 'Text to Columns', what: 'sa Data toolbar' },
    ],
    tasks: ['textToColumns'],
  },
  {
    title: 'Pagdugtong gamit ang &',
    body: [
      'Ang & ay nagdudugtong ng text: =C2&" "&B2 ay First Name, space, Last Name.',
      'Puwede ring may ibang text: =B2&", "&C2 ay "Dela Cruz, Juan". Ang text ay laging nasa loob ng " ".',
    ],
    keys: [
      { keys: '&', what: 'pagdugtungin' },
      { keys: 'Ctrl + D', what: 'kopyahin pababa' },
    ],
    tasks: ['join', 'joinFill'],
  },
  {
    title: 'Paste Values: formula → value',
    body: [
      'Kapag binura ang B at C, masisira ang formula sa D (#REF!). Gawin munang value: kopyahin, tapos Paste Values.',
      'Ctrl + Shift + V sa Excel 365 at Google Sheets. Sa lumang Excel: Ctrl + Alt + V, tapos V, tapos Enter.',
    ],
    keys: [
      { keys: 'Ctrl + C', what: 'kopyahin' },
      { keys: 'Ctrl + Shift + V', what: 'Paste Values' },
    ],
    tasks: ['pasteValues'],
  },
];
