/**
 * The tasks of Excel Aralin 13, "Maraming tab": going to another tab and back
 * (Ctrl+Shift+PgDn / PgUp here; Ctrl+PgDn / PgUp in Excel itself), renaming a
 * tab (double-click), a formula that reads another tab (=SUM(Orders!C2:C9)),
 * and VLOOKUP from a price list on another tab, copied down.
 *
 * The workbook has three tabs: Orders (Order No., Code, Qty, Item), Prices
 * (Code, Item, Price) and "Sheet3" (a new, unnamed report tab). Each task's
 * `prepare` builds the workbook fresh with the right tab in front, so the
 * tasks work in any order (tested). Formulas are computed with every tab
 * (`tabCells`), and checks compare with the lesson's own formula.
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { digits } from '../typing/generatePassage';
import { computeSheet, sameResult } from './formulaEngine';
import {
  cellsForCompute,
  isFormula,
  makeSheet,
  makeWorkbook,
  shiftFormula,
  tabCells,
  type Pos,
  type Sheet,
} from './sheet';
import type { ExcelTask } from './tasks';
import { key, typeFormula } from './taskHelpers';

export const TAB_NAMES = ['Orders', 'Prices', 'Sheet3'];
export const REPORT = 'Summary';
const ORDERS = ['Order No.', 'Code', 'Qty', 'Item'];
const PRICES = ['Code', 'Item', 'Price'];
const EXTRA_ROWS = 6;

export type Data13 = { orders: string[][]; prices: string[][] };

/** 6 to 8 office items with codes OS-101..OS-120 (the Prices tab), and 8 to 10 orders of them (the Orders tab). */
export function makeData13(rng: Rng): Data13 {
  const codes = shuffle(
    rng,
    Array.from({ length: 20 }, (_, i) => `OS-${101 + i}`),
  );
  const items = shuffle(rng, ph.officeItems).slice(0, intBetween(rng, 6, 8));
  const prices = items.map(([name, , min, max], i) => [
    codes[i],
    name[0].toUpperCase() + name.slice(1),
    String(intBetween(rng, min, max)),
  ]);
  const orders = Array.from({ length: intBetween(rng, 8, 10) }, () => [
    `OR-${digits(rng, 5)}`,
    pick(rng, prices)[0],
    String(intBetween(rng, 1, 20)),
    '',
  ]);
  return { orders, prices };
}

/** The workbook, fresh: tab `index` in front, the third tab named `third`. */
function build({ orders, prices }: Data13, index: number, third = TAB_NAMES[2]): Sheet {
  const sheet = (rows: string[][], widths: string[]) =>
    makeSheet(rows, rows.length + EXTRA_ROWS, widths.length, {
      formatting: true,
      colWidths: widths,
      compute: computeSheet,
    });
  return makeWorkbook(
    [
      {
        name: 'Orders',
        sheet: sheet(
          [ORDERS, ...orders],
          ['w-28 min-w-[7rem]', 'w-24 min-w-[6rem]', 'w-16 min-w-[4rem]', 'w-44 min-w-[11rem]', 'w-24 min-w-[6rem]'],
        ),
      },
      {
        name: 'Prices',
        sheet: sheet(
          [PRICES, ...prices],
          ['w-24 min-w-[6rem]', 'w-44 min-w-[11rem]', 'w-24 min-w-[6rem]', 'w-24 min-w-[6rem]'],
        ),
      },
      {
        name: third,
        sheet: sheet(
          [
            ['Report', ''],
            ['Total Qty', ''],
          ],
          ['w-32 min-w-[8rem]', 'w-28 min-w-[7rem]', 'w-24 min-w-[6rem]'],
        ),
      },
    ],
    index,
  );
}

