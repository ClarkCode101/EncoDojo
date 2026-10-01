/**
 * Aralin 9, "Pagdugtong at paghiwalay": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks9.ts / lesson9Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels9 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    flashLast: 'Flash Fill (Last Name)',
    flashFirst: 'Flash Fill (First Name)',
    textToColumns: 'Text to Columns',
    join: t('Pagdugtong gamit ang &', 'Joining with &'),
    joinFill: t('Kopyahin ang formula pababa', 'Copy the formula down'),
    pasteValues: 'Paste Values',
  };
};

export const lesson9 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Flash Fill: gayahin ang halimbawa', 'Flash Fill: copy the example'),
      body: [
        t(
          'I-type ang isang halimbawa (Dela Cruz mula sa "Dela Cruz, Juan"). Sa kasunod na cell, Ctrl + E: gagawin ng Excel ang pareho sa lahat ng row.',
          'Type one example (Dela Cruz from "Dela Cruz, Juan"). In the next cell, Ctrl + E: Excel does the same in every row.',
        ),
        t(
          'Tingnan pa rin ang resulta: hula lang ito ng Excel. Sa Google Sheets, kusang lalabas ang mungkahi (Smart Fill); Enter para tanggapin.',
          "Still check the result: it is only Excel's guess. In Google Sheets, a suggestion shows up by itself (Smart Fill); Enter to accept.",
        ),
      ],
      keys: [{ keys: 'Ctrl + E', what: 'Flash Fill' }],
      tasks: ['flashLast', 'flashFirst'],
    },
    {
      title: t('Text to Columns: hatiin sa pangharang', 'Text to Columns: split at a separator'),
      body: [
        t(
          'Hinahati nito ang laman ng cell sa bawat comma (o space, o dash) papunta sa mga katabing column.',
          'It splits the content of a cell at each comma (or space, or dash) into the columns beside it.',
        ),
        t(
          'Piliin ang mga cell, Data > Text to Columns. Sa Destination, isulat kung saan ilalagay (kung hindi, papalitan ang orihinal). Puwedeng may space sa unahan ng First Name; TRIM ang bahala.',
          'Select the cells, Data > Text to Columns. In Destination, write where to put the parts (if not, the original is replaced). The First Name may have a space in front; TRIM takes care of it.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + Shift + ↓', what: t('piliin hanggang dulo', 'select to the end') },
        { keys: 'Text to Columns', what: t('sa Data toolbar', 'on the Data toolbar') },
      ],
      tasks: ['textToColumns'],
    },
    {
      title: t('Pagdugtong gamit ang &', 'Joining with &'),
      body: [
        t(
          'Ang & ay nagdudugtong ng text: =C2&" "&B2 ay First Name, space, Last Name.',
          '& joins text: =C2&" "&B2 is First Name, a space, Last Name.',
        ),
        t(
          'Puwede ring may ibang text: =B2&", "&C2 ay "Dela Cruz, Juan". Ang text ay laging nasa loob ng " ".',
          'Other text works too: =B2&", "&C2 is "Dela Cruz, Juan". Text always goes inside " ".',
        ),
      ],
      keys: [
        { keys: '&', what: t('pagdugtungin', 'join') },
        { keys: 'Ctrl + D', what: t('kopyahin pababa', 'copy down') },
      ],
      tasks: ['join', 'joinFill'],
    },
    {
      title: t('Paste Values: formula → value', 'Paste Values: formula → value'),
      body: [
        t(
          'Kapag binura ang B at C, masisira ang formula sa D (#REF!). Gawin munang value: kopyahin, tapos Paste Values.',
          'If B and C are deleted, the formula in D breaks (#REF!). Turn it into values first: copy, then Paste Values.',
        ),
        t(
          'Ctrl + Shift + V sa Excel 365 at Google Sheets. Sa lumang Excel: Ctrl + Alt + V, tapos V, tapos Enter.',
          'Ctrl + Shift + V in Excel 365 and Google Sheets. In older Excel: Ctrl + Alt + V, then V, then Enter.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + C', what: t('kopyahin', 'copy') },
        { keys: 'Ctrl + Shift + V', what: 'Paste Values' },
      ],
      tasks: ['pasteValues'],
    },
  ];
};
