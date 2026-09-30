/**
 * Plain-language explanations of every number the app shows, in Taglish (`HELP`)
 * and English (`HELP_EN`). Used by the "Ano ito?" buttons so every screen explains
 * things the same way. Components use `useHelp()` to get the user's language.
 */
import { type Lang, useLang } from './i18n';
import { JOB_READY_COPY, JOB_READY_ENCODING, JOB_READY_NUMPAD, JOB_READY_QC, JOB_READY_TYPING } from './targets';

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
    'Gabay lang ito. Iba-iba ang bawat employer, kaya tingnan pa rin ang mismong job post. ' +
    'Mas maikli (1 minuto) ang practice dito kaysa sa karaniwang test, kaya tingnan ang average ng ilang subok.',
  entryAccuracy: `Entry accuracy = ilang porsyento ng mga numero ang buong tama. ${JOB_READY_NUMPAD.entryAccuracy}% pataas ang target.`,
  fieldAccuracy:
    `Field accuracy = ilang porsyento ng mga field (pangalan, petsa, address, ID) ang EKSAKTONG tama. ` +
    `Kahit isang letra, tuldok, o space lang ang mali, mali na ang buong field. Ganyan sa totoong encoding. ` +
    `${JOB_READY_COPY.fieldAccuracy}% pataas ang target.`,
  copyKph:
    `Bilis ng pagkopya (net KPH) = ilang tamang pindot kada oras, bawas na ang mga mali. ` +
    `${JOB_READY_COPY.kph.toLocaleString('en-US')} pataas ang target. Ito ang karaniwang minimum sa "alphanumeric data entry test" ng mga employer.`,
  copyWpm:
    'Ang Net WPM dito ay para lang maikumpara sa Typing Practice. Ang KPH ang target sa Copy Test. ' +
    'Mas mabagal talagang i-type ang pangalan, address, at ID kaysa sa ordinaryong pangungusap.',
  encodingKph:
    `Bilis ng pag-encode (net KPH) = ilang tamang pindot kada oras, bawas na ang mga mali. ` +
    `${JOB_READY_ENCODING.kph.toLocaleString('en-US')} pataas ang target, mas mababa kaysa sa Copy Test dahil kailangan mo munang ` +
    `HANAPIN ang tamang value sa dokumento at i-convert ang petsa at halaga. Tantiya ito ng EncoDojo (walang iisang pamantayan).`,
  encodingRules:
    'Sa totoong trabaho, iba-iba ang itsura ng petsa at halaga sa bawat dokumento, pero IISA ang format sa system ' +
    'o spreadsheet. Kaya bago i-type, i-convert muna: petsa → mm/dd/yyyy, halaga → numero lang (walang ₱ at comma).',
  qcAccuracy:
    'Tamang check = sa bawat field ng bawat record, tama ba ang desisyon mo ("may mali" o "tama"). ' +
    'Bawas ito kapag may hindi mo napansing mali, at kapag minarkahan mong mali ang field na tama naman. ' +
    `${JOB_READY_QC.decisionAccuracy}% pataas ang target.`,
  qcSpeed:
    `Bilis = ilang record ang na-check mo kada minuto. ${JOB_READY_QC.perMinute} pataas ang target ` +
    '(mga 20 segundo bawat record). Tantiya ito ng EncoDojo (walang iisang pamantayan).',
  streak: 'Ilang araw nang sunod-sunod kang nag-practice. Kahit ilang minuto lang bawat araw, malaking tulong na!',
  numpad:
    'Ang numpad ay ang mga number key sa KANAN ng keyboard (7-8-9, 4-5-6, 1-2-3, 0). ' +
    'Siguraduhing naka-ON ang Num Lock. Kung laptop na walang numpad, puwede ang number keys sa itaas.',
};

export type HelpTexts = Record<keyof typeof HELP, string>;

export const HELP_EN: HelpTexts = {
  netWpm:
    `Net WPM = how many words per minute you typed, minus the mistakes. ` +
    `This is what hiring tests usually look at. The target is ${JOB_READY_TYPING.netWpm} or more.`,
  grossWpm: 'Gross WPM = your speed including the mistakes. It is always the same as or higher than Net WPM.',
  accuracy: `Accuracy = what percent of what you typed is correct in the end. The target is ${JOB_READY_TYPING.accuracy}% or more.`,
  keystrokeAccuracy:
    'Keystroke accuracy = what percent of all the keys you pressed were right the first time. ' +
    'It counts the mistakes you erased with Backspace too. If it is far below Accuracy, you erase a lot.',
  kph:
    `KPH (keystrokes per hour) = how many correct numpad keys you can press in one hour. ` +
    `The target is ${kph} or more.`,
  kphLevels:
    'These are the commonly quoted standards for 10-key / numpad data entry: about 8,000 KPH for ' +
    'entry-level, 10,000 is often required, and 12,000 or more for stricter jobs. ' +
    'This is only a guide. Every employer is different, so always check the job post itself. ' +
    'The practice here is shorter (1 minute) than a usual test, so look at the average of a few tries.',
  entryAccuracy: `Entry accuracy = what percent of the numbers are fully correct. The target is ${JOB_READY_NUMPAD.entryAccuracy}% or more.`,
  fieldAccuracy:
    `Field accuracy = what percent of the fields (name, date, address, ID) are EXACTLY right. ` +
    `Even one wrong letter, period, or space makes the whole field wrong. That's how real encoding works. ` +
    `The target is ${JOB_READY_COPY.fieldAccuracy}% or more.`,
  copyKph:
    `Copying speed (net KPH) = correct keystrokes per hour, minus the mistakes. ` +
    `The target is ${JOB_READY_COPY.kph.toLocaleString('en-US')} or more. This is the usual minimum in employers' "alphanumeric data entry tests".`,
  copyWpm:
    'Net WPM here is only for comparing with Typing Practice. KPH is the target in the Copy Test. ' +
    'Names, addresses, and IDs really are slower to type than ordinary sentences.',
  encodingKph:
    `Encoding speed (net KPH) = correct keystrokes per hour, minus the mistakes. ` +
    `The target is ${JOB_READY_ENCODING.kph.toLocaleString('en-US')} or more, lower than the Copy Test because you first have to ` +
    `FIND the right value on the document and convert the date and amount. This is an EncoDojo estimate (there is no single standard).`,
  encodingRules:
    'At work, dates and amounts look different on every document, but the system or spreadsheet uses ONE format. ' +
    'So convert before you type: date → mm/dd/yyyy, amount → numbers only (no ₱ and no commas).',
  qcAccuracy:
    'Correct checks = for every field of every record, was your decision right ("has a mistake" or "correct")? ' +
    'It goes down when you miss a mistake, and when you mark a correct field as wrong. ' +
    `The target is ${JOB_READY_QC.decisionAccuracy}% or more.`,
  qcSpeed:
    `Speed = how many records you checked per minute. The target is ${JOB_READY_QC.perMinute} or more ` +
    '(about 20 seconds per record). This is an EncoDojo estimate (there is no single standard).',
  streak: 'How many days in a row you have practiced. Even a few minutes a day helps a lot!',
  numpad:
    'The numpad is the number keys on the RIGHT of the keyboard (7-8-9, 4-5-6, 1-2-3, 0). ' +
    'Make sure Num Lock is ON. On a laptop without a numpad, the number keys at the top work too.',
};

/** The explanations in a language. */
export const helpFor = (lang: Lang): HelpTexts => (lang === 'en' ? HELP_EN : HELP);

/** The explanations in the user's language (React). */
export function useHelp(): HelpTexts {
  return helpFor(useLang());
}
