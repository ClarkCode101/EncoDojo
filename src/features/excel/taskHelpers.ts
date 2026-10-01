/**
 * Small helpers shared by the Excel lessons' task files (tasks.ts, tasks2.ts ... tasks14.ts).
 * They used to be copied into each file (refactor 2026-10-01, no change in behavior).
 */
import { intBetween, pick, type Rng } from '../../lib/random';
import { digits } from '../typing/generatePassage';
import type { Pos, Sheet } from './sheet';
import type { SolutionStep } from './tasks';

/** One key of a solution, e.g. key('d', { ctrl: true }) = Ctrl + D. */
export const key = (k: string, mods: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}): SolutionStep => ({
  press: { key: k, ...mods },
});

/** Type a whole value into a cell: its first character starts the edit, then the rest. */
export const typeValue = (value: string): SolutionStep[] => [key(value[0]), { type: value }];

/** Type a formula into the active cell and save it with Enter. */
export const typeFormula = (f: string): SolutionStep[] => [key('='), { type: f }, key('Enter')];

/** Set cells directly (a task's starting state, not an undo step). */
export function setCells(s: Sheet, changes: [Pos, string][]): Sheet {
  const cells = s.cells.map((row) => [...row]);
  for (const [p, v] of changes) cells[p.r][p.c] = v;
  return { ...s, cells };
}

/** A computed number equal to `b` (to the centavo); '' (empty) never is. */
export const near = (a: string, b: number) => a !== '' && Math.abs(Number(a) - b) < 0.005;

/** A sales amount as typed in the sales logs, e.g. "12450.75". */
export function amount(rng: Rng): string {
  return `${intBetween(rng, 150, 25000)}.${pick(rng, ['00', '50', '25', '75', digits(rng, 2)])}`;
}

/** A 2026 date in mm/dd/yyyy (day 1-28, so every month is fine). */
export function date(rng: Rng): string {
  return `${String(intBetween(rng, 1, 12)).padStart(2, '0')}/${String(intBetween(rng, 1, 28)).padStart(2, '0')}/2026`;
}
