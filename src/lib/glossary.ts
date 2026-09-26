/**
 * Plain-language (Taglish) explanations of every number the app shows.
 * Used by the "Ano ito?" buttons so every screen explains things the same way.
 */
import { JOB_READY_COPY, JOB_READY_NUMPAD, JOB_READY_TYPING } from './targets';

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
  kphLevels:
    'Ito ang karaniwang binabanggit na pamantayan sa 10-key / numpad data entry: mga 8,000 KPH para sa ' +
    'entry-level, 10,000 ang madalas hinihingi, at 12,000 pataas para sa mas mahigpit na trabaho. ' +
    'Gabay lang ito — iba-iba ang bawat employer, kaya tingnan pa rin ang mismong job post. ' +
    'Mas maikli (1 minuto) ang practice dito kaysa sa karaniwang test, kaya tingnan ang average ng ilang subok.',
  entryAccuracy: `Entry accuracy = ilang porsyento ng mga numero ang buong tama. ${JOB_READY_NUMPAD.entryAccuracy}% pataas ang target.`,
  fieldAccuracy:
    `Field accuracy = ilang porsyento ng mga field (pangalan, petsa, address, ID) ang EKSAKTONG tama. ` +
    `Kahit isang letra, tuldok, o space lang ang mali, mali na ang buong field — ganyan sa totoong encoding. ` +
    `${JOB_READY_COPY.fieldAccuracy}% pataas ang target.`,
  copyKph:
    `Bilis ng pagkopya (net KPH) = ilang tamang pindot kada oras, bawas na ang mga mali. ` +
    `${JOB_READY_COPY.kph.toLocaleString('en-US')} pataas ang target — ito ang karaniwang minimum sa "alphanumeric data entry test" ng mga employer.`,
  copyWpm:
    'Ang Net WPM dito ay para lang maikumpara sa Typing Practice. Ang KPH ang target sa Copy Test. ' +
    'Mas mabagal talagang i-type ang pangalan, address, at ID kaysa sa ordinaryong pangungusap.',
  streak:'Ilang araw nang sunod-sunod kang nag-practice. Kahit ilang minuto lang bawat araw, malaking tulong na!',
  numpad:
    'Ang numpad ay ang mga number key sa KANAN ng keyboard (7-8-9, 4-5-6, 1-2-3, 0). ' +
    'Siguraduhing naka-ON ang Num Lock. Kung laptop na walang numpad, puwede ang number keys sa itaas.',
} as const;
