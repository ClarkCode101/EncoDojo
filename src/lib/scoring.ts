/**
 * Single source of truth for every score shown in the app.
 *
 * All functions return RAW values (decimals kept). Use `display()` only when
 * you are about to put the number on screen.
 */

export type Mistake = {
  expected: string;
  typed: string;
  index: number;
};

/** One "word" is 5 characters, the standard typing-test convention. */
export const CHARS_PER_WORD = 5;

/** Round for display only. Storage always keeps the raw value. */
export function display(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

/**
 * Gross WPM = (total typed characters / 5) / minutes.
 * Returns 0 when no time has passed (avoids dividing by zero).
 */
export function grossWpm(totalTypedChars: number, elapsedSec: number): number {
  if (elapsedSec <= 0 || totalTypedChars <= 0) return 0;
  const minutes = elapsedSec / 60;
  return totalTypedChars / CHARS_PER_WORD / minutes;
}

/**
 * Net WPM = Gross WPM - (uncorrected errors / minutes), never below 0.
 * "Uncorrected errors" = wrong characters still present when time ran out.
 */
export function netWpm(totalTypedChars: number, uncorrectedErrors: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0;
  const minutes = elapsedSec / 60;
  const penalty = uncorrectedErrors / minutes;
  return Math.max(0, grossWpm(totalTypedChars, elapsedSec) - penalty);
}

/**
 * Accuracy % = correct characters / total characters * 100.
 * For typing, "total" = correct + mistakes (wrong, extra, and skipped keys),
 * so skipping a letter lowers accuracy too. See features/typing/alignTyping.ts.
 * Nothing typed yet = 100 (no mistakes have been made). Clamped to 0..100.
 */
export function accuracyPct(correctChars: number, totalTypedChars: number): number {
  if (totalTypedChars <= 0) return 100;
  const pct = (correctChars / totalTypedChars) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * How many of the keys just typed added a mistake (for keystroke accuracy).
 * Unlike normal accuracy, a mistake still counts here even if it is later
 * fixed with Backspace — it shows how often you slip while typing.
 *
 * Keystroke accuracy % = accuracyPct(totalKeys - wrongKeys, totalKeys)
 */
export function wrongKeystrokes(addedChars: number, errorsBefore: number, errorsAfter: number): number {
  if (addedChars <= 0) return 0; // Backspace / delete is not a keystroke here
  return Math.min(addedChars, Math.max(0, errorsAfter - errorsBefore));
}

/**
 * KPH = correct keystrokes / elapsed hours.
 * Counts digits, the decimal point, and Enter (see `keystrokesForEntry`).
 */
export function kph(correctKeystrokes: number, elapsedSec: number): number {
  if (elapsedSec <= 0 || correctKeystrokes <= 0) return 0;
  const hours = elapsedSec / 3600;
  return correctKeystrokes / hours;
}

/** Entry accuracy % = fully correct entries / total entries * 100. */
export function entryAccuracyPct(correctEntries: number, totalEntries: number): number {
  if (totalEntries <= 0) return 100;
  const pct = (correctEntries / totalEntries) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Compare a numpad / encoding entry. Commas are formatting, not keystrokes:
 * "12,450.75" and "12450.75" are both accepted.
 */
export function normalizeEntry(value: string): string {
  return value.replace(/,/g, '').trim();
}

/** True when the typed entry matches the expected entry, ignoring commas. */
export function isEntryCorrect(expected: string, typed: string): boolean {
  return normalizeEntry(expected) === normalizeEntry(typed);
}

/**
 * Correct keystrokes credited for one submitted entry:
 * every character typed in the right position, plus 1 for Enter when the whole
 * entry is correct. Commas are ignored on both sides.
 */
export function keystrokesForEntry(expected: string, typed: string): number {
  const want = normalizeEntry(expected);
  const got = normalizeEntry(typed);

  let matched = 0;
  for (let i = 0; i < got.length; i++) {
    if (got[i] === want[i]) matched++;
  }

  const enterKey = want === got ? 1 : 0;
  return matched + enterKey;
}
