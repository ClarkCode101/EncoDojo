/**
 * Aralin 12, "Rows at columns": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks12.ts / lesson12Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels12 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    insertRow: t('Magdagdag ng row', 'Insert a row'),
    deleteRow: t('Magbura ng row', 'Delete a row'),
    insertCol: t('Magdagdag ng column', 'Insert a column'),
    deleteCol: t('Magbura ng column', 'Delete a column'),
    hideCol: t('Itago ang column', 'Hide a column'),
    freeze: 'Freeze Panes',
  };
};

export const lesson12 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Magdagdag at magbura ng row', 'Insert and delete rows'),
      body: [
        t(
          'Shift + Space: piliin ang buong row. Tapos Ctrl + + para magdagdag ng row sa itaas nito, o Ctrl + - para burahin ito.',
          'Shift + Space: select the whole row. Then Ctrl + + to insert a row above it, or Ctrl + - to delete it.',
        ),
        t(
          'Kusang aayos ang mga formula: ang =SUM(E2:E9) ay magiging =SUM(E2:E10) kapag may idinagdag na row sa loob nito.',
          'The formulas adjust by themselves: =SUM(E2:E9) becomes =SUM(E2:E10) when a row is inserted inside it.',
        ),
      ],
      keys: [
        { keys: 'Shift + Space', what: t('piliin ang buong row', 'select the whole row') },
        { keys: 'Ctrl + +', what: t('magdagdag (Ctrl, Shift at =)', 'insert (Ctrl, Shift and =)') },
        { keys: 'Ctrl + -', what: t('magbura', 'delete') },
      ],
      tasks: ['insertRow', 'deleteRow'],
    },
    {
      title: t('Magdagdag at magbura ng column', 'Insert and delete columns'),
      body: [
        t(
          'Ctrl + Space: piliin ang buong column. Pareho ang Ctrl + + at Ctrl + -: ang bagong column ay mapupunta sa kaliwa.',
          'Ctrl + Space: select the whole column. Ctrl + + and Ctrl + - work the same: the new column goes to the left.',
        ),
        t(
          'Mag-ingat sa pagbura: kapag may formula na tumuturo sa nabura, lalabas ang #REF!.',
          'Be careful when deleting: when a formula points to what was deleted, #REF! shows up.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + Space', what: t('piliin ang buong column', 'select the whole column') },
        { keys: 'Ctrl + +', what: t('magdagdag', 'insert') },
        { keys: 'Ctrl + -', what: t('magbura', 'delete') },
      ],
      tasks: ['insertCol', 'deleteCol'],
    },
    {
      title: t('Itago ang column', 'Hide a column'),
      body: [
        t(
          'Ctrl + 0 (zero): itago ang column. Hindi nabubura ang laman, hindi lang nakikita (halimbawa, bago mag-print).',
          'Ctrl + 0 (zero): hide the column. The content is not deleted, just not shown (for example, before printing).',
        ),
        t(
          'Para ibalik: piliin ang mga column sa magkabilang gilid, tapos Ctrl + Shift + 0 (o right-click, Unhide).',
          'To bring it back: select the columns on both sides, then Ctrl + Shift + 0 (or right-click, Unhide).',
        ),
      ],
      keys: [
        { keys: 'Ctrl + 0', what: t('itago ang column', 'hide the column') },
        { keys: 'Ctrl + Shift + 0', what: t('ibalik', 'show it again') },
      ],
      tasks: ['hideCol'],
    },
    {
      title: 'Freeze Panes',
      body: [
        t(
          'Sa mahabang sheet, nawawala ang header kapag nag-scroll. Ang Freeze Panes ay nagpapanatili ng mga row sa itaas at column sa kaliwa.',
          'In a long sheet, the header disappears when you scroll. Freeze Panes keeps the rows at the top and the columns on the left in view.',
        ),
        t(
          'Ang Freeze Panes ay nagpi-freeze sa itaas at kaliwa ng napiling cell: sa B2, row 1 at column A. (Sa Excel: View > Freeze Panes.)',
          'Freeze Panes freezes what is above and left of the selected cell: at B2, row 1 and column A. (In Excel: View > Freeze Panes.)',
        ),
      ],
      keys: [{ keys: 'Freeze Panes', what: t('sa toolbar', 'on the toolbar') }],
      tasks: ['freeze'],
    },
  ];
};
