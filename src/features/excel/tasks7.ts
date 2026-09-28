/**
 * The tasks of Excel Aralin 7, "VLOOKUP": looking a code up in a price list
 * (VLOOKUP ... FALSE), fixing the list with $ so the formula can be copied
 * down, #N/A and IFERROR when a code is not in the list, and XLOOKUP (newer
 * Excel and Google Sheets), also with its own "Not found".
 *
 * The sheet: an order list on the left (Code, Qty, Item, Price; Item and Price
 * empty) and the Price List on the right (F:H). One order has a code that is
 * NOT in the list (a typo, like at work), so it gives #N/A. Like Aralin 5-6,
 * checks compute with HyperFormula and require a formula; they also probe it
 * on a copy of the sheet (another code, or the formula copied down), so a
 * formula that is only right for one cell does not pass. Each task's
 * `prepare` sets up what it needs, so the tasks work in any order (tested).
 */
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { computeSheet } from './formulaEngine';
import { cellName, isFormula, makeSheet, shiftFormula, type Pos, type Sheet } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';

export const HEADERS_7 = ['Code', 'Qty', 'Item', 'Price', '', 'Code', 'Item', 'Price'];
const COL = { code: 0, qty: 1, item: 2, price: 3, listCode: 5, listItem: 6, listPrice: 7 } as const;
const EXTRA_ROWS = 6;
export const NOT_FOUND = 'Not found';

export type Table7 = {
  table: string[][];
  /** The price list: code -> [item, price]. */
  list: Map<string, [string, string]>;
  /** The sheet row (0-based) of the order whose code is not in the list. */
  badRow: number;
};

/**
 * The order list (8 to 10 orders) and the price list (6 to 8 items, codes
 * OS-101 to OS-120 in random order). Every order code is in the list, except
 * the one on `badRow` (row 4 or lower, never row 2 or 3).
 */
export function makeTable7(rng: Rng): Table7 {
  const codes = shuffle(
    rng,
    Array.from({ length: 20 }, (_, i) => `OS-${101 + i}`),
  );
  const items = shuffle(rng, ph.officeItems).slice(0, intBetween(rng, 6, 8));
  const list = new Map<string, [string, string]>(
    items.map(([name, , min, max], i) => [
      codes[i],
      [name[0].toUpperCase() + name.slice(1), `${intBetween(rng, min, max)}${pick(rng, ['', '', '.5', '.75'])}`],
    ]),
  );
  const listCodes = [...list.keys()];
  const n = intBetween(rng, 8, 10);
  const badRow = intBetween(rng, 3, n);
  const rows: string[][] = [HEADERS_7];
  for (let r = 1; r <= n; r++) {
    const code = r === badRow ? codes[19] : pick(rng, listCodes); // codes[19] is never in the list
    rows.push([code, String(intBetween(rng, 1, 20)), '', '', '', '', '', '']);
  }
  // The price list sits beside the orders (it is shorter or as long).
  listCodes.forEach((code, i) => {
    const [item, price] = list.get(code)!;
    rows[i + 1][COL.listCode] = code;
    rows[i + 1][COL.listItem] = item;
    rows[i + 1][COL.listPrice] = price;
  });
  return { table: rows, list, badRow };
}

const key = (k: string, mods: { ctrl?: boolean; shift?: boolean } = {}): SolutionStep => ({
  press: { key: k, ...mods },
});
const typeFormula = (f: string): SolutionStep[] => [key('='), { type: f }, key('Enter')];

/** Set cells directly (a task's starting state, not an undo step). */
function setCells(s: Sheet, changes: [Pos, string][]): Sheet {
  const cells = s.cells.map((row) => [...row]);
  for (const [p, v] of changes) cells[p.r][p.c] = v;
  return { ...s, cells };
}

/** The computed sheet after changing some cells on a copy (the real sheet is untouched). */
const probe = (s: Sheet, changes: [Pos, string][]) => computeSheet(setCells(s, changes).cells);

const same = (a: string, b: string) => a.trim().toLowerCase() === b.toLowerCase();
const sameNumber = (a: string, b: string) => a !== '' && Math.abs(Number(a) - Number(b)) < 0.005;

