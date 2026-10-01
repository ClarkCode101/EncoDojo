/**
 * The tasks of Excel Aralin 12, "Rows at columns": insert and delete whole
 * rows (Shift+Space, Ctrl + +, Ctrl + -), insert and delete whole columns
 * (Ctrl+Space), hide a column (Ctrl+0), and Freeze Panes.
 *
 * The sheet is a wide monthly sales report (Agent, Branch, Old Code, Contact
 * No., Jan to Jun, Total) with a Total row: wide on purpose, so it scrolls
 * sideways and freezing the Agent column matters. Every row Total and the
 * Total row are formulas, so the checks also see Excel's rule: inserting or
 * deleting rows and columns moves the formulas' references. One agent was
 * encoded twice (to delete). Nothing is frozen at the start. Each task's
 * `prepare` puts the whole sheet back, so the tasks work in any order (tested).
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { computeSheet } from './formulaEngine';
import { colLetter, makeSheet, type Pos, type Sheet } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const HEADERS_12 = ['Agent', 'Branch', 'Old Code', 'Contact No.', ...MONTHS, 'Total'];
const COL = { agent: 0, branch: 1, oldCode: 2, contact: 3, jan: 4, total: 10 } as const;
const EXTRA_ROWS = 5;
export const WIDTHS_12 = [
  'w-44 min-w-[11rem]',
  'w-28 min-w-[7rem]',
  'w-24 min-w-[6rem]',
  'w-36 min-w-[9rem]',
  ...MONTHS.map(() => 'w-20 min-w-[5rem]'),
  'w-24 min-w-[6rem]',
];
const BRANCHES = ph.cities.map(([c]) => c.replace(' City', '')).filter((c) => c.length <= 8);

export type Table12 = {
  table: string[][];
  /** Sheet rows (0-based): where the new row goes, and the row encoded twice (a copy of the row above it). */
  insertAt: number;
  duplicateRow: number;
};

/** 9 to 11 agents (one of them twice, one right under the other), and the Total row. */
export function makeTable12(rng: Rng): Table12 {
  const n = intBetween(rng, 9, 11);
  const rows: string[][] = [HEADERS_12];
  for (let r = 1; r <= n; r++) {
    let name = '';
    do name = `${pick(rng, [...ph.femaleFirstNames, ...ph.maleFirstNames]).split(' ')[0]} ${pick(rng, ph.surnames)}`;
    while (name.length > 17 || rows.some((row) => row[0] === name));
    const sales = MONTHS.map(() => String(intBetween(rng, 50, 400) * 100));
    rows.push([
      name,
      pick(rng, BRANCHES),
      `OC-${intBetween(rng, 100, 999)}`,
      `(0${String(intBetween(rng, 2, 88)).padStart(2, '0')}) 000-${String(intBetween(rng, 0, 9999)).padStart(4, '0')}`, // made-up, never a real line
      ...sales,
      `=SUM(E${r + 1}:J${r + 1})`,
    ]);
  }
  // One agent encoded twice: row d is a copy of row d-1.
  const duplicateRow = intBetween(rng, 3, n);
  rows[duplicateRow] = [
    ...rows[duplicateRow - 1].slice(0, COL.total),
    `=SUM(E${duplicateRow + 1}:J${duplicateRow + 1})`,
  ];
  const last = n + 1;
  rows.push([
    'Total',
    '',
    '',
    '',
    ...MONTHS.map((_, i) => `=SUM(${colLetter(COL.jan + i)}2:${colLetter(COL.jan + i)}${last})`),
    `=SUM(K2:K${last})`,
  ]);
  // The new row goes somewhere in the middle, not next to the copy.
  let insertAt = intBetween(rng, 2, n);
  while (Math.abs(insertAt - duplicateRow) <= 1) insertAt = insertAt >= n ? 2 : insertAt + 1;
  return { table: rows, insertAt, duplicateRow };
}

const key = (k: string, mods: { ctrl?: boolean; shift?: boolean } = {}): SolutionStep => ({
  press: { key: k, ...mods },
});

