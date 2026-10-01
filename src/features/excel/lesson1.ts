/**
 * Aralin 1, "Navigation at shortcuts": the lesson content.
 *
 * The lesson is a list of small topics. Each topic is:
 * 1. ALAMIN: 1-2 short sentences + the keys it teaches,
 * 2. SUBUKAN: one task per listed task kind, with hints and "Ipakita kung paano".
 * Then the Pagsusulit (tasks.ts `makeQuiz`). No timer (learning track).
 *
 * Two languages (Taglish / English): every lesson file is a function of the
 * language, `lessonN(lang)`, with both texts side by side: t('Taglish', 'English').
 */
import { translator, type Lang } from '../../lib/i18n';

export type LessonTopic = {
  title: string;
  /** Short sentences, plain Taglish (or English). */
  body: string[];
  /** The keys taught here, e.g. { keys: 'Ctrl + ↓', what: 'tumalon sa dulo ng data pababa' }. */
  keys: { keys: string; what: string }[];
  /** The task kinds to try, in order (ids from that lesson's tasks file). */
  tasks: string[];
};

export const lesson1 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Ang sheet at ang cell', 'The sheet and the cell'),
      body: [
        t(
          'Bawat kahon ay tinatawag na cell. Ang pangalan nito ay letra ng column at numero ng row, halimbawa B3.',
          'Each box is called a cell. Its name is the column letter and the row number, for example B3.',
        ),
        t(
          'Makikita sa Name Box (itaas, kaliwa) kung nasaang cell ka.',
          'The Name Box (top left) shows which cell you are in.',
        ),
      ],
      keys: [{ keys: '↑ ↓ ← →', what: t('lumipat ng isang cell', 'move one cell') }],
      tasks: ['goto'],
    },
    {
      title: t('Tumalon sa dulo ng data', 'Jump to the end of the data'),
      body: [
        t(
          'Sa mahabang listahan, hindi kailangang pindutin ang ↓ nang paulit-ulit.',
          'In a long list, you do not need to press ↓ again and again.',
        ),
        t(
          'Ctrl at isang arrow nang sabay: tatalon sa dulo ng data sa direksyong iyon.',
          'Ctrl and an arrow together: jumps to the end of the data in that direction.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + ↓', what: t('sa dulo pababa', 'to the end, down') },
        { keys: 'Ctrl + →', what: t('sa dulo pakanan', 'to the end, right') },
      ],
      tasks: ['lastRow', 'rowEnd'],
    },
    {
      title: t('Simula at dulo ng sheet', 'Start and end of the sheet'),
      body: [
        t(
          'Tatlong mabilis na paraan para bumalik sa simula o pumunta sa dulo.',
          'Three quick ways to go back to the start or go to the end.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + Home', what: t('bumalik sa A1', 'back to A1') },
        { keys: 'Ctrl + End', what: t('sa huling cell na may data', 'to the last cell with data') },
        { keys: 'Home', what: t('sa simula ng row (column A)', 'to the start of the row (column A)') },
      ],
      tasks: ['home', 'lastCell', 'rowStart'],
    },
    {
      title: t('Pagpili (select)', 'Selecting'),
      body: [
        t(
          'Kapag may Shift, pinipili (hina-highlight) ang lahat ng dinaanan.',
          'With Shift, every cell you pass is selected (highlighted).',
        ),
        t(
          'Kailangan ito bago kopyahin, burahin, o i-format ang maraming cell.',
          'You need this before you copy, delete, or format many cells.',
        ),
      ],
      keys: [
        { keys: 'Shift + ↓', what: t('pumili ng isa pang cell', 'select one more cell') },
        { keys: 'Ctrl + Shift + ↓', what: t('pumili hanggang dulo ng data', 'select to the end of the data') },
        { keys: 'Ctrl + A', what: t('piliin ang buong table', 'select the whole table') },
      ],
      tasks: ['selectColumn', 'selectAll'],
    },
    {
      title: t('Pag-edit ng cell', 'Editing a cell'),
      body: [
        t(
          'Kapag nag-type ka sa isang cell, papalitan ang buong laman nito.',
          'When you type in a cell, its whole content is replaced.',
        ),
        t(
          'Kung maliit lang ang aayusin, F2 muna para ma-edit ang laman nang hindi binubura lahat.',
          'For a small fix, press F2 first to edit the content without erasing all of it.',
        ),
      ],
      keys: [
        { keys: 'Enter', what: t('i-save at bumaba', 'save and go down') },
        { keys: 'F2', what: t('i-edit ang laman', 'edit the content') },
        { keys: 'Delete', what: t('burahin ang laman', 'delete the content') },
        { keys: 'Esc', what: t('kanselahin ang pag-edit', 'cancel the edit') },
      ],
      tasks: ['edit', 'fix', 'clear'],
    },
    {
      title: t('Kopya at undo', 'Copy and undo'),
      body: [
        t(
          'Kopyahin sa isang cell at i-paste sa iba. Kapag nagkamali, huwag mag-alala: may undo.',
          'Copy from one cell and paste into another. If you make a mistake, do not worry: there is undo.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + C', what: t('kopyahin', 'copy') },
        { keys: 'Ctrl + V', what: t('i-paste', 'paste') },
        { keys: 'Ctrl + Z', what: t('ibalik ang huling binago (undo)', 'take back the last change (undo)') },
      ],
      tasks: ['copy', 'undo'],
    },
  ];
};