function allTasks7({ table, list, badRow }: Table7): Record<string, ExcelTask> {
  const n = table.length - 1; // orders are rows 1..n
  const rows = Array.from({ length: n }, (_, i) => i + 1);
  const last = n + 1; // Excel row number of the last order
  const L = list.size + 1; // Excel row number of the last list item
  const at = (r: number, c: number): Pos => ({ r, c });
  const code = (r: number) => table[r][COL.code];
  const itemOf = (c: string) => list.get(c)?.[0] ?? '#N/A';
  const priceOf = (c: string) => list.get(c)?.[1] ?? '#N/A';
  const listRange = `$F$2:$H$${L}`;
  const itemFormula = (r: number) => `=VLOOKUP(A${r + 1},${listRange},2,FALSE)`;
  const priceFormula = (r: number) => `=VLOOKUP(A${r + 1},${listRange},3,FALSE)`;
  const cellHas = (s: Sheet, p: Pos, ...words: string[]) =>
    isFormula(s.cells[p.r][p.c]) && words.every((w) => s.cells[p.r][p.c].toUpperCase().includes(w));
  /** Another code from the list than the one on row r (for the probes). */
  const otherCode = (r: number) => [...list.keys()].find((c) => c !== code(r))!;
  const badCode = code(badRow);
  const c2 = at(1, COL.item);
  const d2 = at(1, COL.price);
  const c3 = at(2, COL.item);
  const cBad = at(badRow, COL.item);
  const aOf = (r: number) => at(r, COL.code);

  /** The Item cell on row r is right, and follows the code when it changes (probe). */
  const itemFollows = (s: Sheet, r: number, expected: string) => {
    const other = otherCode(r);
    return (
      same(computeSheet(s.cells)[r][COL.item], expected) &&
      same(probe(s, [[aOf(r), other]])[r][COL.item], itemOf(other))
    );
  };

  const tasks: ExcelTask[] = [
    {
      id: 'vlookupItem',
      text: `Sa ${cellName(c2)}, hanapin ang Item ng code sa A2 mula sa Price List (F hanggang H).`,
      tip: `=VLOOKUP(A2,F2:H${L},2,FALSE), tapos Enter`,
      hint: `=VLOOKUP(ano ang hahanapin, ang listahan, pang-ilang column, FALSE). Hahanapin: A2. Listahan: F2:H${L}. Ang Item ay pang-2 column ng listahan.`,
      solution: typeFormula(`=VLOOKUP(A2,F2:H${L},2,FALSE)`),
      start: c2,
      prepare: (s) => setCells(s, [[c2, '']]),
      check: (s) => !s.editing && cellHas(s, c2, 'VLOOKUP') && itemFollows(s, 1, itemOf(code(1))),
      maxKeys: 1,
    },
    {
      id: 'vlookupPrice',
      text: `Sa ${cellName(d2)}, hanapin ang Price ng code sa A2. Lagyan ng $ ang listahan para puwedeng kopyahin pababa.`,
      tip: `=VLOOKUP(A2,${listRange},3,FALSE), tapos Enter`,
      hint: `Gaya ng Item, pero pang-3 column ang Price. Isulat ang listahan na $F$2:$H$${L} para hindi ito gumalaw kapag kinopya.`,
      solution: typeFormula(priceFormula(1)),
      start: d2,
      prepare: (s) => setCells(s, [[d2, '']]),
      check: (s) => {
        if (s.editing || !cellHas(s, d2, 'VLOOKUP')) return false;
        // Copy it down on a copy of the sheet: every row must get its own price.
        const f = s.cells[d2.r][d2.c];
        const copied = probe(
          s,
          rows.map((r) => [at(r, COL.price), shiftFormula(f, r - 1, 0)] as [Pos, string]),
        );
        return rows.every((r) =>
          r === badRow ? copied[r][COL.price] === '#N/A' : sameNumber(copied[r][COL.price], priceOf(code(r))),
        );
      },
      maxKeys: 1,
    },
    {
      id: 'fillPrice',
      text: `Kopyahin ang formula ng D2 pababa hanggang D${last}, para may Price ang bawat order.`,
      tip: `Shift + ↓ hanggang D${last}, tapos Ctrl + D`,
      hint: `Nasa D2 ka. Shift + ↓ hanggang D${last} para mapili, tapos Ctrl + D. May $ ang listahan, kaya hindi ito gagalaw.`,
      solution: [...Array.from({ length: n - 1 }, () => key('ArrowDown', { shift: true })), key('d', { ctrl: true })],
      start: d2,
      prepare: (s) =>
        setCells(s, [[d2, priceFormula(1)], ...rows.slice(1).map((r) => [at(r, COL.price), ''] as [Pos, string])]),
      check: (s) => {
        if (s.editing) return false;
        const values = computeSheet(s.cells);
        return rows.every(
          (r) =>
            isFormula(s.cells[r][COL.price]) &&
            (r === badRow ? values[r][COL.price] === '#N/A' : sameNumber(values[r][COL.price], priceOf(code(r)))),
        );
      },
      maxKeys: n + 1,
    },
    {
      id: 'iferror',
      text: `Sa ${cellName(cBad)}, #N/A ang lumabas kasi wala sa listahan ang ${badCode}. Palitan ang formula para "${NOT_FOUND}" ang lumabas.`,
      tip: `=IFERROR(VLOOKUP(A${badRow + 1},${listRange},2,FALSE),"${NOT_FOUND}"), tapos Enter`,
      hint: `Balutin ang VLOOKUP: =IFERROR(ang VLOOKUP, "${NOT_FOUND}"). Kapag may error, "${NOT_FOUND}" ang ipapakita.`,
      solution: typeFormula(`=IFERROR(VLOOKUP(A${badRow + 1},${listRange},2,FALSE),"${NOT_FOUND}")`),
      start: cBad,
      // Every Item already has its VLOOKUP, so the #N/A shows on the order with the wrong code.
      prepare: (s) =>
        setCells(
          s,
          rows.map((r) => [at(r, COL.item), itemFormula(r)] as [Pos, string]),
        ),
      check: (s) => !s.editing && cellHas(s, cBad, 'IFERROR', 'LOOKUP') && itemFollows(s, badRow, NOT_FOUND),
      maxKeys: 1,
    },
    {
      id: 'xlookup',
      text: `Sa ${cellName(c3)}, hanapin ang Item ng code sa A3 gamit ang XLOOKUP.`,
      tip: `=XLOOKUP(A3,$F$2:$F$${L},$G$2:$G$${L}), tapos Enter`,
      hint: `=XLOOKUP(ano ang hahanapin, saan hahanapin, ano ang kukunin). Hahanapin ang A3 sa mga Code (F), kukunin ang Item (G).`,
      solution: typeFormula(`=XLOOKUP(A3,$F$2:$F$${L},$G$2:$G$${L})`),
      start: c3,
      prepare: (s) => setCells(s, [[c3, '']]),
      check: (s) => !s.editing && cellHas(s, c3, 'XLOOKUP') && itemFollows(s, 2, itemOf(code(2))),
      maxKeys: 1,
    },
    {
      id: 'xlookupNotFound',
      text: `Sa ${cellName(cBad)}, gamitin ang XLOOKUP para sa Item, na "${NOT_FOUND}" ang lalabas kapag wala ang code.`,
      tip: `=XLOOKUP(A${badRow + 1},$F$2:$F$${L},$G$2:$G$${L},"${NOT_FOUND}"), tapos Enter`,
      hint: `Gaya ng XLOOKUP kanina, may pang-apat pa: ang ipapakita kapag wala, "${NOT_FOUND}".`,
      solution: typeFormula(`=XLOOKUP(A${badRow + 1},$F$2:$F$${L},$G$2:$G$${L},"${NOT_FOUND}")`),
      start: cBad,
      prepare: (s) => setCells(s, [[cBad, '']]),
      check: (s) => !s.editing && cellHas(s, cBad, 'XLOOKUP') && itemFollows(s, badRow, NOT_FOUND),
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((t) => [t.id, t]));
}

/** A new order list + price list (Excel's number rules on) with one task of every Aralin 7 kind. */
export function makeTaskSet7(rng: Rng): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const t = makeTable7(rng);
  // No extra empty column: all 8 columns fit a 1366px screen (sheetLayout.ts).
  const rows = t.table.length + EXTRA_ROWS;
  // Both Price columns look like a real price list: 1,250.50 (the numbers themselves are unchanged).
  const formats = Object.fromEntries(
    Array.from({ length: rows - 1 }, (_, i) => i + 1).flatMap((r) =>
      [COL.price, COL.listPrice].map((c) => [`${r},${c}`, { number2: true }]),
    ),
  );
  const sheet = makeSheet(t.table, rows, HEADERS_7.length, { formatting: true, formats });
  return { sheet, tasks: allTasks7(t) };
}

/** The Aralin 7 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz7(rng: Rng): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet7(rng);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
