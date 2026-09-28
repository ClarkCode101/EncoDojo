/**
 * The tasks of Excel Aralin 5, "Unang formulas": a formula with cell names
 * (=B2*C2), copying it down (Ctrl+D moves the references), SUM with AutoSum
 * (Alt+=), and AVERAGE / MAX / COUNT.
 *
 * The sheet is a fake order list (Item, Qty, Unit Price, Amount) with a Total
 * row and a small Summary block (F:G). Checks compute the formulas with
 * HyperFormula (formulaEngine.ts) and also require a formula (not a typed
 * number). Each task's `prepare` sets up exactly what it needs, so the tasks
 * work in any order (tested).
 */
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { computeSheet } from './formulaEngine';
import { cellName, isFormula, makeSheet, type Pos, type Sheet } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';

export const HEADERS_5 = ['Item', 'Qty', 'Unit Price', 'Amount', '', 'Summary', 'Value'];
const COL = { item: 0, qty: 1, price: 2, amount: 3, label: 5, value: 6 } as const;
const EXTRA_ROWS = 6;

/** The order list: 6 to 8 different office items with a quantity and a unit price; Amount is empty. */
export function makeTable5(rng: Rng): string[][] {
  const count = intBetween(rng, 6, 8);
  const items = shuffle(rng, ph.officeItems).slice(0, count);
  const rows: string[][] = [HEADERS_5];
  items.forEach(([name, , min, max], i) => {
    const price = `${intBetween(rng, min, max)}${pick(rng, ['', '', '.5', '.25'])}`;
    const row = [name[0].toUpperCase() + name.slice(1), String(intBetween(rng, 2, 30)), price, '', '', '', ''];
    // The Summary labels sit beside the first rows.
    if (i === 0) row[COL.label] = 'Average Qty';
    if (i === 1) row[COL.label] = 'Highest Price';
    if (i === 2) row[COL.label] = 'No. of Items';
    rows.push(row);
  });
  rows.push(['', '', 'Total', '', '', '', '']);
  return rows;
}

const key = (k: string, mods: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}): SolutionStep => ({
  press: { key: k, ...mods },
});
const typeFormula = (f: string): SolutionStep[] => [key('='), { type: f }, key('Enter')];

/** Set cells directly (a task's starting state, not an undo step). */
function setCells(s: Sheet, changes: [Pos, string][]): Sheet {
  const cells = s.cells.map((row) => [...row]);
  for (const [p, v] of changes) cells[p.r][p.c] = v;
  return { ...s, cells };
}

const near = (a: string, b: number) => a !== '' && Math.abs(Number(a) - b) < 0.005;

