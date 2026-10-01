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
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { computeSheet } from './formulaEngine';
import { cellName, isFormula, makeSheet, type Pos, type Sheet } from './sheet';
import type { ExcelTask } from './tasks';
import { key, near, setCells, typeFormula } from './taskHelpers';

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

function allTasks5(table: string[][], t: T): Record<string, ExcelTask> {
  const n = table.length - 2; // items are rows 1..n; the Total row is n+1
  const itemRows = Array.from({ length: n }, (_, i) => i + 1);
  const totalRow = n + 1;
  const qty = (r: number) => Number(table[r][COL.qty]);
  const price = (r: number) => Number(table[r][COL.price]);
  const amountFormula = (r: number) => `=B${r + 1}*C${r + 1}`;
  const last = n + 1; // Excel row number of the last item
  const at = (r: number, c: number): Pos => ({ r, c });
  const allAmounts = (s: Sheet) =>
    setCells(
      s,
      itemRows.map((r) => [at(r, COL.amount), amountFormula(r)] as [Pos, string]),
    );
  const computedAt = (s: Sheet, p: Pos) => computeSheet(s.cells)[p.r][p.c];
  const formulaWith = (s: Sheet, p: Pos, word: string) =>
    isFormula(s.cells[p.r][p.c]) && s.cells[p.r][p.c].toUpperCase().includes(word);

  const tasks: ExcelTask[] = [
    {
      id: 'firstFormula',
      text: t(
        `Sa ${cellName(at(1, COL.amount))}, kuwentahin ang Amount: Qty × Unit Price, gamit ang pangalan ng mga cell.`,
        `In ${cellName(at(1, COL.amount))}, work out the Amount: Qty × Unit Price, using the cell names.`,
      ),
      tip: t('=B2*C2, tapos Enter', '=B2*C2, then Enter'),
      hint: t(
        'Magsimula sa =. Ang * ay multiply. I-type ang =B2*C2 at Enter.',
        'Start with =. The * means multiply. Type =B2*C2 and Enter.',
      ),
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
      text: t(
        `Kopyahin ang formula ng D2 pababa hanggang D${last}, para sa lahat ng item.`,
        `Copy the formula in D2 down to D${last}, for every item.`,
      ),
      tip: t(`Shift + ↓ hanggang D${last}, tapos Ctrl + D`, `Shift + ↓ to D${last}, then Ctrl + D`),
      hint: t(
        `Nasa D2 ka. Shift + ↓ hanggang D${last} para mapili, tapos Ctrl + D para makopya pababa.`,
        `You are in D2. Shift + ↓ to D${last} to select, then Ctrl + D to copy down.`,
      ),
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
        return itemRows.every(
          (r) => isFormula(s.cells[r][COL.amount]) && near(values[r][COL.amount], qty(r) * price(r)),
        );
      },
      maxKeys: n + 1,
    },
    {
      id: 'autoSum',
      text: t(
        `Sa ${cellName(at(totalRow, COL.amount))} (Total), kuwentahin ang kabuuan ng lahat ng Amount.`,
        `In ${cellName(at(totalRow, COL.amount))} (Total), work out the total of all the Amounts.`,
      ),
      tip: t('Alt + =, tapos Enter', 'Alt + =, then Enter'),
      hint: t(
        'Alt at = nang sabay: AutoSum. Isusulat ng Excel ang =SUM(...) ng mga numero sa itaas. Enter lang.',
        'Alt and = together: AutoSum. Excel writes the =SUM(...) of the numbers above. Just Enter.',
      ),
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
      text: t(
        `Sa ${cellName(at(1, COL.value))}, kuwentahin ang Average Qty: ang karaniwang Qty ng lahat ng item.`,
        `In ${cellName(at(1, COL.value))}, work out the Average Qty: the average Qty of all the items.`,
      ),
      tip: t(`=AVERAGE(B2:B${last}), tapos Enter`, `=AVERAGE(B2:B${last}), then Enter`),
      hint: t(
        `=AVERAGE(unang cell:huling cell). Ang Qty ay mula B2 hanggang B${last}.`,
        `=AVERAGE(first cell:last cell). The Qty is from B2 to B${last}.`,
      ),
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
      text: t(
        `Sa ${cellName(at(2, COL.value))}, ilagay ang Highest Price: ang pinakamalaking Unit Price.`,
        `In ${cellName(at(2, COL.value))}, put the Highest Price: the largest Unit Price.`,
      ),
      tip: t(`=MAX(C2:C${last}), tapos Enter`, `=MAX(C2:C${last}), then Enter`),
      hint: t(
        `=MAX(unang cell:huling cell). Ang Unit Price ay mula C2 hanggang C${last}.`,
        `=MAX(first cell:last cell). The Unit Price is from C2 to C${last}.`,
      ),
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
      text: t(
        `Sa ${cellName(at(3, COL.value))}, bilangin kung ilan ang item (No. of Items).`,
        `In ${cellName(at(3, COL.value))}, count how many items there are (No. of Items).`,
      ),
      tip: t(`=COUNT(B2:B${last}), tapos Enter`, `=COUNT(B2:B${last}), then Enter`),
      hint: t(
        `=COUNT(...) ang bumibilang ng mga cell na may numero. Gamitin ang Qty: B2 hanggang B${last}.`,
        `=COUNT(...) counts the cells that have a number. Use the Qty: B2 to B${last}.`,
      ),
      solution: typeFormula(`=COUNT(B2:B${last})`),
      start: at(3, COL.value),
      prepare: (s) => setCells(s, [[at(3, COL.value), '']]),
      check: (s) => !s.editing && formulaWith(s, at(3, COL.value), 'COUNT') && near(computedAt(s, at(3, COL.value)), n),
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new order list (Excel's number rules on) with one task of every Aralin 5 kind. */
export function makeTaskSet5(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const table = makeTable5(rng);
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, HEADERS_5.length + 1, { formatting: true });
  return { sheet, tasks: allTasks5(table, translator(lang)) };
}

/** The Aralin 5 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz5(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet5(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
