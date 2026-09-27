/**
 * Scoring for the Excel Pagsusulit (the quiz at the end of a lesson).
 *
 * Each task ends one of three ways: done with the shortcut (few keys, no
 * mouse), done the long way (many keys or the mouse), or not done (skipped
 * or not finished). Metrics (raw values):
 * - tasksTotal, tasksDone, tasksShortcut
 * - taskAccuracy (%): tasks done / all tasks
 * - shortcutRate (%): tasks done with the shortcut / all tasks
 * - avgSeconds: average time of the tasks that were done
 * - passed (0/1): at least QUIZ_PASS tasks done (no timer, and the shortcut is
 *   not required: this is learning; the shortcut is only shown as a tip)
 */
import { makeId, type Session, type SessionMistake } from '../../lib/storage';
import { QUIZ_PASS } from './tasks';

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

/** The finished Pagsusulit as a Session (type 'excel'). `level` = the lesson (1 = navigation and shortcuts). */
export function buildExcelSession(results: TaskResult[], tasksTotal: number, elapsedSec: number, level = 1): Session {
  const { metrics, mistakes } = scoreExcel(results, tasksTotal);
  return {
    id: makeId(),
    type: 'excel',
    startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
    durationSec: elapsedSec,
    metrics: { ...metrics, level, passed: metrics.tasksDone >= QUIZ_PASS ? 1 : 0 },
    mistakes,
  };
}
