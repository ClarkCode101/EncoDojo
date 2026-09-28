/**
 * Aralin 4, "Sort, filter, find & replace": the lesson content (same format
 * as lesson1.ts). These tools live in Excel's Data and Home tabs; here they are
 * in the small "Data" toolbar above the sheet, and their shortcuts also work.
 */
import type { LessonTopic } from './lesson1';

export const LESSON_4: LessonTopic[] = [
  {
    title: 'Hanapin (Find)',
    body: [
      'Sa mahabang listahan, huwag nang hanapin isa-isa. Ang Find ang maghahanap para sa iyo.',
      'Ctrl + F, i-type ang hinahanap, tapos Enter. Pupunta ang cell sa nakita; Enter ulit para sa susunod.',
    ],
    keys: [{ keys: 'Ctrl + F', what: 'Find (hanapin)' }],
    tasks: ['find'],
  },
  {
    title: 'Palitan lahat (Replace)',
    body: ['Kapag paulit-ulit ang iisang mali, ayusin lahat nang sabay-sabay gamit ang Replace All.'],
    keys: [{ keys: 'Ctrl + H', what: 'Find and Replace (palitan)' }],
    tasks: ['replace'],
  },
  {
    title: 'I-sort',
    body: [
      'Ang sort ay pag-aayos ng pagkakasunod ng mga row: A hanggang Z, o pinakamaliit hanggang pinakamalaki.',
      'Pumunta muna sa isang cell ng column na gagamitin. Sabay-sabay na lilipat ang buong row, kaya hindi nagugulo ang record.',
    ],
    keys: [
      { keys: 'Sort A to Z', what: 'A hanggang Z, o maliit pataas' },
      { keys: 'Sort Z to A', what: 'Z hanggang A, o malaki pababa' },
    ],
    tasks: ['sortAsc', 'sortDesc'],
  },
  {
    title: 'I-filter',
    body: [
      'Ang filter ay pansamantalang pagtago ng mga row na hindi mo kailangan. Hindi sila nabubura.',
      'Ctrl + Shift + L para lumabas ang ▼ sa header. Sa ▼ (o Alt + ↓), piliin ang ipapakita. Ctrl + Shift + L ulit para alisin.',
    ],
    keys: [
      { keys: 'Ctrl + Shift + L', what: 'buksan o alisin ang filter' },
      { keys: 'Alt + ↓', what: 'buksan ang listahan ng ▼ (nasa header ka dapat)' },
    ],
    tasks: ['filter', 'filterOff'],
  },
  {
    title: 'Tanggalin ang doble',
    body: [
      'Minsan dalawang beses na-encode ang iisang record. Ang Remove Duplicates ang magtatanggal ng mga row na magkapareho ang lahat.',
    ],
    keys: [{ keys: 'Remove Duplicates', what: 'sa Data toolbar, tapos OK' }],
    tasks: ['removeDup'],
  },
];
