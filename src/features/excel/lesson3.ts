/**
 * Aralin 3, "Formatting": the lesson content (same format as lesson1.ts).
 */
import type { LessonTopic } from './lesson1';

export const LESSON_3: LessonTopic[] = [
  {
    title: 'Numero o text?',
    body: [
      'Kapag puro numero ang tinype mo, ginagawa itong numero ng Excel at nawawala ang zero sa unahan: 00457 ay nagiging 457.',
      "Para manatili ang zero (Emp No., Account No., ID), mag-type muna ng apostrophe ('): '00457. Hindi ito lalabas sa cell.",
      'Tingnan ang sheet: nasa kanan ng cell ang numero, nasa kaliwa ang text.',
    ],
    keys: [{ keys: "' (apostrophe)", what: 'bago ang numero: gawin itong text, hindi mawawala ang zero' }],
    tasks: ['leadingZero', 'fixZeros'],
  },
  {
    title: 'Format ng halaga',
    body: [
      'Sa pera at sahod, gamitin ang format na may comma at 2 decimal, halimbawa 1,500.00.',
      'I-type lang ang numero (1500). Ang format na ang maglalagay ng comma at .00.',
    ],
    keys: [
      { keys: 'Ctrl + Shift + 1', what: 'comma at 2 decimal' },
      { keys: 'Ctrl + Shift + ↓', what: 'piliin ang buong column muna' },
    ],
    tasks: ['numberFormat', 'typeFormatted'],
  },
  {
    title: 'Bold',
    body: ['Mas madaling basahin ang table kapag naka-bold ang header at ang mahahalagang cell.'],
    keys: [
      { keys: 'Ctrl + B', what: 'i-bold (pindutin ulit para alisin)' },
      { keys: 'Ctrl + Shift + →', what: 'piliin ang buong row ng header' },
    ],
    tasks: ['boldHeader', 'boldCell'],
  },
];
