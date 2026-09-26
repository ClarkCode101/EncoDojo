import type { Session } from '../../lib/storage';

export type TypingComparison = {
  /** Net WPM of the most recent SAVED typing test before this one, or null. */
  previousNetWpm: number | null;
  /** Best saved Net WPM before this one, or null. */
  bestNetWpm: number | null;
};

/** Compare against earlier saved typing tests (call BEFORE saving the new one). */
export function compareWithHistory(sessions: Session[]): TypingComparison {
  const typing = sessions.filter((s) => s.type === 'typing' && typeof s.metrics.netWpm === 'number');
  if (typing.length === 0) return { previousNetWpm: null, bestNetWpm: null };

  const latest = typing.reduce((a, b) => (a.startedAt >= b.startedAt ? a : b));
  return {
    previousNetWpm: latest.metrics.netWpm,
    bestNetWpm: Math.max(...typing.map((s) => s.metrics.netWpm)),
  };
}
