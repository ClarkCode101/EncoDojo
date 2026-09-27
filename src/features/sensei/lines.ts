/**
 * What Sensei says (owner's decision, 2026-09-27). Rule-based, no AI:
 * - tips for the page you're on (typing, numpad, copy, encoding, ...),
 * - lines about YOUR results (what to do next, how close the next belt is,
 *   your streak), taken from the saved sessions,
 * - encouragement.
 * Short Taglish lines, easy to read in a small speech bubble.
 */
import { beltStatus } from '../../lib/belts';
import { dailyGoalText, doneToday, needsBackup } from '../../lib/reminders';
import type { Session } from '../../lib/storage';
import { nextFocus } from '../dashboard/coach';
import { currentStreak } from '../dashboard/stats';

export type SenseiPlace = 'home' | 'typing' | 'numpad' | 'copy' | 'encoding' | 'qc' | 'assessment' | 'settings';

export function placeFromPath(path: string): SenseiPlace {
  const first = path.split('/')[1] ?? '';
  const known: SenseiPlace[] = ['typing', 'numpad', 'copy', 'encoding', 'qc', 'assessment', 'settings'];
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

export const CHEERS: string[] = [
  'Normal lang magkamali. Dito ka natututo.',
  'Bawat ensayo, isang hakbang palapit sa trabaho.',
  'Kahit 5 minuto lang ngayon, malaking tulong na.',
  'Ang galing mo. Ituloy mo lang!',
];

/** The backup reminder (progress lives only in this browser). */
export const BACKUP_LINE = 'Matagal ka nang walang backup. Pumunta sa Settings at i-download ang backup para hindi mawala ang progress mo.';

/** The Settings choices Sensei looks at. */
export type SenseiSettings = { dailyGoal?: number; lastBackupAt?: string };

export const WELCOME = 'Maligayang pagdating sa dojo! Simulan natin sa Typing Practice.';

/** Lines about the user's own results (empty for a brand-new user). */
export function personalLines(
  sessions: Session[],
  today: Date = new Date(),
  settings: SenseiSettings = {},
): string[] {
  if (sessions.length === 0) return [];
  const lines: string[] = [];
  const goal = dailyGoalText(settings.dailyGoal, doneToday(sessions, today));
  if (goal) lines.push(goal.startsWith('Naabot') ? `${goal} Ang galing!` : `${goal} Kaya mo 'yan!`);
  const f = nextFocus(sessions);
  lines.push(f.skill === 'assessment' ? f.reason : `Susunod, subukan ang ${f.label}: ${f.reason}`);
  const b = beltStatus(sessions);
  if (b.next && b.progress >= 0.5) lines.push(`Malapit na ang ${b.next.label}! ${b.nextHint}`);
  const streak = currentStreak(sessions, today);
  if (streak >= 2) lines.push(`${streak} araw ka nang sunod-sunod na nag-e-ensayo. Ituloy mo!`);
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
  }: { place: SenseiPlace; sessions: Session[]; afterPractice?: boolean; settings?: SenseiSettings },
  rand: () => number = Math.random,
): string {
  const personal = personalLines(sessions, new Date(), settings);
  if (place === 'home' && sessions.length === 0) return WELCOME;
  const r = rand();
  // The backup reminder comes first on Home and Settings (often, not every time).
  if (!afterPractice && (place === 'home' || place === 'settings') && r < 0.5) {
    if (needsBackup(settings.lastBackupAt, sessions)) return BACKUP_LINE;
  }
  if (afterPractice) return personal.length ? pick(personal, rand) : pick(CHEERS, rand);
  if (place === 'home') {
    if (r < 0.5 && personal.length) return pick(personal, rand);
    return r < 0.75 ? pick(CHEERS, rand) : pick(TIPS.home, rand);
  }
  return r < 0.7 ? pick(TIPS[place], rand) : pick(CHEERS, rand);
}
