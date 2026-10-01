/**
 * Aralin 3, "Formatting": the lesson content (same format as lesson1.ts).
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

export const lesson3 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Numero o text?', 'Number or text?'),
      body: [
        t(
          'Kapag puro numero ang tinype mo, ginagawa itong numero ng Excel at nawawala ang zero sa unahan: 00457 ay nagiging 457.',
          'When you type only digits, Excel turns it into a number and the zeros in front disappear: 00457 becomes 457.',
        ),
        t(
          "Para manatili ang zero (Emp No., Account No., ID), mag-type muna ng apostrophe ('): '00457. Hindi ito lalabas sa cell.",
          "To keep the zeros (Emp No., Account No., ID), type an apostrophe (') first: '00457. It does not show in the cell.",
        ),
        t(
          'Tingnan ang sheet: nasa kanan ng cell ang numero, nasa kaliwa ang text.',
          'Look at the sheet: numbers sit on the right of the cell, text on the left.',
        ),
      ],
      keys: [
        {
          keys: "' (apostrophe)",
          what: t(
            'bago ang numero: gawin itong text, hindi mawawala ang zero',
            'before the number: makes it text, the zeros stay',
          ),
        },
      ],
      tasks: ['leadingZero', 'fixZeros'],
    },
    {
      title: t('Format ng halaga', 'Amount format'),
      body: [
        t(
          'Sa pera at sahod, gamitin ang format na may comma at 2 decimal, halimbawa 1,500.00.',
          'For money and pay, use the format with a comma and 2 decimals, for example 1,500.00.',
        ),
        t(
          'I-type lang ang numero (1500). Ang format na ang maglalagay ng comma at .00.',
          'Just type the number (1500). The format adds the comma and .00.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + Shift + 1', what: t('comma at 2 decimal', 'comma and 2 decimals') },
        { keys: 'Ctrl + Shift + ↓', what: t('piliin ang buong column muna', 'select the whole column first') },
      ],
      tasks: ['numberFormat', 'typeFormatted'],
    },
    {
      title: 'Bold',
      body: [
        t(
          'Mas madaling basahin ang table kapag naka-bold ang header at ang mahahalagang cell.',
          'A table is easier to read when the header and the important cells are bold.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + B', what: t('i-bold (pindutin ulit para alisin)', 'bold (press again to remove)') },
        { keys: 'Ctrl + Shift + →', what: t('piliin ang buong row ng header', 'select the whole header row') },
      ],
      tasks: ['boldHeader', 'boldCell'],
    },
  ];
};
