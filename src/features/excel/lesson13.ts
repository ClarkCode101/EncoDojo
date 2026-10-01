/**
 * Aralin 13, "Maraming tab": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks13.ts / lesson13Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels13 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    goTab: t('Pumunta sa ibang tab', 'Go to another tab'),
    backTab: t('Bumalik sa naunang tab', 'Go back to the previous tab'),
    renameTab: t('Palitan ang pangalan ng tab', 'Rename a tab'),
    refTab: t('Formula mula sa ibang tab', 'A formula from another tab'),
    vlookupTab: t('VLOOKUP mula sa ibang tab', 'VLOOKUP from another tab'),
    fillTab: t('Kopyahin ang formula pababa', 'Copy the formula down'),
  };
};

export const lesson13 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Ang mga tab', 'The tabs'),
      body: [
        t(
          'Ang isang Excel file (workbook) ay puwedeng may maraming sheet, ang mga tab sa ibaba. Halimbawa: Orders, Prices, Summary.',
          'One Excel file (a workbook) can have many sheets, the tabs at the bottom. For example: Orders, Prices, Summary.',
        ),
        t(
          'Sa Excel: Ctrl + PgDn / Ctrl + PgUp para lumipat. Dito at sa Google Sheets: Ctrl + Shift + PgDn / PgUp (ang Ctrl + PgDn ay para sa tab ng browser). I-double-click ang tab para palitan ang pangalan.',
          "In Excel: Ctrl + PgDn / Ctrl + PgUp to switch. Here and in Google Sheets: Ctrl + Shift + PgDn / PgUp (Ctrl + PgDn belongs to the browser's tabs). Double-click a tab to rename it.",
        ),
      ],
      keys: [
        { keys: 'Ctrl + Shift + PgDn', what: t('susunod na tab', 'next tab') },
        { keys: 'Ctrl + Shift + PgUp', what: t('naunang tab', 'previous tab') },
      ],
      tasks: ['goTab', 'backTab', 'renameTab'],
    },
    {
      title: t('Formula mula sa ibang tab', 'A formula from another tab'),
      body: [
        t(
          'Isulat ang pangalan ng tab at !, bago ang mga cell: =SUM(Orders!C2:C9) ay ang kabuuan ng C2:C9 ng tab na Orders.',
          'Write the tab name and ! before the cells: =SUM(Orders!C2:C9) is the total of C2:C9 on the Orders tab.',
        ),
        t(
          "Kapag may space ang pangalan ng tab, nasa loob ng ' ': ='Price List'!B2. (Sa Excel, puwede ring i-click ang tab at ang cell habang nagta-type ng formula.)",
          "When the tab name has a space, it goes inside ' ': ='Price List'!B2. (In Excel, you can also click the tab and the cell while typing the formula.)",
        ),
      ],
      keys: [{ keys: 'Orders!C2:C9', what: t('mga cell ng ibang tab', 'cells of another tab') }],
      tasks: ['refTab'],
    },
    {
      title: t('VLOOKUP mula sa ibang tab', 'VLOOKUP from another tab'),
      body: [
        t(
          'Karaniwang nasa sariling tab ang listahan (Prices), para malinis ang sheet ng trabaho. =VLOOKUP(B2,Prices!$A$2:$C$9,2,FALSE).',
          'The list usually has its own tab (Prices), so the work sheet stays clean. =VLOOKUP(B2,Prices!$A$2:$C$9,2,FALSE).',
        ),
        t(
          'Tip sa lapad ng column: i-double-click ang guhit sa pagitan ng mga letra ng column (AutoFit), para magkasya ang pinakamahabang laman.',
          'Column width tip: double-click the line between the column letters (AutoFit), so the longest content fits.',
        ),
      ],
      keys: [
        { keys: 'Prices!$A$2:$C$9', what: t('listahan sa ibang tab', 'a list on another tab') },
        { keys: 'Ctrl + D', what: t('kopyahin pababa', 'copy down') },
      ],
      tasks: ['vlookupTab', 'fillTab'],
    },
  ];
};
