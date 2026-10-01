/**
 * Aralin 7, "VLOOKUP": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks7.ts / lesson7Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels7 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    vlookupItem: 'VLOOKUP (Item)',
    vlookupPrice: t('VLOOKUP na may $ (Price)', 'VLOOKUP with $ (Price)'),
    fillPrice: t('Kopyahin ang VLOOKUP pababa', 'Copy the VLOOKUP down'),
    iferror: 'IFERROR ("Not found")',
    xlookup: 'XLOOKUP',
    xlookupNotFound: t('XLOOKUP na may "Not found"', 'XLOOKUP with "Not found"'),
  };
};

export const lesson7 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('VLOOKUP: hanapin sa listahan', 'VLOOKUP: look it up in a list'),
      body: [
        t(
          'Hinahanap ng VLOOKUP ang code sa unang column ng isang listahan, tapos kinukuha ang katabi nito.',
          'VLOOKUP looks for the code in the first column of a list, then takes what is beside it.',
        ),
        t(
          '=VLOOKUP(ano ang hahanapin, ang listahan, pang-ilang column, FALSE). Ang FALSE ay "eksaktong kapareho lang".',
          '=VLOOKUP(what to look for, the list, which column, FALSE). FALSE means "exact match only".',
        ),
      ],
      keys: [{ keys: '=VLOOKUP(...)', what: t('hanapin sa listahan', 'look it up in a list') }],
      tasks: ['vlookupItem'],
    },
    {
      title: t('Ang $: hindi gagalaw ang listahan', 'The $: the list stays put'),
      body: [
        t(
          'Kapag kinopya pababa, gagalaw din ang F2:H9 (magiging F3:H10) at may item na hindi na makikita.',
          'When copied down, F2:H9 moves too (it becomes F3:H10) and some items are no longer found.',
        ),
        t(
          'Lagyan ng $: ang $F$2:$H$9 ay hindi gagalaw kahit kopyahin. Ang A2 ay walang $, kaya lilipat ito sa A3, A4, ...',
          'Add $: $F$2:$H$9 stays put even when copied. A2 has no $, so it moves to A3, A4, ...',
        ),
      ],
      keys: [
        { keys: '$F$2:$H$9', what: t('hindi gagalaw kapag kinopya', 'stays put when copied') },
        { keys: 'Ctrl + D', what: t('kopyahin pababa', 'copy down') },
      ],
      tasks: ['vlookupPrice', 'fillPrice'],
    },
    {
      title: t('Kapag wala: #N/A at IFERROR', 'When it is missing: #N/A and IFERROR'),
      body: [
        t(
          'Lalabas ang #N/A kapag wala sa listahan ang hinahanap. Kadalasan, mali ang pagka-type ng code.',
          '#N/A shows up when what you look for is not in the list. Usually, the code was typed wrong.',
        ),
        t(
          'Ang =IFERROR(formula, "Not found") ay magpapakita ng "Not found" sa halip na #N/A.',
          '=IFERROR(formula, "Not found") shows "Not found" instead of #N/A.',
        ),
      ],
      keys: [
        { keys: '=IFERROR(...)', what: t('ibang ipapakita kapag may error', 'what to show when there is an error') },
      ],
      tasks: ['iferror'],
    },
    {
      title: t('XLOOKUP: ang bagong paraan', 'XLOOKUP: the newer way'),
      body: [
        t(
          'Nasa Excel 365, Excel 2021 at Google Sheets: =XLOOKUP(ano ang hahanapin, saan hahanapin, ano ang kukunin). Walang bibilanging column.',
          'In Excel 365, Excel 2021 and Google Sheets: =XLOOKUP(what to look for, where to look, what to return). No columns to count.',
        ),
        t(
          'May pang-apat pa: ang ipapakita kapag wala, gaya ng "Not found". Sa lumang Excel, VLOOKUP pa rin.',
          'It has a fourth part: what to show when it is missing, like "Not found". In older Excel, use VLOOKUP.',
        ),
      ],
      keys: [{ keys: '=XLOOKUP(...)', what: t('hanapin at kunin', 'look up and return') }],
      tasks: ['xlookup', 'xlookupNotFound'],
    },
  ];
};
