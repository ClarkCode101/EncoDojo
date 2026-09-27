/**
 * Scoring for Excel Practice (round 1: navigation and shortcuts).
 *
 * Each task ends one of three ways: done with the shortcut (few keys, no
 * mouse), done the long way (many keys or the mouse), or not done (skipped
 * or time ran out). Metrics (raw values):
 * - tasksTotal, tasksDone, tasksShortcut
 * - taskAccuracy (%): tasks done / all tasks
 * - shortcutRate (%): tasks done with the shortcut / all tasks
 * - avgSeconds: average time of the tasks that were done
 */
import { makeId, type Session, type SessionMistake } from '../../lib/storage';

export type TaskResult = {
  id: string;
  /** The shortcut that does it, e.g. "Ctrl + ↓" (shown when it was done the long way). */
  tip: string;
  done: boolean;
  /** Command keys pressed during the task (not the letters typed). */
  keys: number;
  usedMouse: boolean;
  /** true = done with at most the task's `maxKeys` and without the mouse. */
  shortcut: boolean;
  seconds: number;
};

export function scoreExcel(results: TaskResult[], tasksTotal: number) {
  const done = results.filter((r) => r.done);
  const tasksShortcut = done.filter((r) => r.shortcut).length;
  const mistakes: SessionMistake[] = [];
  results.forEach((r, i) => {
    if (r.done && r.shortcut) return;
    // expected = the shortcut; typed = what happened instead.
    let typed = 'Hindi natapos';
    if (r.done) typed = r.usedMouse ? 'Gumamit ng mouse' : `${r.keys} pindot`;
    mistakes.push({ expected: r.tip, typed, index: i + 1, field: r.id });
  });
  return {
    metrics: {
      tasksTotal,
      tasksDone: done.length,
      tasksShortcut,
      taskAccuracy: tasksTotal === 0 ? 0 : (done.length / tasksTotal) * 100,
      shortcutRate: tasksTotal === 0 ? 0 : (tasksShortcut / tasksTotal) * 100,
      avgSeconds: done.length === 0 ? 0 : done.reduce((sum, r) => sum + r.seconds, 0) / done.length,
    },
    mistakes,
  };
}

/** The finished round as a Session (type 'excel'). `level` 1 = navigation and shortcuts. */
export function buildExcelSession(
  results: TaskResult[],
  tasksTotal: number,
  elapsedSec: number,
  seconds: number,
  level = 1,
): Session {
  const { metrics, mistakes } = scoreExcel(results, tasksTotal);
  return {
    id: makeId(),
    type: 'excel',
    startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
    durationSec: elapsedSec,
    metrics: { ...metrics, seconds, level },
    mistakes,
  };
}
