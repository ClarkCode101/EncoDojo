/**
 * Small reminders from the Settings choices (owner's request, 2026-09-27):
 * the backup reminder (progress lives only in this browser, so a backup file
 * is the only way not to lose it). Used by Settings and Sensei. Pure functions,
 * tested. (The daily goal was removed with its setting, owner's choice 2026-10-01.)
 */
import { translator, type Lang } from './i18n';
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
export function backupStatusText(lastBackupAt: string | undefined, now: Date = new Date(), lang: Lang = 'tl'): string {
  const t = translator(lang);
  const days = daysSinceBackup(lastBackupAt, now);
  if (days === null) return t('Wala ka pang backup.', "You don't have a backup yet.");
  if (days === 0) return t('Huling backup: ngayong araw.', 'Last backup: today.');
  if (days === 1) return t('Huling backup: kahapon.', 'Last backup: yesterday.');
  return t(`Huling backup: ${days} araw na ang nakalipas.`, `Last backup: ${days} days ago.`);
}

/** True when it's time to remind: enough saved results and no backup for a week (or never). */
export function needsBackup(lastBackupAt: string | undefined, sessions: Session[], now: Date = new Date()): boolean {
  if (sessions.length < BACKUP_REMIND_MIN_SESSIONS) return false;
  const days = daysSinceBackup(lastBackupAt, now);
  return days === null || days >= BACKUP_REMIND_DAYS;
}
