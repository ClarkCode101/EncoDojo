/**
 * Aralin 8, "Paglinis ng text": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks8.ts / lesson8Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels8 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    trim: t('TRIM (sobrang space)', 'TRIM (extra spaces)'),
    proper: 'PROPER(TRIM(...))',
    fillName: t('Kopyahin ang formula pababa', 'Copy the formula down'),
    upper: 'UPPER',
    left: 'LEFT',
    right: 'RIGHT',
  };
};

export const lesson8 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('TRIM: sobrang space', 'TRIM: extra spaces'),
      body: [
        t(
          'Madalas may sobrang space ang data na galing sa form o ibang file: "  juan   dela cruz ". Mahirap itong hanapin at i-sort.',
          'Data from a form or another file often has extra spaces: "  juan   dela cruz ". It is hard to find and sort.',
        ),
        t(
          'Ang =TRIM(A2) ay nagtatanggal ng space sa unahan at hulihan, at isang space na lang ang natitira sa gitna.',
          '=TRIM(A2) removes the spaces at the start and the end, and leaves only one space in between.',
        ),
      ],
      keys: [{ keys: '=TRIM(...)', what: t('tanggalin ang sobrang space', 'remove extra spaces') }],
      tasks: ['trim'],
    },
    {
      title: t('PROPER: tamang malaki at maliit na titik', 'PROPER: the right capital and small letters'),
      body: [
        t(
          'Ang =PROPER(...) ay naglalagay ng malaking titik sa simula ng bawat salita: juan DELA cruz → Juan Dela Cruz.',
          '=PROPER(...) puts a capital letter at the start of every word: juan DELA cruz → Juan Dela Cruz.',
        ),
        t(
          'Puwedeng pagsamahin ang formula: =PROPER(TRIM(A2)). Uunahin ang nasa loob (TRIM), tapos ang PROPER.',
          'Formulas can be combined: =PROPER(TRIM(A2)). The inside one (TRIM) goes first, then PROPER.',
        ),
      ],
      keys: [
        { keys: '=PROPER(TRIM(...))', what: t('linisin ang space at ang titik', 'clean the spaces and the letters') },
        { keys: 'Ctrl + D', what: t('kopyahin pababa', 'copy down') },
      ],
      tasks: ['proper', 'fillName'],
    },
    {
      title: t('UPPER at LOWER', 'UPPER and LOWER'),
      body: [
        t(
          'Ang =UPPER(...) ay ginagawang malalaking titik lahat (tn-00457 → TN-00457). Ang =LOWER(...) naman, maliliit lahat.',
          '=UPPER(...) makes every letter a capital (tn-00457 → TN-00457). =LOWER(...) makes them all small.',
        ),
        t(
          'Gamit ito sa mga code at Ref No., para pare-pareho ang itsura.',
          'Useful for codes and Ref Nos., so they all look the same.',
        ),
      ],
      keys: [
        { keys: '=UPPER(...)', what: t('lahat malaki', 'all capitals') },
        { keys: '=LOWER(...)', what: t('lahat maliit', 'all small') },
      ],
      tasks: ['upper'],
    },
    {
      title: t('LEFT at RIGHT: kunin ang bahagi', 'LEFT and RIGHT: take a part'),
      body: [
        t(
          'Ang =LEFT(cell, ilan) ay kumukuha ng mga titik mula sa kaliwa; ang =RIGHT(cell, ilan), mula sa kanan.',
          '=LEFT(cell, how many) takes letters from the left; =RIGHT(cell, how many), from the right.',
        ),
        t(
          'Halimbawa, sa TN-00457: =LEFT(D2,2) ay TN, at =RIGHT(D2,5) ay 00457.',
          'For example, in TN-00457: =LEFT(D2,2) is TN, and =RIGHT(D2,5) is 00457.',
        ),
      ],
      keys: [
        { keys: '=LEFT(..., 2)', what: t('mula sa kaliwa', 'from the left') },
        { keys: '=RIGHT(..., 5)', what: t('mula sa kanan', 'from the right') },
      ],
      tasks: ['left', 'right'],
    },
  ];
};
