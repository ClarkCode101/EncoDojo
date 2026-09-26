import { describe, expect, it } from 'vitest';
import type { Session } from '../../lib/storage';
import { compareWithHistory } from './compare';

function session(type: Session['type'], startedAt: string, metrics: Record<string, number>): Session {
  return { id: startedAt, type, startedAt, durationSec: 60, metrics, mistakes: [] };
}

describe('compareWithHistory', () => {
  it('returns nulls when there is no history', () => {
    expect(compareWithHistory([])).toEqual({ previousNetWpm: null, bestNetWpm: null });
  });

  it('finds the latest and the best typing result', () => {
    const sessions = [
      session('typing', '2026-09-01T08:00:00Z', { netWpm: 30 }),
      session('typing', '2026-09-03T08:00:00Z', { netWpm: 35 }),
      session('typing', '2026-09-02T08:00:00Z', { netWpm: 42 }),
      session('numpad', '2026-09-04T08:00:00Z', { kph: 9000 }),
    ];
    expect(compareWithHistory(sessions)).toEqual({ previousNetWpm: 35, bestNetWpm: 42 });
  });
});
