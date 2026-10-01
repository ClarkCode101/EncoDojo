/**
 * Aralin 14, "Pivot Table": the lesson content (same format as lesson1.ts).
 * The tasks live in tasks14.ts / lesson14Content.ts, loaded only when the
 * lesson opens (like the other late lessons).
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels14 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    createPivot: t('Gumawa ng PivotTable', 'Make a PivotTable'),
    countPivot: 'Values: Count',
    rowsAgent: t('Rows: ibang column', 'Rows: another column'),
    columnsMonth: 'Columns: Month',
    filterPaid: t('Filters: Paid lang', 'Filters: Paid only'),
    refresh: t('I-refresh (Alt + F5)', 'Refresh (Alt + F5)'),
  };
};

export const lesson14 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Ano ang PivotTable', 'What a PivotTable is'),
      body: [
        t(
          'Mabilis na summary nang walang formula: kabuuan, bilang o average bawat grupo (bawat branch, agent o buwan).',
          'A quick summary without formulas: the total, count or average per group (per branch, agent or month).',
        ),
        t(
          'Nasa loob ng table, pindutin ang PivotTable (sa Excel: Insert > PivotTable). Lalabas ito sa bagong tab, may Grand Total sa dulo.',
          'Inside the table, press PivotTable (in Excel: Insert > PivotTable). It appears on a new tab, with a Grand Total at the end.',
        ),
      ],
      keys: [{ keys: 'PivotTable', what: t('sa toolbar (Insert sa Excel)', 'on the toolbar (Insert in Excel)') }],
      tasks: ['createPivot'],
    },
    {
      title: 'PivotTable Fields',
      body: [
        t(
          'Rows: ano ang ililista pababa. Columns: ano ang ililista pakanan. Values: ano ang kukuwentahin, at paano (Sum, Count o Average).',
          'Rows: what to list going down. Columns: what to list going right. Values: what to count, and how (Sum, Count or Average).',
        ),
        t(
          'Sa Excel, hinihila (drag) ang mga field sa mga kahon na ito. Dito, piliin lang sa listahan.',
          'In Excel, you drag the fields into these boxes. Here, just choose from the list.',
        ),
      ],
      keys: [
        { keys: 'Rows', what: t('pababa', 'going down') },
        { keys: 'Columns', what: t('pakanan', 'going right') },
        { keys: 'Values', what: 'Sum, Count, Average' },
      ],
      tasks: ['countPivot', 'rowsAgent', 'columnsMonth'],
    },
    {
      title: t('Filters at Refresh', 'Filters and Refresh'),
      body: [
        t(
          'Filters: isama lang ang ilan, halimbawa ang Paid lang.',
          'Filters: include only some, for example only Paid.',
        ),
        t(
          'Mahalaga: hindi kusang nag-a-update ang PivotTable kapag nagbago ang data. I-refresh: Alt + F5 (o Data > Refresh All sa Excel).',
          'Important: a PivotTable does not update by itself when the data changes. Refresh it: Alt + F5 (or Data > Refresh All in Excel).',
        ),
      ],
      keys: [
        { keys: 'Filters', what: t('isama lang ang ilan', 'include only some') },
        { keys: 'Alt + F5', what: 'Refresh' },
      ],
      tasks: ['filterPaid', 'refresh'],
    },
  ];
};