function allTasks5(table: string[][]): Record<string, ExcelTask> {
  const n = table.length - 2; // items are rows 1..n; the Total row is n+1
  const itemRows = Array.from({ length: n }, (_, i) => i + 1);
  const totalRow = n + 1;
  const qty = (r: number) => Number(table[r][COL.qty]);
  const price = (r: number) => Number(table[r][COL.price]);
  const amountFormula = (r: number) => `=B${r + 1}*C${r + 1}`;
  const last = n + 1; // Excel row number of the last item
  const at = (r: number, c: number): Pos => ({ r, c });
  const allAmounts = (s: Sheet) => setCells(s, itemRows.map((r) => [at(r, COL.amount), amountFormula(r)] as [Pos, string]));
  const computedAt = (s: Sheet, p: Pos) => computeSheet(s.cells)[p.r][p.c];
  const formulaWith = (s: Sheet, p: Pos, word: string) => isFormula(s.cells[p.r][p.c]) && s.cells[p.r][p.c].toUpperCase().includes(word);

  const tasks: ExcelTask[] = [
    {
      id: 'firstFormula',
      text: `Sa ${cellName(at(1, COL.amount))}, kuwentahin ang Amount: Qty × Unit Price, gamit ang pangalan ng mga cell.`,
      tip: '=B2*C2, tapos Enter',
      hint: 'Magsimula sa =. Ang * ay multiply. I-type ang =B2*C2 at Enter.',
      solution: typeFormula('=B2*C2'),
      start: at(1, COL.amount),
      prepare: (s) => setCells(s, [[at(1, COL.amount), '']]),
      check: (s) =>
        !s.editing &&
        formulaWith(s, at(1, COL.amount), 'B2') &&
        formulaWith(s, at(1, COL.amount), 'C2') &&
        near(computedAt(s, at(1, COL.amount)), qty(1) * price(1)),
      maxKeys: 1,
    },
    {
      id: 'fillFormula',
      text: `Kopyahin ang formula ng D2 pababa hanggang D${last}, para sa lahat ng item.`,
      tip: `Shift + ↓ hanggang D${last}, tapos Ctrl + D`,
      hint: `Nasa D2 ka. Shift + ↓ hanggang D${last} para mapili, tapos Ctrl + D para makopya pababa.`,
      solution: [...Array.from({ length: n - 1 }, () => key('ArrowDown', { shift: true })), key('d', { ctrl: true })],
      start: at(1, COL.amount),
      prepare: (s) =>
        setCells(s, [
          [at(1, COL.amount), amountFormula(1)],
          ...itemRows.slice(1).map((r) => [at(r, COL.amount), ''] as [Pos, string]),
        ]),
      check: (s) => {
        if (s.editing) return false;
        const values = computeSheet(s.cells);
        return itemRows.every((r) => isFormula(s.cells[r][COL.amount]) && near(values[r][COL.amount], qty(r) * price(r)));
      },
      maxKeys: n + 1,
    },
    {
      id: 'autoSum',
      text: `Sa ${cellName(at(totalRow, COL.amount))} (Total), kuwentahin ang kabuuan ng lahat ng Amount.`,
      tip: 'Alt + =, tapos Enter',
      hint: 'Alt at = nang sabay: AutoSum. Isusulat ng Excel ang =SUM(...) ng mga numero sa itaas. Enter lang.',
      solution: [key('=', { alt: true }), key('Enter')],
      start: at(totalRow, COL.amount),
      prepare: (s) => setCells(allAmounts(s), [[at(totalRow, COL.amount), '']]),
      check: (s) =>
        !s.editing &&
        formulaWith(s, at(totalRow, COL.amount), 'SUM') &&
        near(
          computedAt(s, at(totalRow, COL.amount)),
          itemRows.reduce((sum, r) => sum + qty(r) * price(r), 0),
        ),
      maxKeys: 2,
    },
    {
      id: 'average',
      text: `Sa ${cellName(at(1, COL.value))}, kuwentahin ang Average Qty: ang karaniwang Qty ng lahat ng item.`,
      tip: `=AVERAGE(B2:B${last}), tapos Enter`,
      hint: `=AVERAGE(unang cell:huling cell). Ang Qty ay mula B2 hanggang B${last}.`,
      solution: typeFormula(`=AVERAGE(B2:B${last})`),
      start: at(1, COL.value),
      prepare: (s) => setCells(s, [[at(1, COL.value), '']]),
      check: (s) =>
        !s.editing &&
        formulaWith(s, at(1, COL.value), 'AVERAGE') &&
        near(computedAt(s, at(1, COL.value)), itemRows.reduce((sum, r) => sum + qty(r), 0) / n),
      maxKeys: 1,
    },
    {
      id: 'max',
      text: `Sa ${cellName(at(2, COL.value))}, ilagay ang Highest Price: ang pinakamalaking Unit Price.`,
      tip: `=MAX(C2:C${last}), tapos Enter`,
      hint: `=MAX(unang cell:huling cell). Ang Unit Price ay mula C2 hanggang C${last}.`,
      solution: typeFormula(`=MAX(C2:C${last})`),
      start: at(2, COL.value),
      prepare: (s) => setCells(s, [[at(2, COL.value), '']]),
      check: (s) =>
        !s.editing &&
        formulaWith(s, at(2, COL.value), 'MAX') &&
        near(computedAt(s, at(2, COL.value)), Math.max(...itemRows.map(price))),
      maxKeys: 1,
    },
    {
      id: 'count',
      text: `Sa ${cellName(at(3, COL.value))}, bilangin kung ilan ang item (No. of Items).`,
      tip: `=COUNT(B2:B${last}), tapos Enter`,
      hint: `=COUNT(...) ang bumibilang ng mga cell na may numero. Gamitin ang Qty: B2 hanggang B${last}.`,
      solution: typeFormula(`=COUNT(B2:B${last})`),
      start: at(3, COL.value),
      prepare: (s) => setCells(s, [[at(3, COL.value), '']]),
      check: (s) =>
        !s.editing && formulaWith(s, at(3, COL.value), 'COUNT') && near(computedAt(s, at(3, COL.value)), n),
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((t) => [t.id, t]));
}

/** A new order list (Excel's number rules on) with one task of every Aralin 5 kind. */
export function makeTaskSet5(rng: Rng): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const table = makeTable5(rng);
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, HEADERS_5.length + 1, { formatting: true });
  return { sheet, tasks: allTasks5(table) };
}

/** The Aralin 5 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz5(rng: Rng): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet5(rng);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
