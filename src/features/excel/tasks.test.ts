import { describe, expect, it } from 'vitest';
import { makeRng } from '../../lib/random';
import type { Session } from '../../lib/storage';
import { LESSON_1 } from './lesson1';
import { LESSON_2 } from './lesson2';
import { LESSONS, passedLessons } from './lessons';
import { buildExcelSession, scoreExcel, type TaskResult } from './scoreExcel';
import { isTypingKey, pressKey, type Sheet } from './sheet';
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
import { HEADERS_2, TASK_LABEL_2, makeQuiz2, makeTaskSet2 } from './tasks2';
import { HEADERS_3, TASK_LABEL_3, makeQuiz3, makeTaskSet3 } from './tasks3';
import { LESSON_3 } from './lesson3';
import { alignsRight, displayValue, formatOf } from './sheet';

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

describe('Excel Aralin 2 tasks', () => {
  it('the sheet has a Status column with blank stretches; every task kind has a label', () => {
    const set = makeTaskSet2(makeRng(1));
    expect(set.sheet.cells[0].slice(0, 6)).toEqual(HEADERS_2);
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_2).sort());
    expect(LESSON_2.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_2).sort());
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = makeTaskSet2(makeRng(seed));
      runAll(set.sheet, LESSON_2.flatMap((t) => t.tasks.map((id) => set.tasks[id])), seed);
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const quiz = makeQuiz2(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  it('every ready lesson has content for all its topics', () => {
    for (const l of LESSONS.filter((x) => x.content)) {
      const set = l.content!.makeSet(makeRng(3));
      for (const id of l.content!.topics.flatMap((t) => t.tasks)) expect(set.tasks[id], `${l.level}: ${id}`).toBeDefined();
    }
  });
});

describe('Excel Aralin 3 tasks', () => {
  it('the payroll sheet: text Emp No. and Account No. keep their zeros; rates are numbers', () => {
    const set = makeTaskSet3(makeRng(1));
    expect(set.sheet.cells[0].slice(0, 5)).toEqual(HEADERS_3);
    expect(set.sheet.cells[1][0]).toMatch(/^00\d{3}$/);
    expect(formatOf(set.sheet, { r: 1, c: 0 }).text).toBe(true);
    expect(alignsRight(set.sheet, { r: 1, c: 4 })).toBe(true);
    expect(displayValue(set.sheet, { r: 1, c: 4 })).not.toContain(',');
    expect(Object.keys(set.tasks).sort()).toEqual(Object.keys(TASK_LABEL_3).sort());
    expect(LESSON_3.flatMap((t) => t.tasks).sort()).toEqual(Object.keys(TASK_LABEL_3).sort());
  });

  it('the lesson order: every task starts not done and is done by its solution', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const set = makeTaskSet3(makeRng(seed));
      runAll(set.sheet, LESSON_3.flatMap((t) => t.tasks.map((id) => set.tasks[id])), seed);
    }
  });

  it('the Pagsusulit: all 6 kinds, doable in any order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const quiz = makeQuiz3(makeRng(seed));
      expect(quiz.tasks).toHaveLength(QUIZ_TASKS);
      runAll(quiz.sheet, quiz.tasks, seed);
    }
  });

  it('typing the zeros without the apostrophe does NOT finish the task (Excel drops them)', () => {
    const set = makeTaskSet3(makeRng(5));
    const task = set.tasks.leadingZero;
    let s = startTask(set.sheet, task);
    const value = /: (00\d{3})\./.exec(task.text)![1];
    s = pressKey({ ...s, editing: { value, mode: 'enter' } }, { key: 'Enter' });
    expect(task.check(s)).toBe(false);
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
