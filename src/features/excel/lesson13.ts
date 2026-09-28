/**
 * Aralin 13, "Maraming tab": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks13.ts / lesson13Content.ts, loaded only
 * when the lesson opens.
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_13: Record<string, string> = {
  goTab: 'Pumunta sa ibang tab',
  backTab: 'Bumalik sa naunang tab',
  renameTab: 'Palitan ang pangalan ng tab',
  refTab: 'Formula mula sa ibang tab',
  vlookupTab: 'VLOOKUP mula sa ibang tab',
  fillTab: 'Kopyahin ang formula pababa',
};

export const LESSON_13: LessonTopic[] = [
  {
    title: 'Ang mga tab',
    body: [
      'Ang isang Excel file (workbook) ay puwedeng may maraming sheet, ang mga tab sa ibaba. Halimbawa: Orders, Prices, Summary.',
      'Sa Excel: Ctrl + PgDn / Ctrl + PgUp para lumipat. Dito at sa Google Sheets: Ctrl + Shift + PgDn / PgUp (ang Ctrl + PgDn ay para sa tab ng browser). I-double-click ang tab para palitan ang pangalan.',
    ],
    keys: [
      { keys: 'Ctrl + Shift + PgDn', what: 'susunod na tab' },
      { keys: 'Ctrl + Shift + PgUp', what: 'naunang tab' },
    ],
    tasks: ['goTab', 'backTab', 'renameTab'],
  },
  {
    title: 'Formula mula sa ibang tab',
    body: [
      'Isulat ang pangalan ng tab at !, bago ang mga cell: =SUM(Orders!C2:C9) ay ang kabuuan ng C2:C9 ng tab na Orders.',
      "Kapag may space ang pangalan ng tab, nasa loob ng ' ': ='Price List'!B2. (Sa Excel, puwede ring i-click ang tab at ang cell habang nagta-type ng formula.)",
    ],
    keys: [{ keys: 'Orders!C2:C9', what: 'mga cell ng ibang tab' }],
    tasks: ['refTab'],
  },
  {
    title: 'VLOOKUP mula sa ibang tab',
    body: [
      'Karaniwang nasa sariling tab ang listahan (Prices), para malinis ang sheet ng trabaho. =VLOOKUP(B2,Prices!$A$2:$C$9,2,FALSE).',
      'Tip sa lapad ng column: i-double-click ang guhit sa pagitan ng mga letra ng column (AutoFit), para magkasya ang pinakamahabang laman.',
    ],
    keys: [
      { keys: 'Prices!$A$2:$C$9', what: 'listahan sa ibang tab' },
      { keys: 'Ctrl + D', what: 'kopyahin pababa' },
    ],
    tasks: ['vlookupTab', 'fillTab'],
  },
];
