import type { Session, SessionType } from '../../lib/storage';

function ofType(sessions: Session[], type: SessionType): Session[] {
  return sessions.filter((s) => s.type === type);
}

/** Highest value of one metric, or null if there are no sessions yet. */
export function bestMetric(sessions: Session[], type: SessionType, metric: string): number | null {
  const values = ofType(sessions, type)
    .map((s) => s.metrics[metric])
    .filter((v): v is number => typeof v === 'number');
  return values.length ? Math.max(...values) : null;
}

/** Metric from the most recent session of that type, or null. */
export function latestMetric(sessions: Session[], type: SessionType, metric: string): number | null {
  const list = ofType(sessions, type);
  if (!list.length) return null;
  const latest = list.reduce((a, b) => (a.startedAt >= b.startedAt ? a : b));
  return latest.metrics[metric] ?? null;
}

/** Local calendar day as "YYYY-MM-DD" (so a session at 11pm counts for today). */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Number of days in a row (counting back from today) with at least one session.
 * If you have not practiced yet today, the streak from yesterday still counts,
 * so it does not reset to 0 first thing in the morning.
 */
export function currentStreak(sessions: Session[], today: Date = new Date()): number {
  const days = new Set(sessions.map((s) => localDayKey(new Date(s.startedAt))));

  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Newest first. */
export function recentSessions(sessions: Session[], count = 10): Session[] {
  return [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, count);
}