function allTasks12({ table, insertAt, duplicateRow }: Table12, base: Sheet, t: T): Record<string, ExcelTask> {
  const n = table.length - 2; // agents are rows 1..n; the Total row is n+1
  const totalRow = n + 1;
  const at = (r: number, c: number): Pos => ({ r, c });
  /** Every task starts from the sheet as made: same cells, widths, nothing hidden or frozen. */
  const reset = (s: Sheet): Sheet => ({
    ...s,
    cells: base.cells.map((row) => [...row]),
    formats: base.formats,
    colWidths: base.colWidths,
    hiddenCols: [],
    freeze: { rows: 0, cols: 0 },
    whole: null,
  });
  const row = (s: Sheet, r: number) => s.cells[r].slice(0, HEADERS_12.length);
  const header = (s: Sheet) => s.cells[0];
  /** The grand total (K of the Total row) still adds up every agent, wherever the rows moved. */
  const totalOk = (s: Sheet, totalAt: number, totalCol: number, expected: number) =>
    Number(computeSheet(s.cells)[totalAt][totalCol]) === expected;
  const grand = table
    .slice(1, totalRow)
    .reduce((sum, r) => sum + r.slice(COL.jan, COL.total).reduce((a, v) => a + Number(v), 0), 0);
  const dupSales = table[duplicateRow].slice(COL.jan, COL.total).reduce((a, v) => a + Number(v), 0);
  const dupName = table[duplicateRow][COL.agent];

  const tasks: ExcelTask[] = [
    {
      id: 'insertRow',
      text: t(
        `May nakalimutang agent. Magdagdag ng bagong row sa itaas ng row ${insertAt + 1}.`,
        `An agent was left out. Insert a new row above row ${insertAt + 1}.`,
      ),
      tip: t('Shift + Space, tapos Ctrl + +', 'Shift + Space, then Ctrl + +'),
      hint: t(
        `Nasa row ${insertAt + 1} ka. Shift + Space para mapili ang buong row, tapos Ctrl + + (Ctrl, Shift at =). Bababa ang mga row.`,
        `You are in row ${insertAt + 1}. Shift + Space selects the whole row, then Ctrl + + (Ctrl, Shift and =). The rows move down.`,
      ),
      solution: [key(' ', { shift: true }), key('+', { ctrl: true, shift: true })],
      start: at(insertAt, COL.agent),
      prepare: reset,
      check: (s) =>
        !s.editing &&
        row(s, insertAt).every((v) => v === '') &&
        row(s, insertAt + 1)[COL.agent] === table[insertAt][COL.agent] &&
        // The Total row moved down one and its SUM now includes the new row.
        s.cells[totalRow + 1][COL.jan] === `=SUM(E2:E${totalRow + 1})`,
      maxKeys: 2,
    },
    {
      id: 'deleteRow',
      text: t(
        `Na-encode nang dalawang beses si ${dupName} (row ${duplicateRow} at ${duplicateRow + 1}). Burahin ang buong row ${duplicateRow + 1}.`,
        `${dupName} was encoded twice (rows ${duplicateRow} and ${duplicateRow + 1}). Delete the whole row ${duplicateRow + 1}.`,
      ),
      tip: t('Shift + Space, tapos Ctrl + -', 'Shift + Space, then Ctrl + -'),
      hint: t(
        `Nasa row ${duplicateRow + 1} ka. Shift + Space para mapili ang buong row, tapos Ctrl + - (minus). Aakyat ang mga row sa ilalim.`,
        `You are in row ${duplicateRow + 1}. Shift + Space selects the whole row, then Ctrl + - (minus). The rows below move up.`,
      ),
      solution: [key(' ', { shift: true }), key('-', { ctrl: true })],
      start: at(duplicateRow, COL.agent),
      prepare: reset,
      check: (s) =>
        !s.editing &&
        s.cells.filter((r) => r[COL.agent] === dupName).length === 1 &&
        s.cells[totalRow - 1][COL.agent] === 'Total' &&
        totalOk(s, totalRow - 1, COL.total, grand - dupSales),
      maxKeys: 2,
    },
    {
      id: 'insertCol',
      text: t(
        `Magdagdag ng bagong column sa kaliwa ng Jan (column ${colLetter(COL.jan)}), para sa Quota.`,
        `Insert a new column left of Jan (column ${colLetter(COL.jan)}), for the Quota.`,
      ),
      tip: t('Ctrl + Space, tapos Ctrl + +', 'Ctrl + Space, then Ctrl + +'),
      hint: t(
        'Nasa column ng Jan ka. Ctrl + Space para mapili ang buong column, tapos Ctrl + +. Lilipat pakanan ang mga column.',
        'You are in the Jan column. Ctrl + Space selects the whole column, then Ctrl + +. The columns move to the right.',
      ),
      solution: [key(' ', { ctrl: true }), key('+', { ctrl: true, shift: true })],
      start: at(1, COL.jan),
      prepare: reset,
      check: (s) =>
        !s.editing &&
        s.cells.every((r) => r[COL.jan] === '') &&
        header(s)[COL.jan + 1] === 'Jan' &&
        // Every row Total moved too: =SUM(F2:K2).
        s.cells[1][COL.total + 1] === '=SUM(F2:K2)' &&
        totalOk(s, totalRow, COL.total + 1, grand),
      maxKeys: 2,
    },
    {
      id: 'deleteCol',
      text: t(
        `Hindi na ginagamit ang Old Code (column ${colLetter(COL.oldCode)}). Burahin ang buong column.`,
        `The Old Code (column ${colLetter(COL.oldCode)}) is no longer used. Delete the whole column.`,
      ),
      tip: t('Ctrl + Space, tapos Ctrl + -', 'Ctrl + Space, then Ctrl + -'),
      hint: t(
        'Pumunta sa column ng Old Code. Ctrl + Space para mapili ang buong column, tapos Ctrl + -.',
        'Go to the Old Code column. Ctrl + Space selects the whole column, then Ctrl + -.',
      ),
      solution: [key(' ', { ctrl: true }), key('-', { ctrl: true })],
      start: at(1, COL.oldCode),
      prepare: reset,
      check: (s) =>
        !s.editing &&
        !header(s).includes('Old Code') &&
        header(s)[COL.oldCode] === 'Contact No.' &&
        s.cells[1][COL.total - 1] === '=SUM(D2:I2)' &&
        totalOk(s, totalRow, COL.total - 1, grand),
      maxKeys: 2,
    },
    {
      id: 'hideCol',
      text: t(
        `Itago ang Contact No. (column ${colLetter(COL.contact)}): hindi ito kailangan sa report na ipi-print.`,
        `Hide the Contact No. (column ${colLetter(COL.contact)}): it is not needed in the printed report.`,
      ),
      tip: 'Ctrl + 0',
      hint: t(
        'Nasa column ng Contact No. ka. Ctrl + 0 (zero) para itago. Hindi nabura ang laman: Ctrl + Shift + 0 (o right-click, Unhide) para ibalik.',
        'You are in the Contact No. column. Ctrl + 0 (zero) hides it. The content is not deleted: Ctrl + Shift + 0 (or right-click, Unhide) brings it back.',
      ),
      solution: [key('0', { ctrl: true })],
      start: at(1, COL.contact),
      prepare: reset,
      check: (s) =>
        s.hiddenCols.includes(COL.contact) &&
        s.hiddenCols.length === 1 &&
        header(s)[COL.contact] === 'Contact No.' &&
        row(s, 1)[COL.contact] === table[1][COL.contact],
      maxKeys: 1,
    },
    {
      id: 'freeze',
      text: t(
        'I-freeze ang row 1 at ang Agent (column A), para laging kita habang nag-i-scroll pakanan at pababa.',
        'Freeze row 1 and the Agent (column A), so they stay in view while you scroll right and down.',
      ),
      tip: t('Nasa B2, Freeze Panes, tapos Freeze Panes', 'At B2, Freeze Panes, then Freeze Panes'),
      hint: t(
        'Ang Freeze Panes ay nagpi-freeze sa itaas at sa kaliwa ng napiling cell. Nasa B2 ka: row 1 at column A. Sa toolbar: Freeze Panes, tapos Freeze Panes.',
        'Freeze Panes freezes what is above and left of the selected cell. You are at B2: row 1 and column A. On the toolbar: Freeze Panes, then Freeze Panes.',
      ),
      solution: [{ command: { kind: 'freeze', rows: 1, cols: 1 } }],
      start: at(1, COL.branch),
      prepare: reset,
      check: (s) => s.freeze.rows === 1 && s.freeze.cols === 1,
      maxKeys: 2,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new sales report (nothing frozen, Excel's number rules on) with one task of every Aralin 12 kind. */
export function makeTaskSet12(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const t = makeTable12(rng);
  const sheet = makeSheet(t.table, t.table.length + EXTRA_ROWS, HEADERS_12.length + 1, {
    formatting: true,
    compute: computeSheet,
    freeze: { rows: 0, cols: 0 },
    colWidths: [...WIDTHS_12, 'w-24 min-w-[6rem]'],
  });
  return { sheet, tasks: allTasks12(t, sheet, translator(lang)) };
}

/** The Aralin 12 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz12(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet12(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
