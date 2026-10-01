/**
 * Aralin 11, "Petsa": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks11.ts / lesson11Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels11 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    typeDate: t('I-type ang petsa (mm/dd/yyyy)', 'Type the date (mm/dd/yyyy)'),
    today: '=TODAY()',
    dueDate: t('Petsa + araw (Due Date)', 'Date + days (Due Date)'),
    age: t('Bilang ng araw (=TODAY()-B2)', 'Number of days (=TODAY()-B2)'),
    textMonth: t('TEXT: pangalan ng buwan', 'TEXT: the month name'),
    fixDate: t('Ayusin ang dd/mm na text', 'Fix the dd/mm text'),
  };
};

export const lesson11 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Ang petsa ay numero', 'A date is a number'),
      body: [
        t(
          'Sa Excel, numero ang totoong petsa, kaya nasa KANAN ito ng cell. I-type bilang mm/dd/yyyy: 08/05/2026 ay August 5, 2026.',
          'In Excel, a real date is a number, so it sits on the RIGHT of the cell. Type it as mm/dd/yyyy: 08/05/2026 is August 5, 2026.',
        ),
        t(
          'Kapag nasa KALIWA ang petsa, text ito: hindi ito masosort nang tama at hindi makukuwenta.',
          'When the date is on the LEFT, it is text: it will not sort right and cannot be used in math.',
        ),
      ],
      keys: [
        { keys: 'mm/dd/yyyy', what: t('buwan/araw/taon', 'month/day/year') },
        { keys: '=TODAY()', what: t('petsa ngayon (nagbabago araw-araw)', "today's date (changes every day)") },
        { keys: 'Ctrl + ;', what: t('petsa ngayon (hindi nagbabago)', "today's date (does not change)") },
      ],
      tasks: ['typeDate', 'today'],
    },
    {
      title: t('Kuwenta gamit ang petsa', 'Math with dates'),
      body: [
        t(
          'Dahil numero ang petsa, puwede itong dagdagan at bawasan. =B2+30 ay 30 araw pagkatapos ng B2 (Due Date).',
          'Because a date is a number, you can add to it and subtract from it. =B2+30 is 30 days after B2 (Due Date).',
        ),
        t(
          'Ang bawas ng dalawang petsa ay bilang ng araw: =TODAY()-B2 ay ilang araw na mula sa B2 (Age).',
          'One date minus another is a number of days: =TODAY()-B2 is how many days since B2 (Age).',
        ),
      ],
      keys: [
        { keys: '=B2+30', what: t('30 araw pagkatapos', '30 days after') },
        { keys: '=TODAY()-B2', what: t('ilang araw na', 'how many days so far') },
      ],
      tasks: ['dueDate', 'age'],
    },
    {
      title: t('TEXT: ibang anyo ng petsa', 'TEXT: another look for a date'),
      body: [
        t(
          'Ang =TEXT(B2,"mmmm") ay August. Ang "mmm d, yyyy" ay Aug 5, 2026. Ang "dddd" ay ang araw, gaya ng Wednesday.',
          '=TEXT(B2,"mmmm") is August. "mmm d, yyyy" is Aug 5, 2026. "dddd" is the day, like Wednesday.',
        ),
        t(
          'Text na ang resulta (para sa report o label), hindi na petsang makukuwenta.',
          'The result is text (for a report or a label), not a date you can do math with.',
        ),
      ],
      keys: [{ keys: '=TEXT(B2,"mmmm")', what: t('pangalan ng buwan', 'the month name') }],
      tasks: ['textMonth'],
    },
    {
      title: t('Petsang dd/mm (text)', 'dd/mm dates (text)'),
      body: [
        t(
          'Sa ibang system o bansa, dd/mm/yyyy ang gamit: 25/08/2026. Sa Excel na mm/dd, text ito. Mag-ingat din sa 05/08/2026: August 5 ito sa dd/mm, pero May 8 kung mm/dd.',
          'Some systems and countries use dd/mm/yyyy: 25/08/2026. In an mm/dd Excel, that is text. Also watch out for 05/08/2026: it is August 5 in dd/mm, but May 8 in mm/dd.',
        ),
        t(
          'Ayusin gamit ang =DATE(taon, buwan, araw), kasama ang RIGHT, MID at LEFT (Aralin 8).',
          'Fix it with =DATE(year, month, day), together with RIGHT, MID and LEFT (Lesson 8).',
        ),
      ],
      keys: [
        { keys: '=DATE(...)', what: t('gumawa ng petsa', 'make a date') },
        { keys: '=MID(F2,4,2)', what: t('2 titik mula sa ika-4', '2 characters from the 4th') },
      ],
      tasks: ['fixDate'],
    },
  ];
};
