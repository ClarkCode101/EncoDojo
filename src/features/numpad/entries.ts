/**
 * Makes the numbers shown in the Numpad Drill. All values are random/fake.
 *
 * Difficulty ladder:
 *   1  short integers              e.g. 482
 *   2  longer integers             e.g. 30719
 *   3  small amounts with cents    e.g. 86.40
 *   4  amounts with commas         e.g. 12,450.75
 *   5  reference numbers (digits)  e.g. 2026004517  (like DR-2026-004517)
 *   6  mix of 2-5, bigger amounts  e.g. 348,912.05
 */
import type { Difficulty, NumpadMode } from '../../lib/storage';
import { formatAmount } from '../../lib/format';
import { intBetween, pick, type Rng } from '../../lib/random';

/**
 * The two choices on the Numpad Practice page.
 * "mixed" uses the SAME difficulty as the Assessment, so practice = exam.
 */
export const NUMPAD_MODES: Record<NumpadMode, { difficulty: Difficulty; label: string; description: string }> = {
  mixed: {
    difficulty: 6,
    label: 'Halo-halo (gaya ng Assessment)',
    description: 'Mahahabang numero, halaga na may sentimo, at reference number — gaya mismo sa Assessment.',
  },
  beginner: {
    difficulty: 1,
    label: 'Pang-baguhan',
    description: 'Maiikling numero lang (hal. 482). Para masanay muna sa puwesto ng mga key sa numpad.',
  },
};

/** The difficulty used by the "mixed" mode and the Assessment. */
export const MIXED_DIFFICULTY = NUMPAD_MODES.mixed.difficulty;

function amount(rng: Rng, maxPesos: number): string {
  const centavos = intBetween(rng, 100, maxPesos * 100 + 99);
  return formatAmount(centavos / 100);
}

/** Year + 6-digit sequence, e.g. 2026004517. */
function referenceNumber(rng: Rng): string {
  const year = intBetween(rng, 2019, 2026);
  const sequence = String(intBetween(rng, 1, 999_999)).padStart(6, '0');
  return `${year}${sequence}`;
}

export function makeEntry(rng: Rng, difficulty: Difficulty): string {
  switch (difficulty) {
    case 1:
      return String(intBetween(rng, 1, 999));
    case 2:
      return String(intBetween(rng, 1_000, 99_999));
    case 3:
      return amount(rng, 999);
    case 4:
      return amount(rng, 99_999);
    case 5:
      return pick(rng, [referenceNumber, (r: Rng) => amount(r, 99_999)])(rng);
    case 6:
      return pick(rng, [
        (r: Rng) => String(intBetween(r, 1_000, 99_999)),
        (r: Rng) => amount(r, 999_999),
        referenceNumber,
      ])(rng);
  }
}

/** Only these characters can be typed in the drill. */
export function cleanNumpadInput(value: string): string {
  return value.replace(/[^0-9.,]/g, '');
}
