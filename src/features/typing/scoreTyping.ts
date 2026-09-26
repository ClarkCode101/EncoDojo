/**
 * All the numbers for one finished typing run, in one place.
 * TypingRunner calls this when time is up; tests call it directly.
 */
import { accuracyPct, grossWpm, netWpm } from '../../lib/scoring';
import { alignTyping, type Alignment } from '../../lib/alignTyping';

export type KeyCount = { total: number; wrong: number };

export function scoreTyping(passage: string, typed: string, elapsedSec: number, keys: KeyCount) {
  const a: Alignment = alignTyping(passage, typed);
  return {
    alignment: a,
    metrics: {
      grossWpm: grossWpm(typed.length, elapsedSec),
      netWpm: netWpm(typed.length, a.errors, elapsedSec),
      accuracy: accuracyPct(a.correctChars, a.correctChars + a.errors),
      keystrokeAccuracy: accuracyPct(keys.total - keys.wrong, keys.total),
      typedChars: typed.length,
      errors: a.errors,
    },
  };
}
