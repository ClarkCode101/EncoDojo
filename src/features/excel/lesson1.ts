/**
 * Aralin 1, "Navigation at shortcuts": the lesson content.
 *
 * The lesson is a list of small topics. Each topic is:
 * 1. ALAMIN: 1-2 short sentences + the keys it teaches,
 * 2. SUBUKAN: one task per listed task kind, with hints and "Ipakita kung paano".
 * Then the Pagsusulit (tasks.ts `makeQuiz`). No timer (learning track).
 */
import type { TaskId } from './tasks';

export type LessonTopic = {
  title: string;
  /** Short sentences, plain Taglish. */
  body: string[];
  /** The keys taught here, e.g. { keys: 'Ctrl + ↓', what: 'tumalon sa dulo ng data pababa' }. */
  keys: { keys: string; what: string }[];
  /** The tasks to try, in order. */
  tasks: TaskId[];
};

export const LESSON_1: LessonTopic[] = [
  {
    title: 'Ang sheet at ang cell',
    body: [
      'Bawat kahon ay tinatawag na cell. Ang pangalan nito ay letra ng column at numero ng row, halimbawa B3.',
      'Makikita sa Name Box (itaas, kaliwa) kung nasaang cell ka.',
    ],
    keys: [{ keys: '↑ ↓ ← →', what: 'lumipat ng isang cell' }],
    tasks: ['goto'],
  },
  {
    title: 'Tumalon sa dulo ng data',
    body: [
      'Sa mahabang listahan, hindi kailangang pindutin ang ↓ nang paulit-ulit.',
      'Ctrl at isang arrow nang sabay: tatalon sa dulo ng data sa direksyong iyon.',
    ],
    keys: [
      { keys: 'Ctrl + ↓', what: 'sa dulo pababa' },
      { keys: 'Ctrl + →', what: 'sa dulo pakanan' },
    ],
    tasks: ['lastRow', 'rowEnd'],
  },
  {
    title: 'Simula at dulo ng sheet',
    body: ['Tatlong mabilis na paraan para bumalik sa simula o pumunta sa dulo.'],
    keys: [
      { keys: 'Ctrl + Home', what: 'bumalik sa A1' },
      { keys: 'Ctrl + End', what: 'sa huling cell na may data' },
      { keys: 'Home', what: 'sa simula ng row (column A)' },
    ],
    tasks: ['home', 'lastCell', 'rowStart'],
  },
  {
    title: 'Pagpili (select)',
    body: [
      'Kapag may Shift, pinipili (hina-highlight) ang lahat ng dinaanan.',
      'Kailangan ito bago kopyahin, burahin, o i-format ang maraming cell.',
    ],
    keys: [
      { keys: 'Shift + ↓', what: 'pumili ng isa pang cell' },
      { keys: 'Ctrl + Shift + ↓', what: 'pumili hanggang dulo ng data' },
      { keys: 'Ctrl + A', what: 'piliin ang buong table' },
    ],
    tasks: ['selectColumn', 'selectAll'],
  },
  {
    title: 'Pag-edit ng cell',
    body: [
      'Kapag nag-type ka sa isang cell, papalitan ang buong laman nito.',
      'Kung maliit lang ang aayusin, F2 muna para ma-edit ang laman nang hindi binubura lahat.',
    ],
    keys: [
      { keys: 'Enter', what: 'i-save at bumaba' },
      { keys: 'F2', what: 'i-edit ang laman' },
      { keys: 'Delete', what: 'burahin ang laman' },
      { keys: 'Esc', what: 'kanselahin ang pag-edit' },
    ],
    tasks: ['edit', 'fix', 'clear'],
  },
  {
    title: 'Kopya at undo',
    body: ['Kopyahin sa isang cell at i-paste sa iba. Kapag nagkamali, huwag mag-alala: may undo.'],
    keys: [
      { keys: 'Ctrl + C', what: 'kopyahin' },
      { keys: 'Ctrl + V', what: 'i-paste' },
      { keys: 'Ctrl + Z', what: 'ibalik ang huling binago (undo)' },
    ],
    tasks: ['copy', 'undo'],
  },
];
