/**
 * Aralin 14, "Pivot Table": the lesson content (same format as lesson1.ts).
 * The tasks live in tasks14.ts / lesson14Content.ts, loaded only when the
 * lesson opens (like the other late lessons).
 */
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL_14: Record<string, string> = {
  createPivot: 'Gumawa ng PivotTable',
  countPivot: 'Values: Count',
  rowsAgent: 'Rows: ibang column',
  columnsMonth: 'Columns: Month',
  filterPaid: 'Filters: Paid lang',
  refresh: 'I-refresh (Alt + F5)',
};

export const LESSON_14: LessonTopic[] = [
  {
    title: 'Ano ang PivotTable',
    body: [
      'Mabilis na summary nang walang formula: kabuuan, bilang o average bawat grupo (bawat branch, agent o buwan).',
      'Nasa loob ng table, pindutin ang PivotTable (sa Excel: Insert > PivotTable). Lalabas ito sa bagong tab, may Grand Total sa dulo.',
    ],
    keys: [{ keys: 'PivotTable', what: 'sa toolbar (Insert sa Excel)' }],
    tasks: ['createPivot'],
  },
  {
    title: 'PivotTable Fields',
    body: [
      'Rows: ano ang ililista pababa. Columns: ano ang ililista pakanan. Values: ano ang kukuwentahin, at paano (Sum, Count o Average).',
      'Sa Excel, hinihila (drag) ang mga field sa mga kahon na ito. Dito, piliin lang sa listahan.',
    ],
    keys: [
      { keys: 'Rows', what: 'pababa' },
      { keys: 'Columns', what: 'pakanan' },
      { keys: 'Values', what: 'Sum, Count, Average' },
    ],
    tasks: ['countPivot', 'rowsAgent', 'columnsMonth'],
  },
  {
    title: 'Filters at Refresh',
    body: [
      'Filters: isama lang ang ilan, halimbawa ang Paid lang.',
      'Mahalaga: hindi kusang nag-a-update ang PivotTable kapag nagbago ang data. I-refresh: Alt + F5 (o Data > Refresh All sa Excel).',
    ],
    keys: [
      { keys: 'Filters', what: 'isama lang ang ilan' },
      { keys: 'Alt + F5', what: 'Refresh' },
    ],
    tasks: ['filterPaid', 'refresh'],
  },
];
