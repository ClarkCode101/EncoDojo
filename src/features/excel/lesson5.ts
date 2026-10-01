/**
 * Aralin 5, "Unang formulas": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks5.ts / lesson5Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels5 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    firstFormula: t('Unang formula (=B2*C2)', 'First formula (=B2*C2)'),
    fillFormula: t('Kopyahin ang formula pababa', 'Copy the formula down'),
    autoSum: t('Kabuuan gamit ang AutoSum', 'Total with AutoSum'),
    average: 'AVERAGE',
    max: 'MAX',
    count: 'COUNT',
  };
};

export const lesson5 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Ang formula', 'The formula'),
      body: [
        t(
          'Ang formula ay nagsisimula sa =. Ang Excel ang magkukuwenta para sa iyo.',
          'A formula starts with =. Excel does the math for you.',
        ),
        t(
          'Gamitin ang pangalan ng cell (B2, C2), hindi ang numero mismo. Kapag nagbago ang numero, kusang magbabago ang sagot.',
          'Use the cell names (B2, C2), not the numbers themselves. When a number changes, the answer changes by itself.',
        ),
        t('Mga simbolo: + dagdag, - bawas, * multiply, / divide.', 'Symbols: + add, - subtract, * multiply, / divide.'),
      ],
      keys: [
        { keys: '=', what: t('simula ng formula', 'starts a formula') },
        { keys: 'Enter', what: t('i-save at ipakita ang sagot', 'save and show the answer') },
      ],
      tasks: ['firstFormula'],
    },
    {
      title: t('Kopyahin ang formula', 'Copy the formula'),
      body: [
        t(
          'Hindi na kailangang i-type ulit ang formula sa bawat row. Kopyahin ito pababa.',
          'No need to type the formula again in every row. Copy it down.',
        ),
        t(
          'Kusang lilipat ang mga cell: ang =B2*C2, kapag kinopya sa row 3, ay magiging =B3*C3.',
          'The cells move by themselves: =B2*C2, copied to row 3, becomes =B3*C3.',
        ),
      ],
      keys: [
        { keys: 'Shift + ↓', what: t('piliin ang mga cell pababa', 'select the cells going down') },
        { keys: 'Ctrl + D', what: t('kopyahin ang formula pababa', 'copy the formula down') },
      ],
      tasks: ['fillFormula'],
    },
    {
      title: t('Kabuuan: SUM at AutoSum', 'Totals: SUM and AutoSum'),
      body: [
        t(
          'Ang =SUM(D2:D9) ay ang kabuuan ng D2 hanggang D9. Ang tutuldok (:) ay "hanggang".',
          '=SUM(D2:D9) is the total of D2 to D9. The colon (:) means "to".',
        ),
        t(
          'Mas mabilis: Alt + = (AutoSum). Kusang isusulat ang =SUM ng mga numero sa itaas. Enter lang.',
          'Faster: Alt + = (AutoSum). It writes the =SUM of the numbers above by itself. Just Enter.',
        ),
      ],
      keys: [
        { keys: '=SUM(...)', what: t('kabuuan', 'total') },
        { keys: 'Alt + =', what: t('AutoSum, tapos Enter', 'AutoSum, then Enter') },
      ],
      tasks: ['autoSum'],
    },
    {
      title: t('AVERAGE, MAX at COUNT', 'AVERAGE, MAX and COUNT'),
      body: [
        t(
          'Pare-pareho ang anyo: =PANGALAN(unang cell:huling cell), halimbawa =AVERAGE(B2:B9).',
          'They all look the same: =NAME(first cell:last cell), for example =AVERAGE(B2:B9).',
        ),
        t(
          'AVERAGE: karaniwan. MAX: pinakamalaki (MIN: pinakamaliit). COUNT: ilan ang cell na may numero.',
          'AVERAGE: the average. MAX: the largest (MIN: the smallest). COUNT: how many cells have a number.',
        ),
      ],
      keys: [
        { keys: '=AVERAGE(...)', what: t('karaniwan', 'average') },
        { keys: '=MAX(...)', what: t('pinakamalaki', 'largest') },
        { keys: '=MIN(...)', what: t('pinakamaliit', 'smallest') },
        { keys: '=COUNT(...)', what: t('ilan ang may numero', 'how many have a number') },
      ],
      tasks: ['average', 'max', 'count'],
    },
  ];
};
