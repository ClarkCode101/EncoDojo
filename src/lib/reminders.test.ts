import { describe, expect, it } from 'vitest';
import type { Session } from './storage';
import { backupStatusText, dailyGoalText, daysSinceBackup, doneToday, needsBackup } from './reminders';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h);
const session = (date: Date): Session => ({
  id: date.toISOString(),
  type: 'typing',
  startedAt: date.toISOString(),
  durationSec: 60,
  metrics: {},
  mistakes: [],
});

describe('backup reminder', () => {
  const now = at(2026, 9, 27, 9);

  it('counts calendar days since the last backup', () => {
    expect(daysSinceBackup(undefined, now)).toBeNull();
    expect(daysSinceBackup(at(2026, 9, 27, 8).toISOString(), now)).toBe(0);
    expect(daysSinceBackup(at(2026, 9, 26, 23).toISOString(), now)).toBe(1);
    expect(daysSinceBackup(at(2026, 9, 15).toISOString(), now)).toBe(12);
  });

  it('says it in plain words', () => {
    expect(backupStatusText(undefined, now)).toBe('Wala ka pang backup.');
    expect(backupStatusText(at(2026, 9, 27, 8).toISOString(), now)).toBe('Huling backup: ngayong araw.');
    expect(backupStatusText(at(2026, 9, 26).toISOString(), now)).toBe('Huling backup: kahapon.');
    expect(backupStatusText(at(2026, 9, 15).toISOString(), now)).toBe('Huling backup: 12 araw na ang nakalipas.');
  });

  it('reminds only with 5+ sessions and no backup for 7+ days', () => {
    const few = [session(now), session(now)];
    const many = Array.from({ length: 5 }, () => session(now));
    expect(needsBackup(undefined, few, now)).toBe(false);
    expect(needsBackup(undefined, many, now)).toBe(true);
    expect(needsBackup(at(2026, 9, 25).toISOString(), many, now)).toBe(false);
    expect(needsBackup(at(2026, 9, 20).toISOString(), many, now)).toBe(true);
  });
});

describe('daily goal', () => {
  it('counts only today (local day)', () => {
    const now = at(2026, 9, 27, 20);
    const sessions = [session(at(2026, 9, 27, 8)), session(at(2026, 9, 27, 19)), session(at(2026, 9, 26, 22))];
    expect(doneToday(sessions, now)).toBe(2);
  });

  it('shows progress, then "naabot mo na", and nothing without a goal', () => {
    expect(dailyGoalText(undefined, 2)).toBeNull();
    expect(dailyGoalText(0, 2)).toBeNull();
    expect(dailyGoalText(3, 2)).toBe('Ngayong araw: 2 sa 3 practice.');
    expect(dailyGoalText(3, 4)).toBe('Naabot mo na ang 3 practice ngayong araw.');
  });
});
