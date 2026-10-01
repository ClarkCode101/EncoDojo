/**
 * What Sensei says (owner's decision, 2026-09-27). Rule-based, no AI:
 * - tips for the page you're on (typing, numpad, copy, encoding, ...),
 * - lines about YOUR results (what to do next, how close the next belt is,
 *   your streak), taken from the saved sessions,
 * - encouragement.
 * Short lines, easy to read in a small speech bubble, in Taglish (TIPS, CHEERS, ...)
 * or English (the `_EN` lists), following Settings -> "Wika / Language".
 */
import { beltStatus } from '../../lib/belts';
import { translator, type Lang } from '../../lib/i18n';
import { dailyGoalText, doneToday, needsBackup } from '../../lib/reminders';
import type { Session } from '../../lib/storage';
import { nextFocus } from '../dashboard/coach';
import { currentStreak } from '../dashboard/stats';

export type SenseiPlace =
  'home' | 'typing' | 'numpad' | 'copy' | 'encoding' | 'qc' | 'excel' | 'assessment' | 'settings';

export function placeFromPath(path: string): SenseiPlace {
  const first = path.split('/')[1] ?? '';
  const known: SenseiPlace[] = ['typing', 'numpad', 'copy', 'encoding', 'qc', 'excel', 'assessment', 'settings'];
  return (known as string[]).includes(first) ? (first as SenseiPlace) : 'home';
}

export const TIPS: Record<SenseiPlace, string[]> = {
  home: [
    'Mas mabuti ang 10 minuto araw-araw kaysa isang oras minsan sa isang linggo.',
    'Unahin ang tama, saka ang bilis. Kusang bibilis ka.',
    'Kapag handa ka na, subukan ang Assessment para makuha ang susunod na belt.',
  ],
  typing: [
    'Tumingin sa text, hindi sa keyboard. Masasanay din ang mga daliri mo.',
    'Ilagay ang mga daliri sa A-S-D-F at J-K-L-; bago magsimula.',
    'Mas mahalaga ang tama kaysa sa bilis. Bawat mali ay bawas sa Net WPM.',
  ],
  numpad: [
    'I-ON muna ang Num Lock bago mag-numpad.',
    'Ilagay ang gitnang daliri sa 5. May maliit na umbok iyon para makapa mo.',
    'Hindi kailangan ang comma sa numpad. Tuloy-tuloy lang ang digits.',
  ],
  copy: [
    'Basahin nang buo ang isang field bago i-type.',
    'Ingat sa "Ma.", "Jr." at "Dela Cruz". Kailangang eksakto, pati tuldok.',
    'Tab ang gamit sa paglipat ng field, gaya sa totoong software.',
  ],
  encoding: [
    'Laging mm/dd/yyyy ang petsa, kahit iba ang itsura nito sa papel.',
    'Sa halaga: walang ₱ at walang comma. ₱5,115.25 → 5115.25',
    'Hanapin muna ang 5 detalye sa papel bago mag-type.',
  ],
  qc: [
    'Basahin ang bawat field letra por letra. Madalas nagtatago ang mali sa tuldok at sa digit.',
    'Ihambing muna ang mga numero (petsa, contact, ID). Doon madalas ang baligtad na digit.',
    'Kapag walang mali ang record, walang markahan. Enter lang.',
  ],
  excel: [
    'Ctrl + ↓ ang pinakamabilis na paraan papunta sa dulo ng mahabang listahan.',
    'Kapag nagkamali ka sa sheet, Ctrl + Z agad. Walang masisira.',
    'F2 para ayusin ang laman ng cell nang hindi binubura lahat.',
    'Nakalimutan ang isang shortcut? Buksan ang Kodigo: nandoon lahat ng natutunan mo, at puwede itong i-print.',
  ],
  assessment: [
    'Huminga muna nang malalim. Parang practice lang ito.',
    'Walang "Finish" sa Assessment, kaya tuloy-tuloy lang hanggang matapos ang oras.',
    'May pahinga sa pagitan ng bawat bahagi. Gamitin mo iyon.',
  ],
  settings: [
    'Kung maliit ang text para sa iyo, i-on ang "Mas malaking text".',
    'Mag-download ng backup paminsan-minsan para hindi mawala ang progress mo.',
  ],
};

export const TIPS_EN: Record<SenseiPlace, string[]> = {
  home: [
    '10 minutes every day is better than one hour once a week.',
    'Be correct first, then fast. The speed comes by itself.',
    'When you are ready, take the Assessment to earn the next belt.',
  ],
  typing: [
    'Look at the text, not the keyboard. Your fingers will learn.',
    'Put your fingers on A-S-D-F and J-K-L-; before you start.',
    'Being correct matters more than speed. Every mistake lowers your Net WPM.',
  ],
  numpad: [
    'Turn ON Num Lock before using the numpad.',
    'Rest your middle finger on 5. It has a small bump you can feel.',
    'No commas on the numpad. Just keep typing the digits.',
  ],
  copy: [
    'Read the whole field before you type it.',
    'Watch out for "Ma.", "Jr." and "Dela Cruz". They must be exact, periods too.',
    'Use Tab to move between fields, like in real software.',
  ],
  encoding: [
    'The date is always mm/dd/yyyy, even when it looks different on paper.',
    'Amounts: no ₱ and no commas. ₱5,115.25 → 5115.25',
    'Find the 5 details on the paper before you type.',
  ],
  qc: [
    'Read every field letter by letter. Mistakes often hide in periods and digits.',
    'Compare the numbers first (date, contact, ID). Swapped digits are common there.',
    'When a record has no mistake, mark nothing. Just Enter.',
  ],
  excel: [
    'Ctrl + ↓ is the fastest way to the end of a long list.',
    'Made a mistake on the sheet? Ctrl + Z right away. Nothing breaks.',
    'F2 lets you fix a cell without erasing all of it.',
    'Forgot a shortcut? Open the Cheat sheet: everything you learned is there, and you can print it.',
  ],
  assessment: [
    'Take a deep breath first. It is just like practice.',
    'There is no "Finish" in the Assessment, so keep going until the time is up.',
    'There is a break between the parts. Use it.',
  ],
  settings: [
    'If the text is small for you, turn on "Larger text".',
    'Download a backup now and then so you never lose your progress.',
  ],
};

