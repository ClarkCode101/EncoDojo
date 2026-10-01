import { describe, expect, it } from 'vitest';
import type { Session } from './storage';
import { backupStatusText, daysSinceBackup, needsBackup, notBackedUpSince, showBackupReminder } from './reminders';

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

describe('backup reminder on Home and on the Assessment report', () => {
  const now = at(2026, 10, 1, 9);
  const five = [1, 2, 3, 4, 5].map((d) => session(at(2026, 9, 20 + d)));

  it('Home: shows when a backup is needed, hides for a week after "Mamaya na"', () => {
    expect(showBackupReminder(undefined, five, undefined, now)).toBe(true);
    expect(showBackupReminder(undefined, five.slice(0, 2), undefined, now)).toBe(false); // too little to keep yet
    expect(showBackupReminder(at(2026, 9, 30).toISOString(), five, undefined, now)).toBe(false); // recent backup
    expect(showBackupReminder(undefined, five, at(2026, 10, 5).toISOString(), now)).toBe(false); // snoozed
    expect(showBackupReminder(undefined, five, at(2026, 9, 30).toISOString(), now)).toBe(true); // snooze over
  });

  it('Assessment report: until a backup is made after that assessment', () => {
    const assessment = session(at(2026, 9, 30, 14));
    expect(notBackedUpSince(undefined, assessment)).toBe(true);
    expect(notBackedUpSince(at(2026, 9, 30, 9).toISOString(), assessment)).toBe(true);
    expect(notBackedUpSince(at(2026, 9, 30, 15).toISOString(), assessment)).toBe(false);
  });
});
