import { describe, expect, it } from 'vitest';
import { makeRng } from '../../lib/random';
import { buildExcelSession, scoreExcel, type TaskResult } from './scoreExcel';
import { pressKey, typeInCell, type KeyPress, type Sheet } from './sheet';
import { HEADERS, TASKS_PER_ROUND, makeRound, startTask, type ExcelTask } from './tasks';

/** How a user who knows the shortcut does each task (command keys only; text goes through typeInCell). */
function solve(s: Sheet, task: ExcelTask): { sheet: Sheet; keys: number } {
  let keys = 0;
  const press = (k: KeyPress) => {
    keys++;
    s = pressKey(s, k);
  };
  const quoted = () => /"([^"]+)"/.exec(task.text)?.[1] ?? '';
  switch (task.id) {
    case 'lastRow':
      press({ key: 'ArrowDown', ctrl: true });
      break;
    case 'home':
      press({ key: 'Home', ctrl: true });
      break;
    case 'lastCell':
      press({ key: 'End', ctrl: true });
      break;
    case 'rowEnd':
      press({ key: 'ArrowRight', ctrl: true });
      break;
    case 'rowStart':
      press({ key: 'Home' });
      break;
    case 'selectColumn':
      press({ key: 'ArrowDown', ctrl: true, shift: true });
      break;
    case 'selectAll':
      press({ key: 'a', ctrl: true });
      break;
    case 'edit':
    case 'fix':
      press({ key: 'F2' });
      s = typeInCell(s, quoted());
      press({ key: 'Enter' });
      break;
    case 'clear':
      press({ key: 'Delete' });
      break;
    case 'copy':
      press({ key: 'c', ctrl: true });
      press({ key: 'ArrowDown' });
      press({ key: 'v', ctrl: true });
      break;
    case 'undo':
      press({ key: 'z', ctrl: true });
      break;
    default:
      throw new Error(`no solution for ${task.id}`);
  }
  return { sheet: s, keys };
}

describe('Excel round', () => {
  it('has a header row, 18-26 records and 8 different tasks', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const round = makeRound(makeRng(seed));
      expect(round.sheet.cells[0].slice(0, 5)).toEqual(HEADERS);
      expect(round.lastRow).toBeGreaterThanOrEqual(18);
      expect(round.lastRow).toBeLessThanOrEqual(26);
      expect(new Set(round.tasks.map((t) => t.id)).size).toBe(TASKS_PER_ROUND);
    }
  });

  it('every task starts NOT done and is done with its shortcut (within maxKeys), in any order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const round = makeRound(makeRng(seed));
      let sheet = round.sheet;
      for (const task of round.tasks) {
        sheet = startTask(sheet, task);
        expect(task.check(sheet), `${task.id} already done (seed ${seed})`).toBe(false);
        const { sheet: after, keys } = solve(sheet, task);
        expect(task.check(after), `${task.id} not done by its shortcut (seed ${seed})`).toBe(true);
        expect(keys).toBeLessThanOrEqual(task.maxKeys);
        sheet = after;
      }
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
    expect(metrics).toMatchObject({ tasksTotal: 8, tasksDone: 3, tasksShortcut: 1, taskAccuracy: 37.5, shortcutRate: 12.5 });
    expect(metrics.avgSeconds).toBeCloseTo(7);
    expect(mistakes.map((m) => m.typed)).toEqual(['9 pindot', 'Gumamit ng mouse', 'Hindi natapos']);
    expect(mistakes[0]).toMatchObject({ expected: 'Ctrl + Home', index: 2, field: 'home' });
  });

  it('nothing done: zeros, never NaN', () => {
    const { metrics } = scoreExcel([], 8);
    expect(metrics).toMatchObject({ tasksDone: 0, taskAccuracy: 0, shortcutRate: 0, avgSeconds: 0 });
  });

  it('builds an excel session', () => {
    const s = buildExcelSession([r({})], 8, 30, 180);
    expect(s.type).toBe('excel');
    expect(s.metrics).toMatchObject({ seconds: 180, level: 1, tasksDone: 1 });
  });
});
