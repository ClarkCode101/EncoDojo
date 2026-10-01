/**
 * Aralin 2, "Pag-encode ng data": the lesson content (same format as
 * lesson1.ts: Alamin + Subukan per topic, then the Pagsusulit).
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

export const lesson2 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('Isang buong record', 'A whole record'),
      body: [
        t(
          'Kapag nag-e-encode ng isang record, Tab ang gamit para lumipat sa kanan.',
          'When you encode a record, use Tab to move to the right.',
        ),
        t(
          'Sa dulo ng record, Enter: babalik ka sa simula ng susunod na row, handa na sa susunod na record.',
          'At the end of the record, Enter: you go back to the start of the next row, ready for the next record.',
        ),
      ],
      keys: [
        { keys: 'Tab', what: t('i-save at lumipat pakanan', 'save and move right') },
        { keys: 'Shift + Tab', what: t('bumalik pakaliwa', 'go back left') },
        {
          keys: 'Enter',
          what: t('i-save at bumalik sa simula ng susunod na row', 'save and go back to the start of the next row'),
        },
      ],
      tasks: ['newRow'],
    },
    {
      title: t('Pababa sa isang column', 'Down a column'),
      body: [
        t(
          'Kapag isang column lang ang pinupunan, Enter lang pagkatapos ng bawat isa. Kusang bababa ang cell.',
          'When you fill just one column, press Enter after each one. The cell moves down by itself.',
        ),
      ],
      keys: [{ keys: 'Enter', what: t('i-save at bumaba', 'save and go down') }],
      tasks: ['enterDown'],
    },
    {
      title: t('Kopyahin mula sa itaas', 'Copy from above'),
      body: [
        t(
          'Kapag pareho ang laman ng cell sa itaas, huwag nang i-type ulit.',
          'When the cell above has the same content, do not type it again.',
        ),
        t(
          'Ctrl + D ("Down") ang kumokopya pababa, sa isang cell man o sa maraming napiling cell.',
          'Ctrl + D ("Down") copies down, into one cell or into many selected cells.',
        ),
      ],
      keys: [
        { keys: 'Ctrl + D', what: t('kopyahin ang nasa itaas', 'copy what is above') },
        {
          keys: 'Shift + ↓',
          what: t('pumili ng mga cell pababa (bago ang Ctrl + D)', 'select cells going down (before Ctrl + D)'),
        },
      ],
      tasks: ['fillDown', 'fillRange'],
    },
    {
      title: t('Parehong laman sa maraming cell', 'The same content in many cells'),
      body: [
        t(
          'Piliin muna ang mga cell, i-type ang laman, tapos Ctrl + Enter: mapupunta ito sa lahat ng napili.',
          'Select the cells first, type the content, then Ctrl + Enter: it goes into every selected cell.',
        ),
      ],
      keys: [{ keys: 'Ctrl + Enter', what: t('ilagay sa lahat ng napiling cell', 'put it in every selected cell') }],
      tasks: ['fillSame'],
    },
    {
      title: t('Petsa ngayon', "Today's date"),
      body: [
        t(
          'Hindi na kailangang tingnan ang kalendaryo: Ctrl + ; (semicolon) ang naglalagay ng petsa ngayon.',
          "No need to check the calendar: Ctrl + ; (semicolon) puts in today's date.",
        ),
      ],
      keys: [{ keys: 'Ctrl + ;', what: t('petsa ngayon', "today's date") }],
      tasks: ['today'],
    },
  ];
};
