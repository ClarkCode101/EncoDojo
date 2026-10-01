/**
 * Aralin 6, "IF, COUNTIF at SUMIF": the lesson content (same format as lesson1.ts).
 * No HyperFormula here (this file is loaded with the lessons list); the tasks
 * and the formula engine live in tasks6.ts / lesson6Content.ts, loaded only
 * when the lesson opens.
 */
import { translator, type Lang } from '../../lib/i18n';
import type { LessonTopic } from './lesson1';

/** Short names of the task kinds, for the results table. */
export const taskLabels6 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    ifFirst: t('IF (Met o Below)', 'IF (Met or Below)'),
    ifFill: t('Kopyahin ang IF pababa', 'Copy the IF down'),
    countifText: t('COUNTIF (isang branch)', 'COUNTIF (one branch)'),
    countifMore: 'COUNTIF (">=20000")',
    sumifText: t('SUMIF (isang branch)', 'SUMIF (one branch)'),
    sumifCell: t('SUMIF gamit ang isang cell', 'SUMIF with a cell'),
  };
};

export const lesson6 = (lang: Lang = 'tl'): LessonTopic[] => {
  const t = translator(lang);
  return [
    {
      title: t('IF: kung oo, ito; kung hindi, iyan', 'IF: if yes, this; if not, that'),
      body: [
        t(
          'Ang IF ay nagtatanong: =IF(tanong, kung oo, kung hindi). Halimbawa: =IF(C2>=20000,"Met","Below").',
          'IF asks a question: =IF(question, if yes, if not). For example: =IF(C2>=20000,"Met","Below").',
        ),
        t(
          'Ang text ay nasa loob ng " ". Mga tanong: >= (o higit pa), <= (o mas mababa), > , < , = (pareho), <> (hindi pareho).',
          'Text goes inside " ". Questions: >= (or more), <= (or less), > , < , = (the same), <> (not the same).',
        ),
      ],
      keys: [
        { keys: '=IF(...)', what: t('kung oo, ito; kung hindi, iyan', 'if yes, this; if not, that') },
        { keys: 'Ctrl + D', what: t('kopyahin pababa (gaya ng Aralin 5)', 'copy down (like Lesson 5)') },
      ],
      tasks: ['ifFirst', 'ifFill'],
    },
    {
      title: t('COUNTIF: bilangin kung ilan', 'COUNTIF: count how many'),
      body: [
        t(
          'Ang =COUNTIF(saan titingin, ano ang hahanapin) ay bumibilang ng mga cell na pasok.',
          '=COUNTIF(where to look, what to look for) counts the cells that match.',
        ),
        t(
          'Text: =COUNTIF(B2:B9,"Cebu City"). Numero na may tanong: nasa loob din ng " ", gaya ng ">=20000".',
          'Text: =COUNTIF(B2:B9,"Cebu City"). A number with a question also goes inside " ", like ">=20000".',
        ),
      ],
      keys: [{ keys: '=COUNTIF(...)', what: t('ilan ang pasok', 'how many match') }],
      tasks: ['countifText', 'countifMore'],
    },
    {
      title: t('SUMIF: kabuuan ng mga pasok', 'SUMIF: the total of the matches'),
      body: [
        t(
          'Ang =SUMIF(saan titingin, ano ang hahanapin, ano ang idadagdag). Halimbawa: =SUMIF(B2:B9,"Cebu City",C2:C9).',
          '=SUMIF(where to look, what to look for, what to add up). For example: =SUMIF(B2:B9,"Cebu City",C2:C9).',
        ),
        t(
          'Puwedeng cell ang hahanapin, gaya ng F5 (walang " "). Palitan lang ang F5, magbabago ang sagot.',
          'What to look for can be a cell, like F5 (no " "). Just change F5 and the answer changes.',
        ),
      ],
      keys: [{ keys: '=SUMIF(...)', what: t('kabuuan ng mga pasok', 'total of the matches') }],
      tasks: ['sumifText', 'sumifCell'],
    },
  ];
};
