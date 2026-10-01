/**
 * The tasks of Excel Aralin 4, "Sort, filter, find & replace": Find (Ctrl+F),
 * Replace All (Ctrl+H), Sort A to Z / Z to A, Filter (Ctrl+Shift+L and the
 * ▼ list), and Remove Duplicates.
 *
 * The sheet is a longer sales log (30-36 records, so Find really helps) with
 * a few branches misspelled "Cty" and a few rows entered twice. Every check
 * looks at WHAT is in the sheet, not at fixed positions, because sorting and
 * removing duplicates move the rows; so the tasks work in any order (tested).
 * Every task except the filter ones starts with no filter on.
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { digits, nameParts } from '../typing/generatePassage';
import { countDuplicates, countMatches, lastUsed, makeSheet, type Sheet, type SheetCommand } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';
import { amount, date } from './taskHelpers';

export const HEADERS_4 = ['Ref No.', 'Customer', 'Branch', 'Date', 'Amount'];
const COL = { ref: 0, customer: 1, branch: 2, date: 3, amount: 4 } as const;
const EXTRA_ROWS = 6;
const SHEET_COLS = 7;

/** Short names of the task kinds, for the results table. */
export const taskLabels4 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    find: t('Hanapin ang isang record', 'Find a record'),
    replace: t('Palitan lahat ng maling spelling', 'Replace every misspelling'),
    sortAsc: t('I-sort A hanggang Z', 'Sort A to Z'),
    sortDesc: t('I-sort mula pinakamalaki', 'Sort largest first'),
    filter: t('I-filter ang isang Branch', 'Filter one Branch'),
    filterOff: t('Alisin ang filter', 'Remove the filter'),
    removeDup: t('Tanggalin ang mga doble', 'Remove the duplicates'),
  };
};

/** Only a few branches, so each one appears many times (filtering makes sense). */
function branches(rng: Rng): string[] {
  return shuffle(
    rng,
    ph.cities.map((c) => c[0]).filter((c) => c.endsWith(' City')),
  ).slice(0, 5);
}

export type Table4 = {
  rows: string[][];
  /** The branch names (all spelled right). */
  branchList: string[];
  /** A branch that is never misspelled (for the filter task). */
  cleanBranch: string;
  /** A Ref No. that appears once (for the Find task). */
  uniqueRef: string;
};

/** The long sales log: 30-36 records, 4 branches misspelled "Cty", 3 rows entered twice. */
export function makeTable4(rng: Rng): Table4 {
  const branchList = branches(rng);
  const [cleanBranch, ...others] = branchList;
  const count = intBetween(rng, 27, 33);
  const records: string[][] = [];
  for (let i = 0; i < count; i++) {
    const n = nameParts(rng);
    records.push([
      `SL-2026-${digits(rng, 5)}`,
      `${n.given} ${n.surname}`,
      pick(rng, branchList),
      date(rng),
      amount(rng),
    ]);
  }
  const order = shuffle(
    rng,
    records.map((_, i) => i),
  );
  // 4 misspelled branches (never the clean one), 3 rows to enter twice, and a unique Ref No. for Find.
  const misspell = order.slice(0, 4);
  const doubled = order.slice(4, 7);
  const uniqueRef = records[order[7]][COL.ref];
  for (const i of misspell) {
    if (records[i][COL.branch] === cleanBranch) records[i][COL.branch] = pick(rng, others);
    records[i][COL.branch] = records[i][COL.branch].replace(/ City$/, ' Cty');
  }
  // Take the rows to double first: inserting shifts the positions of the rows after it.
  const originals = doubled.map((i) => records[i]);
  for (const original of originals) {
    const at = records.indexOf(original);
    records.splice(intBetween(rng, at + 1, records.length), 0, [...original]);
  }
  return { rows: [HEADERS_4, ...records], branchList, cleanBranch, uniqueRef };
}

const cmd = (command: SheetCommand): SolutionStep => ({ command });
const noFilter = (s: Sheet): Sheet => ({ ...s, filterOn: false, filter: null });
/** The table body (rows 1..last). */
const body = (s: Sheet) => s.cells.slice(1, lastUsed(s).r + 1);
const sortedBy = (s: Sheet, col: number, compare: (a: string, b: string) => number) =>
  body(s).every((row, i, all) => i === 0 || compare(all[i - 1][col], row[col]) <= 0);

