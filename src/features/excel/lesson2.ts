/**
 * Aralin 2, "Pag-encode ng data": the lesson content (same format as
 * lesson1.ts: Alamin + Subukan per topic, then the Pagsusulit).
 */
import type { LessonTopic } from './lesson1';

export const LESSON_2: LessonTopic[] = [
  {
    title: 'Isang buong record',
    body: [
      'Kapag nag-e-encode ng isang record, Tab ang gamit para lumipat sa kanan.',
      'Sa dulo ng record, Enter: babalik ka sa simula ng susunod na row, handa na sa susunod na record.',
    ],
    keys: [
      { keys: 'Tab', what: 'i-save at lumipat pakanan' },
      { keys: 'Shift + Tab', what: 'bumalik pakaliwa' },
      { keys: 'Enter', what: 'i-save at bumalik sa simula ng susunod na row' },
    ],
    tasks: ['newRow'],
  },
  {
    title: 'Pababa sa isang column',
    body: ['Kapag isang column lang ang pinupunan, Enter lang pagkatapos ng bawat isa. Kusang bababa ang cell.'],
    keys: [{ keys: 'Enter', what: 'i-save at bumaba' }],
    tasks: ['enterDown'],
  },
  {
    title: 'Kopyahin mula sa itaas',
    body: [
      'Kapag pareho ang laman ng cell sa itaas, huwag nang i-type ulit.',
      'Ctrl + D ("Down") ang kumokopya pababa, sa isang cell man o sa maraming napiling cell.',
    ],
    keys: [
      { keys: 'Ctrl + D', what: 'kopyahin ang nasa itaas' },
      { keys: 'Shift + ↓', what: 'pumili ng mga cell pababa (bago ang Ctrl + D)' },
    ],
    tasks: ['fillDown', 'fillRange'],
  },
  {
    title: 'Parehong laman sa maraming cell',
    body: ['Piliin muna ang mga cell, i-type ang laman, tapos Ctrl + Enter: mapupunta ito sa lahat ng napili.'],
    keys: [{ keys: 'Ctrl + Enter', what: 'ilagay sa lahat ng napiling cell' }],
    tasks: ['fillSame'],
  },
  {
    title: 'Petsa ngayon',
    body: ['Hindi na kailangang tingnan ang kalendaryo: Ctrl + ; (semicolon) ang naglalagay ng petsa ngayon.'],
    keys: [{ keys: 'Ctrl + ;', what: 'petsa ngayon' }],
    tasks: ['today'],
  },
];
