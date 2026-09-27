import { describe, expect, it } from 'vitest';
import { makeRng } from '../../lib/random';
import type { Session } from '../../lib/storage';
import { LESSON_1 } from './lesson1';
import { passedLessons } from './lessons';
import { buildExcelSession, scoreExcel, type TaskResult } from './scoreExcel';
import { isTypingKey, type Sheet } from './sheet';
import {
  HEADERS,
  QUIZ_TASKS,
  TASK_LABEL,
  makeQuiz,
  makeTaskSet,
  solutionFrames,
  startTask,
  type ExcelTask,
} from './tasks';

/** Do a task with its own solution: the final sheet and the command keys it took. */
function solve(s: Sheet, task: ExcelTask): { sheet: Sheet; keys: number } {
  const frames = solutionFrames(s, task);
  const keys = task.solution.filter((step) => 'press' in step && !isTypingKey(step.press)).length;
  return { sheet: frames[frames.length - 1], keys };
}

/** Start each task in turn, check it is not done yet, solve it, check it is done (within maxKeys). */
function runAll(sheet: Sheet, tasks: ExcelTask[], seed: number) {
  for (const task of tasks) {
    sheet = startTask(sheet, task);
    expect(task.check(sheet), `${task.id} already done (seed ${seed})`).toBe(false);
    const { sheet: after, keys } = solve(sheet, task);
    expect(task.check(after), `${task.id} not done by its solution (seed ${seed})`).toBe(true);
    expect(keys, `${task.id} solution uses too many keys`).toBeLessThanOrEqual(task.maxKeys);
    sheet = after;
  }
}

describe('Excel tasks', () => {
  it('the sheet has a header row and 18-26 records; every task kind has a label', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const set = makeTaskSet(makeRng(seed));
      expect(set.sheet.cells[0].slice(0, 5)).toEqual(HEADERS);
      expect(set.lastRow).toBeGreaterThanOrEqual(18);
      expect(set.lastRow).toBeLessThanOrEqual(26);
      expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL).sort());
    }
  });

  it('the lesson: the tasks of every topic, in order, start not done and are done by their solution', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = makeTaskSet(makeRng(seed));
      runAll(
        set.sheet,
        LESSON_1.flatMap((t) => t.tasks.map((id) => set.tasks[id])),
        seed,
      );
    }
  });

  it('the lesson teaches every task kind once', () => {
    expect(LESSON_1.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL).sort());
  });

  it('the Pagsusulit: 6 different tasks (no "go to"), all doable in any order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const quiz = makeQuiz(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      expect(new Set(quiz.tasks.map((t) => t.id)).size).toBe(QUIZ_TASKS);
      expect(quiz.tasks.some((t) => t.id === 'goto')).toBe(false);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });
});

describe('scoreExcel', () => {
  const r = (over: Partial<TaskResult>): TaskResult => ({
    id: 'lastRow',
    tip: 'Ctrl + ↓',
    done: true,
    keys: 1,
    usedMouse: false,
    shortcut: true,
    seconds: 4,
    ...over,
  });

  it('counts done, done with the shortcut, and lists the rest', () => {
    const { metrics, mistakes } = scoreExcel(
      [
        r({}),
        r({ id: 'home', tip: 'Ctrl + Home', keys: 9, shortcut: false, seconds: 10 }),
        r({ id: 'clear', tip: 'Delete', usedMouse: true, shortcut: false, seconds: 7 }),
        r({ id: 'copy', done: false, shortcut: false }),
      ],
      8,
    );
    expect(metrics).toMatchObject({
      tasksTotal: 8,
      tasksDone: 3,
      tasksShortcut: 1,
      taskAccuracy: 37.5,
      shortcutRate: 12.5,
    });
    expect(metrics.avgSeconds).toBeCloseTo(7);
    expect(mistakes.map((m) => m.typed)).toEqual(['9 pindot', 'Gumamit ng mouse', 'Hindi natapos']);
    expect(mistakes[0]).toMatchObject({ expected: 'Ctrl + Home', index: 2, field: 'home' });
  });

  it('nothing done: zeros, never NaN', () => {
    const { metrics } = scoreExcel([], 8);
    expect(metrics).toMatchObject({ tasksDone: 0, taskAccuracy: 0, shortcutRate: 0, avgSeconds: 0 });
  });

  it('builds an excel session; passed = at least 5 of 6 done', () => {
    const s = buildExcelSession([r({})], 6, 30);
    expect(s.type).toBe('excel');
    expect(s.metrics).toMatchObject({ level: 1, tasksDone: 1, passed: 0 });
    const five = Array.from({ length: 5 }, () => r({}));
    expect(buildExcelSession([...five, r({ done: false, shortcut: false })], 6, 60).metrics.passed).toBe(1);
  });
});

describe('lessons', () => {
  const round = (taskAccuracy: number, shortcutRate: number, level?: number): Session => ({
    id: `x${taskAccuracy}${shortcutRate}`,
    type: 'excel',
    startedAt: '2026-09-27T01:00:00.000Z',
    durationSec: 60,
    metrics: { taskAccuracy, shortcutRate, ...(level ? { level } : {}) },
    mistakes: [],
  });

  it('a Pagsusulit counts by its own "passed"', () => {
    const quiz = (passed: number): Session => ({
      ...round(50, 0),
      metrics: { taskAccuracy: 50, shortcutRate: 0, passed, level: 1 },
    });
    expect(passedLessons([quiz(0)]).has(1)).toBe(false);
    expect(passedLessons([quiz(1)]).has(1)).toBe(true);
  });

  it('older timed rounds (no "passed"): passed when both targets were reached', () => {
    expect(passedLessons([round(100, 50)]).has(1)).toBe(false);
    expect(passedLessons([round(100, 50), round(87.5, 75)]).has(1)).toBe(true);
    expect(passedLessons([round(100, 100, 2)]).has(2)).toBe(true);
  });
});