function allTasks4(tb: Table4, t: T): Record<string, ExcelTask> {
  const validBranches = new Set(tb.branchList);
  const tasks: ExcelTask[] = [
    {
      id: 'find',
      text: t(
        `Hanapin ang record na ${tb.uniqueRef} at pumunta roon.`,
        `Find the record ${tb.uniqueRef} and go there.`,
      ),
      tip: t('Ctrl + F, i-type ang Ref No., Enter', 'Ctrl + F, type the Ref No., Enter'),
      hint: t(
        'Ctrl + F ang Find. I-type ang Ref No. at pindutin ang Enter (Find Next). Pupunta ang cell doon.',
        'Ctrl + F is Find. Type the Ref No. and press Enter (Find Next). The cell goes there.',
      ),
      solution: [cmd({ kind: 'open' }), cmd({ kind: 'find', text: tb.uniqueRef })],
      start: { r: 0, c: 0 },
      prepare: noFilter,
      check: (s) => !s.editing && s.cells[s.active.r][s.active.c] === tb.uniqueRef,
      maxKeys: 3,
    },
    {
      id: 'replace',
      text: t(
        'May maling spelling na "Cty" sa ilang Branch (dapat "City"). Palitan lahat nang sabay-sabay.',
        'Some Branches are misspelled "Cty" (it should be "City"). Replace them all at once.',
      ),
      tip: t('Ctrl + H, tapos Replace All', 'Ctrl + H, then Replace All'),
      hint: t(
        'Ctrl + H ang Replace. Sa Find what: Cty. Sa Replace with: City. Tapos Replace All.',
        'Ctrl + H is Replace. Find what: Cty. Replace with: City. Then Replace All.',
      ),
      solution: [cmd({ kind: 'open' }), cmd({ kind: 'replaceAll', find: 'Cty', replace: 'City' })],
      start: { r: 0, c: 0 },
      prepare: noFilter,
      check: (s) =>
        !s.editing && countMatches(s, 'Cty') === 0 && body(s).every((row) => validBranches.has(row[COL.branch])),
      maxKeys: 3,
    },
    {
      id: 'sortAsc',
      text: t('I-sort ang buong table ayon sa Customer, A hanggang Z.', 'Sort the whole table by Customer, A to Z.'),
      tip: t('Nasa Customer ang cell, tapos Sort A to Z', 'The cell on Customer, then Sort A to Z'),
      hint: t(
        'Nasa column ng Customer ka na. Pindutin ang "Sort A to Z" sa Data toolbar sa itaas ng sheet.',
        'You are already in the Customer column. Press "Sort A to Z" on the Data toolbar above the sheet.',
      ),
      solution: [cmd({ kind: 'sort', asc: true })],
      start: { r: 1, c: COL.customer },
      prepare: noFilter,
      check: (s) =>
        !s.editing && sortedBy(s, COL.customer, (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
      maxKeys: 2,
    },
    {
      id: 'sortDesc',
      text: t('I-sort ayon sa Amount: pinakamalaki muna.', 'Sort by Amount: largest first.'),
      tip: t('Nasa Amount ang cell, tapos Sort Z to A', 'The cell on Amount, then Sort Z to A'),
      hint: t(
        'Nasa column ng Amount ka na. Ang "Sort Z to A" ang maglalagay ng pinakamalaki sa itaas.',
        'You are already in the Amount column. "Sort Z to A" puts the largest at the top.',
      ),
      solution: [cmd({ kind: 'sort', asc: false })],
      start: { r: 1, c: COL.amount },
      prepare: noFilter,
      check: (s) => !s.editing && sortedBy(s, COL.amount, (a, b) => Number(b) - Number(a)),
      maxKeys: 2,
    },
    {
      id: 'filter',
      text: t(
        `Ipakita lang ang mga record ng Branch na "${tb.cleanBranch}".`,
        `Show only the records of the Branch "${tb.cleanBranch}".`,
      ),
      tip: t('Ctrl + Shift + L, tapos ▼ sa Branch', 'Ctrl + Shift + L, then ▼ on Branch'),
      hint: t(
        'Ctrl + Shift + L para lumabas ang ▼ sa header. I-click ang ▼ ng Branch, alisin ang check sa Select All, i-check ang isa, tapos OK.',
        'Ctrl + Shift + L makes the ▼ appear in the header. Click the ▼ of Branch, uncheck Select All, check the one, then OK.',
      ),
      solution: [
        { press: { key: 'L', ctrl: true, shift: true } },
        cmd({ kind: 'open' }),
        cmd({ kind: 'setFilter', col: COL.branch, values: [tb.cleanBranch] }),
      ],
      start: { r: 0, c: COL.branch },
      prepare: noFilter,
      check: (s) =>
        !s.editing &&
        s.filter?.col === COL.branch &&
        s.filter.values.length === 1 &&
        s.filter.values[0] === tb.cleanBranch,
      maxKeys: 4,
    },
    {
      id: 'filterOff',
      text: t(
        'May naka-filter sa Branch, kaya may nakatagong mga row. Alisin ang filter para makita ulit ang lahat.',
        'Branch is filtered, so some rows are hidden. Remove the filter to see everything again.',
      ),
      tip: 'Ctrl + Shift + L',
      hint: t(
        'Ctrl + Shift + L ulit (o ang "Filter" sa toolbar): mawawala ang filter at lalabas lahat ng row.',
        'Ctrl + Shift + L again (or "Filter" on the toolbar): the filter goes away and every row shows.',
      ),
      solution: [{ press: { key: 'L', ctrl: true, shift: true } }],
      start: { r: 0, c: COL.branch },
      prepare: (s) => ({ ...s, filterOn: true, filter: { col: COL.branch, values: [tb.cleanBranch] } }),
      check: (s) => !s.editing && s.filter === null,
      maxKeys: 1,
    },
    {
      id: 'removeDup',
      text: t(
        'May mga record na dalawang beses na-encode (buong row na magkapareho). Tanggalin ang mga doble.',
        'Some records were encoded twice (whole rows that are the same). Remove the duplicates.',
      ),
      tip: t('Remove Duplicates, tapos OK', 'Remove Duplicates, then OK'),
      hint: t(
        'Pindutin ang "Remove Duplicates" sa Data toolbar, tapos OK. Maiiwan ang unang kopya ng bawat record.',
        'Press "Remove Duplicates" on the Data toolbar, then OK. The first copy of each record stays.',
      ),
      solution: [cmd({ kind: 'open' }), cmd({ kind: 'removeDuplicates' })],
      start: { r: 1, c: 0 },
      prepare: noFilter,
      check: (s) => !s.editing && countDuplicates(s) === 0,
      maxKeys: 3,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new long sales log with one task of every Aralin 4 kind. */
export function makeTaskSet4(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const tb = makeTable4(rng);
  const sheet = makeSheet(tb.rows, tb.rows.length + EXTRA_ROWS, SHEET_COLS);
  return { sheet, tasks: allTasks4(tb, translator(lang)) };
}

/** The Aralin 4 Pagsusulit: a new sheet and 6 of the 7 task kinds in random order. */
export function makeQuiz4(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet4(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)).slice(0, 6) };
}
