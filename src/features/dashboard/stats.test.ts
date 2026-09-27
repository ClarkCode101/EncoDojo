import { describe, expect, it } from 'vitest';
import type { Session } from '../../lib/storage';
import {
  bestMetric,
  currentStreak,
  forNumpadBest,
  greeting,
  isBeginnerNumpad,
  latestMetric,
  recentSessions,
} from './stats';

let counter = 0;
function session(type: Session['type'], startedAt: Date, metrics: Record<string, number>): Session {
  return {
    id: `s${counter++}`,
    type,
    startedAt: startedAt.toISOString(),
    durationSec: 60,
    metrics,
    mistakes: [],
  };
}

// Local dates at noon to avoid timezone edge cases.
const day = (d: number) => new Date(2026, 8, d, 12, 0, 0);

describe('bestMetric / latestMetric', () => {
  const sessions = [
    session('typing', day(1), { netWpm: 30, accuracy: 90 }),
    session('typing', day(3), { netWpm: 45, accuracy: 95 }),
    session('typing', day(2), { netWpm: 38, accuracy: 99 }),
    session('numpad', day(4), { kph: 8000 }),
  ];

  it('finds the best value for a type', () => {
    expect(bestMetric(sessions, 'typing', 'netWpm')).toBe(45);
    expect(bestMetric(sessions, 'numpad', 'kph')).toBe(8000);
  });

  it('finds the value from the newest session', () => {
    expect(latestMetric(sessions, 'typing', 'accuracy')).toBe(95);
  });

  it('returns null when there are no sessions of that type', () => {
    expect(bestMetric([], 'typing', 'netWpm')).toBeNull();
    expect(latestMetric([], 'numpad', 'kph')).toBeNull();
  });
});

describe('forNumpadBest / isBeginnerNumpad', () => {
  const mixed = session('numpad', day(1), { kph: 8000, difficulty: 6 });
  const beginner = session('numpad', day(2), { kph: 14000, difficulty: 1 });
  const typing = session('typing', day(3), { netWpm: 40 });

  it('ignores beginner numpad runs for the best KPH', () => {
    expect(bestMetric(forNumpadBest([mixed, beginner, typing]), 'numpad', 'kph')).toBe(8000);
  });

  it('keeps other session types', () => {
    expect(forNumpadBest([mixed, beginner, typing])).toEqual([mixed, typing]);
  });

  it('spots beginner runs', () => {
    expect([mixed, beginner, typing].map(isBeginnerNumpad)).toEqual([false, true, false]);
  });
});

describe('currentStreak', () => {
  it('is 0 with no sessions', () => {
    expect(currentStreak([], day(10))).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const sessions = [day(8), day(9), day(10), day(10)].map((d) => session('typing', d, {}));
    expect(currentStreak(sessions, day(10))).toBe(3);
  });

  it('still counts yesterday if you have not practiced today', () => {
    const sessions = [day(8), day(9)].map((d) => session('typing', d, {}));
    expect(currentStreak(sessions, day(10))).toBe(2);
  });

  it('breaks on a missed day', () => {
    const sessions = [day(5), day(7), day(8)].map((d) => session('numpad', d, {}));
    expect(currentStreak(sessions, day(10))).toBe(0);
    expect(currentStreak(sessions, day(8))).toBe(2);
  });
});

describe('recentSessions', () => {
  it('returns newest first, limited', () => {
    const sessions = [1, 2, 3, 4].map((d) => session('typing', day(d), {}));
    expect(recentSessions(sessions, 2).map((s) => s.startedAt)).toEqual([
      day(4).toISOString(),
      day(3).toISOString(),
    ]);
  });
});

describe('greeting', () => {
  it('follows the time of day', () => {
    expect(greeting(new Date(2026, 8, 27, 8))).toBe('Magandang umaga');
    expect(greeting(new Date(2026, 8, 27, 12, 30))).toBe('Magandang tanghali');
    expect(greeting(new Date(2026, 8, 27, 15))).toBe('Magandang hapon');
    expect(greeting(new Date(2026, 8, 27, 20))).toBe('Magandang gabi');
  });
});
