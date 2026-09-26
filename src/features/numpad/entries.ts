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
import type { Difficulty } from '../../lib/storage';
import { intBetween, pick, type Rng } from '../../lib/random';

/** 1234567.5 -> "1,234,567.50" (always 2 decimals, commas every 3 digits). */
export function formatAmount(value: number): string {
  const [whole, cents] = value.toFixed(2).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${cents}`;
}

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