export const CHEERS: string[] = [
  'Normal lang magkamali. Dito ka natututo.',
  'Bawat ensayo, isang hakbang palapit sa trabaho.',
  'Kahit 5 minuto lang ngayon, malaking tulong na.',
  'Ang galing mo. Ituloy mo lang!',
];

export const CHEERS_EN: string[] = [
  'Making mistakes is normal. That is how you learn.',
  'Every practice is one step closer to the job.',
  'Even 5 minutes today helps a lot.',
  'You are doing great. Keep going!',
];

/** The backup reminder (progress lives only in this browser). */
export const BACKUP_LINE =
  'Matagal ka nang walang backup. Pumunta sa Settings at i-download ang backup para hindi mawala ang progress mo.';
export const BACKUP_LINE_EN =
  'You have not made a backup in a while. Go to Settings and download a backup so you never lose your progress.';

/** The Settings choices Sensei looks at. */
export type SenseiSettings = { dailyGoal?: number; lastBackupAt?: string };

export const WELCOME = 'Maligayang pagdating sa dojo! Simulan natin sa Typing Practice.';
export const WELCOME_EN = "Welcome to the dojo! Let's start with Typing Practice.";

/** Lines about the user's own results (empty for a brand-new user). */
export function personalLines(
  sessions: Session[],
  today: Date = new Date(),
  settings: SenseiSettings = {},
  lang: Lang = 'tl',
): string[] {
  if (sessions.length === 0) return [];
  const t = translator(lang);
  const lines: string[] = [];
  const done = doneToday(sessions, today);
  const goal = dailyGoalText(settings.dailyGoal, done, lang);
  if (goal) {
    const reached = done >= (settings.dailyGoal ?? 0);
    lines.push(
      reached ? `${goal} ${t('Ang galing!', 'Great job!')}` : `${goal} ${t("Kaya mo 'yan!", 'You can do it!')}`,
    );
  }
  const f = nextFocus(sessions, lang);
  lines.push(
    f.skill === 'assessment'
      ? f.reason
      : t(`Susunod, subukan ang ${f.label}: ${f.reason}`, `Next, try ${f.label}: ${f.reason}`),
  );
  const b = beltStatus(sessions, lang);
  if (b.next && b.progress >= 0.5)
    lines.push(t(`Malapit na ang ${b.next.label}! ${b.nextHint}`, `${b.next.label} is close! ${b.nextHint}`));
  const streak = currentStreak(sessions, today);
  if (streak >= 2)
    lines.push(
      t(
        `${streak} araw ka nang sunod-sunod na nag-e-ensayo. Ituloy mo!`,
        `You have practiced ${streak} days in a row. Keep it up!`,
      ),
    );
  return lines;
}

const pick = (list: string[], rand: () => number) => list[Math.floor(rand() * list.length) % list.length];

/**
 * One line for this moment.
 * - Brand-new user on Home: the welcome line.
 * - Right after a practice (`afterPractice`): about the results (or a cheer if nothing is saved yet), never a random tip.
 * - Home: about the results, a cheer, or a general tip.
 * - Other pages: mostly a tip for that page, sometimes a cheer.
 * `rand` returns 0..1 (Math.random in the app; fixed in tests).
 */
export function senseiLine(
  {
    place,
    sessions,
    afterPractice = false,
    settings = {},
    lang = 'tl',
  }: { place: SenseiPlace; sessions: Session[]; afterPractice?: boolean; settings?: SenseiSettings; lang?: Lang },
  rand: () => number = Math.random,
): string {
  const en = lang === 'en';
  const tips = en ? TIPS_EN : TIPS;
  const cheers = en ? CHEERS_EN : CHEERS;
  const personal = personalLines(sessions, new Date(), settings, lang);
  if (place === 'home' && sessions.length === 0) return en ? WELCOME_EN : WELCOME;
  const r = rand();
  // The backup reminder comes first on Home and Settings (often, not every time).
  if (!afterPractice && (place === 'home' || place === 'settings') && r < 0.5) {
    if (needsBackup(settings.lastBackupAt, sessions)) return en ? BACKUP_LINE_EN : BACKUP_LINE;
  }
  if (afterPractice) return personal.length ? pick(personal, rand) : pick(cheers, rand);
  if (place === 'home') {
    if (r < 0.5 && personal.length) return pick(personal, rand);
    return r < 0.75 ? pick(cheers, rand) : pick(tips.home, rand);
  }
  return r < 0.7 ? pick(tips[place], rand) : pick(cheers, rand);
}
