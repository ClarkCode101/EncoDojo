/**
 * Small reminders from the Settings choices (owner's request, 2026-09-27):
 * - the backup reminder (progress lives only in this browser, so a backup
 *   file is the only way not to lose it),
 * - the daily goal ("3 practice bawat araw").
 * Used by Settings, Sensei, and the sidebar. Pure functions, tested.
 */
import { localDayKey } from '../features/dashboard/stats';
import type { Session } from './storage';

/** Remind after this many days without a backup... */
export const BACKUP_REMIND_DAYS = 7;
/** ...but only once there is something worth keeping. */
export const BACKUP_REMIND_MIN_SESSIONS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since the last backup (0 = today), or null if there was never one. */
export function daysSinceBackup(lastBackupAt: string | undefined, now: Date = new Date()): number | null {
  if (!lastBackupAt) return null;
  const then = new Date(lastBackupAt);
  if (Number.isNaN(then.getTime())) return null;
  // Count calendar days, so "yesterday 11 PM" is 1 day ago even at 1 AM.
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((b - a) / DAY_MS));
}

/** "Huling backup: ..." in plain Taglish. */
export function backupStatusText(lastBackupAt: string | undefined, now: Date = new Date()): string {
  const days = daysSinceBackup(lastBackupAt, now);
  if (days === null) return 'Wala ka pang backup.';
  if (days === 0) return 'Huling backup: ngayong araw.';
  if (days === 1) return 'Huling backup: kahapon.';
  return `Huling backup: ${days} araw na ang nakalipas.`;
}

/** True when it's time to remind: enough saved results and no backup for a week (or never). */
export function needsBackup(lastBackupAt: string | undefined, sessions: Session[], now: Date = new Date()): boolean {
  if (sessions.length < BACKUP_REMIND_MIN_SESSIONS) return false;
  const days = daysSinceBackup(lastBackupAt, now);
  return days === null || days >= BACKUP_REMIND_DAYS;
}

/** How many saved sessions (practices and assessments) were done today (local day). */
export function doneToday(sessions: Session[], now: Date = new Date()): number {
  const today = localDayKey(now);
  return sessions.filter((s) => localDayKey(new Date(s.startedAt)) === today).length;
}

/** The daily goal line, e.g. "Ngayong araw: 2 sa 3 practice". Null when there is no goal. */
export function dailyGoalText(goal: number | undefined, done: number): string | null {
  if (!goal) return null;
  if (done >= goal) return `Naabot mo na ang ${goal} practice ngayong araw.`;
  return `Ngayong araw: ${done} sa ${goal} practice.`;
}