function allTasks13(data: Data13, t: T): Record<string, ExcelTask> {
  const n = data.orders.length;
  const last = n + 1; // Excel row number of the last order
  const L = data.prices.length + 1; // Excel row number of the last price
  const rows = Array.from({ length: n }, (_, i) => i + 1);
  const at = (r: number, c: number): Pos => ({ r, c });
  const itemOf = (code: string) => data.prices.find((p) => p[0] === code)![1];
  const itemFormula = `=VLOOKUP(B2,Prices!$A$2:$C$${L},2,FALSE)`;
  const d2 = at(1, 3);
  const b2 = at(1, 1);
  const onTab = (s: Sheet, name: string) => s.tabs?.names[s.tabs.index] === name;
  /** The computed value of every cell of the active tab, with the other tabs there too. */
  const values = (s: Sheet) => computeSheet(cellsForCompute(s), tabCells(s));

  const tasks: ExcelTask[] = [
    {
      id: 'goTab',
      text: t('Pumunta sa tab na Prices (ang listahan ng presyo).', 'Go to the Prices tab (the price list).'),
      tip: 'Ctrl + Shift + PgDn',
      hint: t(
        'Ctrl + Shift + PgDn: ang susunod na tab. (Sa Excel mismo: Ctrl + PgDn.) Puwede ring i-click ang tab sa ibaba.',
        'Ctrl + Shift + PgDn: the next tab. (In Excel itself: Ctrl + PgDn.) You can also click the tab at the bottom.',
      ),
      solution: [key('PageDown', { ctrl: true, shift: true })],
      start: at(1, 0),
      prepare: () => build(data, 0),
      check: (s) => onTab(s, 'Prices'),
      maxKeys: 1,
    },
    {
      id: 'backTab',
      text: t('Bumalik sa tab na Orders.', 'Go back to the Orders tab.'),
      tip: 'Ctrl + Shift + PgUp',
      hint: t(
        'Ctrl + Shift + PgUp: ang naunang tab. (Sa Excel mismo: Ctrl + PgUp.)',
        'Ctrl + Shift + PgUp: the previous tab. (In Excel itself: Ctrl + PgUp.)',
      ),
      solution: [key('PageUp', { ctrl: true, shift: true })],
      start: at(1, 0),
      prepare: () => build(data, 1),
      check: (s) => onTab(s, 'Orders'),
      maxKeys: 1,
    },
    {
      id: 'renameTab',
      text: t(
        `Palitan ang pangalan ng tab na ${TAB_NAMES[2]}: gawin itong ${REPORT}.`,
        `Rename the ${TAB_NAMES[2]} tab to ${REPORT}.`,
      ),
      tip: t(
        `I-double-click ang tab na ${TAB_NAMES[2]}, i-type ang ${REPORT}, Enter`,
        `Double-click the ${TAB_NAMES[2]} tab, type ${REPORT}, Enter`,
      ),
      hint: t(
        `I-double-click ang tab na ${TAB_NAMES[2]} sa ibaba. I-type ang ${REPORT}, tapos Enter. Mas madaling hanapin ang tab na may malinaw na pangalan.`,
        `Double-click the ${TAB_NAMES[2]} tab at the bottom. Type ${REPORT}, then Enter. A tab with a clear name is easier to find.`,
      ),
      solution: [{ command: { kind: 'renameTab', index: 2, name: REPORT } }],
      start: at(1, 0),
      prepare: () => build(data, 0),
      check: (s) => s.tabs?.names[2].toLowerCase() === REPORT.toLowerCase(),
      maxKeys: 2,
    },
    {
      id: 'refTab',
      text: t(
        `Nasa tab na ${REPORT} ka. Sa B2, kuwentahin ang Total Qty: ang kabuuan ng Qty (C2 hanggang C${last}) sa tab na Orders.`,
        `You are on the ${REPORT} tab. In B2, work out the Total Qty: the total of the Qty (C2 to C${last}) on the Orders tab.`,
      ),
      tip: t(`=SUM(Orders!C2:C${last}), tapos Enter`, `=SUM(Orders!C2:C${last}), then Enter`),
      hint: t(
        `Isulat ang pangalan ng tab, tapos !, bago ang mga cell: Orders!C2:C${last} ay C2 hanggang C${last} ng tab na Orders.`,
        `Write the tab name, then !, before the cells: Orders!C2:C${last} is C2 to C${last} on the Orders tab.`,
      ),
      solution: typeFormula(`=SUM(Orders!C2:C${last})`),
      start: b2,
      prepare: () => build(data, 2, REPORT),
      check: (s) => {
        const f = s.cells[b2.r][b2.c];
        if (s.editing || !onTab(s, REPORT) || !isFormula(f) || !f.toUpperCase().includes('ORDERS!')) return false;
        const tabs = tabCells(s)!;
        // Also right when an order's Qty changes (a typed total is not).
        const probe = {
          ...tabs,
          others: tabs.others.map((t) =>
            t.name === 'Orders'
              ? { ...t, cells: t.cells.map((row, r) => (r === 1 ? [row[0], row[1], '99', ...row.slice(3)] : row)) }
              : t,
          ),
        };
        const reference = `=SUM(Orders!C2:C${last})`;
        return (
          sameResult(cellsForCompute(s), b2, reference, tabs) && sameResult(cellsForCompute(s), b2, reference, probe)
        );
      },
      maxKeys: 1,
    },
    {
      id: 'vlookupTab',
      text: t(
        `Sa D2, hanapin ang Item ng code sa B2 mula sa tab na Prices (A2 hanggang C${L}). Lagyan ng $ para puwedeng kopyahin.`,
        `In D2, look up the Item of the code in B2 from the Prices tab (A2 to C${L}). Add $ so it can be copied.`,
      ),
      tip: t(`${itemFormula}, tapos Enter`, `${itemFormula}, then Enter`),
      hint: t(
        `Gaya ng Aralin 7, pero nasa ibang tab ang listahan: Prices!$A$2:$C$${L}. Ang Item ay pang-2 column.`,
        `Like Lesson 7, but the list is on another tab: Prices!$A$2:$C$${L}. The Item is the 2nd column.`,
      ),
      solution: typeFormula(itemFormula),
      start: d2,
      prepare: () => build(data, 0),
      check: (s) => {
        const f = s.cells[d2.r][d2.c];
        if (s.editing || !onTab(s, 'Orders') || !isFormula(f) || !/VLOOKUP/i.test(f) || !/PRICES!/i.test(f))
          return false;
        // Copied down on a copy of the tab, every order must get its own item.
        const copied = {
          ...s,
          cells: s.cells.map((row, r) =>
            rows.includes(r) ? [...row.slice(0, 3), shiftFormula(f, r - 1, 0), ...row.slice(4)] : row,
          ),
        };
        const v = values(copied);
        return rows.every((r) => v[r][3] === itemOf(s.cells[r][1]));
      },
      maxKeys: 1,
    },
    {
      id: 'fillTab',
      text: t(
        `Kopyahin ang formula ng D2 pababa hanggang D${last}, para may Item ang bawat order.`,
        `Copy the formula in D2 down to D${last}, so every order has an Item.`,
      ),
      tip: t(`Shift + ↓ hanggang D${last}, tapos Ctrl + D`, `Shift + ↓ to D${last}, then Ctrl + D`),
      hint: t(
        `Nasa D2 ka. Shift + ↓ hanggang D${last} para mapili, tapos Ctrl + D. May $ ang listahan, kaya hindi ito gagalaw.`,
        `You are in D2. Shift + ↓ to D${last} to select, then Ctrl + D. The list has $, so it stays put.`,
      ),
      solution: [...Array.from({ length: n - 1 }, () => key('ArrowDown', { shift: true })), key('d', { ctrl: true })],
      start: d2,
      prepare: () => {
        const s = build(data, 0);
        return {
          ...s,
          cells: s.cells.map((row, r) => (r === 1 ? [...row.slice(0, 3), itemFormula, ...row.slice(4)] : row)),
        };
      },
      check: (s) => {
        if (s.editing || !onTab(s, 'Orders')) return false;
        const v = values(s);
        return rows.every((r) => isFormula(s.cells[r][3]) && v[r][3] === itemOf(s.cells[r][1]));
      },
      maxKeys: n + 1,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new workbook (Orders in front) with one task of every Aralin 13 kind. */
export function makeTaskSet13(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const data = makeData13(rng);
  return { sheet: build(data, 0), tasks: allTasks13(data, translator(lang)) };
}

/** The Aralin 13 Pagsusulit: a new workbook and all 6 task kinds in random order. */
export function makeQuiz13(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet13(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
