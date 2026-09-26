/**
 * Plain-language (Taglish) explanations of every number the app shows.
 * Used by the "Ano ito?" buttons so every screen explains things the same way.
 */
import { JOB_READY_NUMPAD, JOB_READY_TYPING } from './targets';

const kph = JOB_READY_NUMPAD.kph.toLocaleString('en-US');

export const HELP = {
  netWpm:
    `Net WPM = ilang salita (words) kada minuto ang na-type mo, bawas na ang mga mali. ` +
    `Ito ang karaniwang tinitingnan sa hiring test. ${JOB_READY_TYPING.netWpm} pataas ang target.`,
  grossWpm: 'Gross WPM = bilis mo kasama pa ang mga mali. Laging mas mataas ito o kapareho ng Net WPM.',
  accuracy: `Accuracy = ilang porsyento ng na-type mo ang tama sa dulo. ${JOB_READY_TYPING.accuracy}% pataas ang target.`,
  keystrokeAccuracy:
    'Keystroke accuracy = ilang porsyento ng lahat ng pinindot mo ang tama agad. ' +
    'Kasama rito ang mga mali na binura mo gamit ang Backspace. Kapag malayo ito sa Accuracy, madalas kang nagbubura.',
  kph:
    `KPH (keystrokes per hour) = ilang tamang pindot sa numpad ang kaya mo sa loob ng isang oras. ` +
    `${kph} pataas ang target.`,
  entryAccuracy: `Entry accuracy = ilang porsyento ng mga numero ang buong tama. ${JOB_READY_NUMPAD.entryAccuracy}% pataas ang target.`,
  streak: 'Ilang araw nang sunod-sunod kang nag-practice. Kahit ilang minuto lang bawat araw, malaking tulong na!',
  numpad:
    'Ang numpad ay ang mga number key sa KANAN ng keyboard (7-8-9, 4-5-6, 1-2-3, 0). ' +
    'Siguraduhing naka-ON ang Num Lock. Kung laptop na walang numpad, puwede ang number keys sa itaas.',
} as const;
