/**
 * Aralin 4, "Sort, filter, find & replace": the lesson content (same format
 * as lesson1.ts). These tools live in Excel's Data and Home tabs; here they are
 * in the small "Data" toolbar above the sheet, and their shortcuts also work.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

export const lesson4 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Hanapin (Find)', 'Find'),
      body: [
        t(
          'Sa mahabang listahan, huwag nang hanapin isa-isa. Ang Find ang maghahanap para sa iyo.',
          'In a long list, do not look one by one. Find looks for you.',
        ),
        t(
          'I-type ang hinahanap, tapos Enter. Pupunta ang cell sa nakita; Enter ulit para sa susunod.',
          'Type what you are looking for, then Enter. The cell goes to what it found; Enter again for the next one.',
        ),
      ],
      keys: [{ keys: 'Ctrl + F', what: t('Find (hanapin)', 'Find') }],
      tasks: ['find'],
    },
    {
      title: t('Palitan lahat (Replace)', 'Replace all'),
      body: [
        t(
          'Kapag paulit-ulit ang iisang mali, ayusin lahat nang sabay-sabay gamit ang Replace All.',
          'When the same mistake repeats, fix them all at once with Replace All.',
        ),
      ],
      keys: [{ keys: 'Ctrl + H', what: t('Find and Replace (palitan)', 'Find and Replace') }],
      tasks: ['replace'],
    },
    {
      title: t('I-sort', 'Sort'),
      body: [
        t(
          'Ang sort ay pag-aayos ng pagkakasunod ng mga row: A hanggang Z, o pinakamaliit hanggang pinakamalaki.',
          'Sorting puts the rows in order: A to Z, or smallest to largest.',
        ),
        t(
          'Pumunta muna sa isang cell ng column na gagamitin. Sabay-sabay na lilipat ang buong row, kaya hindi nagugulo ang record.',
          'First go to a cell of the column to sort by. Each whole row moves together, so the records stay intact.',
        ),
      ],
      keys: [
        { keys: 'Sort A to Z', what: t('A hanggang Z, o maliit pataas', 'A to Z, or small to large') },
        { keys: 'Sort Z to A', what: t('Z hanggang A, o malaki pababa', 'Z to A, or large to small') },
      ],
      tasks: ['sortAsc', 'sortDesc'],
    },
    {
      title: t('I-filter', 'Filter'),
      body: [
        t(
          'Ang filter ay pansamantalang pagtago ng mga row na hindi mo kailangan. Hindi sila nabubura.',
          'A filter hides the rows you do not need for now. They are not deleted.',
        ),
        t(
          'Ctrl + Shift + L para lumabas ang ▼ sa header. Sa ▼ (o Alt + ↓), piliin ang ipapakita. Ctrl + Shift + L ulit para alisin.',
          'Ctrl + Shift + L makes the ▼ appear in the header. In the ▼ (or Alt + ↓), choose what to show. Ctrl + Shift + L again to remove it.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + Shift + L', what: t('buksan o alisin ang filter', 'turn the filter on or off') },
        {
          keys: 'Alt + ↓',
          what: t('buksan ang listahan ng ▼ (nasa header ka dapat)', 'open the ▼ list (you must be on the header)'),
        },
      ],
      tasks: ['filter', 'filterOff'],
    },
    {
      title: t('Tanggalin ang doble', 'Remove duplicates'),
      body: [
        t(
          'Minsan dalawang beses na-encode ang iisang record. Ang Remove Duplicates ang magtatanggal ng mga row na magkapareho ang lahat.',
          'Sometimes the same record was encoded twice. Remove Duplicates deletes the rows where everything is the same.',
        ),
      ],
      keys: [{ keys: 'Remove Duplicates', what: t('sa Data toolbar, tapos OK', 'on the Data toolbar, then OK') }],
      tasks: ['removeDup'],
    },
  ];
};
