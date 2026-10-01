/**
 * Aralin 10, "Pag-check ng trabaho": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks10.ts / lesson10Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels10 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    cfDuplicates: t('Kulay sa doble (Duplicate Values)', 'Color the duplicates (Duplicate Values)'),
    cfBlanks: t('Kulay sa blangko (Blanks)', 'Color the blanks (Blanks)'),
    countBlank: 'COUNTBLANK',
    countifs: 'COUNTIFS',
    sumifs: 'SUMIFS',
    dropdown: t('Gumawa ng dropdown', 'Make a dropdown'),
    useDropdown: t('Gamitin ang dropdown', 'Use the dropdown'),
  };
};

export const lesson10 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Conditional Formatting: kulay sa mali', 'Conditional Formatting: color the mistakes'),
      body: [
        t(
          'Bago ipasa ang trabaho, hanapin ang mali. Piliin ang mga cell, Conditional Formatting: kukulayan ng pula ang mga doble (Duplicate Values) o ang walang laman (Blanks).',
          'Before you hand in your work, look for mistakes. Select the cells, Conditional Formatting: it colors the duplicates (Duplicate Values) or the empty cells (Blanks) red.',
        ),
        t(
          'Ang doble ay madalas na na-encode nang dalawang beses. Ang blangko ay kulang na data.',
          'A duplicate was often encoded twice. A blank is missing data.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + Shift + ↓', what: t('piliin hanggang dulo', 'select to the end') },
        { keys: 'Conditional Formatting', what: t('sa toolbar', 'on the toolbar') },
      ],
      tasks: ['cfDuplicates', 'cfBlanks'],
    },
    {
      title: t('COUNTBLANK: ilan ang kulang', 'COUNTBLANK: how many are missing'),
      body: [
        t(
          'Ang =COUNTBLANK(A2:E9) ay bumibilang ng walang laman. 0 ang gusto mong makita bago ipasa.',
          '=COUNTBLANK(A2:E9) counts the empty cells. You want to see 0 before you hand it in.',
        ),
        t(
          'Kabaligtaran nito ang =COUNTA(...): ilan ang MAY laman.',
          'The opposite is =COUNTA(...): how many are NOT empty.',
        ),
      ],
      keys: [
        { keys: '=COUNTBLANK(...)', what: t('ilan ang walang laman', 'how many are empty') },
        { keys: '=COUNTA(...)', what: t('ilan ang may laman', 'how many are not empty') },
      ],
      tasks: ['countBlank'],
    },
    {
      title: t('COUNTIFS at SUMIFS: dalawang kondisyon', 'COUNTIFS and SUMIFS: two conditions'),
      body: [
        t(
          'Gaya ng COUNTIF at SUMIF, pero higit sa isang kondisyon: =COUNTIFS(C2:C9,"Lipa",E2:E9,"Unpaid").',
          'Like COUNTIF and SUMIF, but with more than one condition: =COUNTIFS(C2:C9,"Lipa",E2:E9,"Unpaid").',
        ),
        t(
          'Sa SUMIFS, una ang idadagdag: =SUMIFS(D2:D9,C2:C9,"Lipa",E2:E9,"Paid").',
          'In SUMIFS, what to add up comes first: =SUMIFS(D2:D9,C2:C9,"Lipa",E2:E9,"Paid").',
        ),
      ],
      keys: [
        { keys: '=COUNTIFS(...)', what: t('bilang, 2+ kondisyon', 'count, 2+ conditions') },
        { keys: '=SUMIFS(...)', what: t('kabuuan, 2+ kondisyon', 'total, 2+ conditions') },
      ],
      tasks: ['countifs', 'sumifs'],
    },
    {
      title: 'Dropdown: Data Validation',
      body: [
        t(
          'Sa dropdown, pipili na lang, kaya walang maling spelling. Piliin ang mga cell, Data Validation, List, Source: Paid,Unpaid.',
          'With a dropdown you just choose, so there are no misspellings. Select the cells, Data Validation, List, Source: Paid,Unpaid.',
        ),
        t(
          'Alt + ↓ (o ang ▼) para buksan ang listahan. Ang value na wala sa listahan ay hindi tatanggapin.',
          'Alt + ↓ (or the ▼) opens the list. A value that is not in the list is refused.',
        ),
      ],
      keys: [
        { keys: 'Data Validation', what: t('gumawa ng dropdown', 'make a dropdown') },
        { keys: 'Alt + ↓', what: t('buksan ang listahan', 'open the list') },
      ],
      tasks: ['dropdown', 'useDropdown'],
    },
  ];
};
