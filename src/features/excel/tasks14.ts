/**
 * The tasks of Excel Aralin 14, "Pivot Table": make a PivotTable (total Amount
 * per Branch), change its fields (Count instead of Sum, per Agent, Month in the
 * Columns), filter it (Paid only), and Refresh it after the data changed.
 *
 * The workbook starts with one tab, Sales (Branch, Agent, Month, Amount,
 * Status). Except the first task, every task starts with a PivotTable already
 * made on a "Pivot" tab. Checks read the PivotTable's fields and make sure its
 * cells match the Sales tab as it is now. Each task's `prepare` builds the
 * workbook fresh, so the tasks work in any order (tested).
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import {
  findPivot,
  makeSheet,
  makeWorkbook,
  pivotCells,
  runCommand,
  switchTab,
  tableOf,
  type PivotDef,
  type Pos,
  type Sheet,
} from './sheet';
import type { ExcelTask } from './tasks';

export const HEADERS_14 = ['Branch', 'Agent', 'Month', 'Amount', 'Status'];
const COL = { branch: 0, agent: 1, month: 2, amount: 3, status: 4 } as const;
const MONTHS = ['Jan', 'Feb', 'Mar'];
const EXTRA_ROWS = 6;
const BRANCHES = ph.cities.map(([c]) => c.replace(' City', '')).filter((c) => c.length <= 8);

/** The first PivotTable: Sum of Amount per Branch. */
export const BASE_PIVOT: Omit<PivotDef, 'source'> = {
  rows: COL.branch,
  cols: null,
  values: COL.amount,
  fn: 'sum',
  filter: null,
};

export type Data14 = { sales: string[][]; newSale: string[] };

/** 18 to 24 sales by 5 agents in 3 branches (each agent in one branch), January to March, most of them Paid. */
export function makeData14(rng: Rng): Data14 {
  const branches = shuffle(rng, BRANCHES).slice(0, 3);
  const agents: [string, string][] = [];
  while (agents.length < 5) {
    const name = `${pick(rng, [...ph.femaleFirstNames, ...ph.maleFirstNames]).split(' ')[0]} ${pick(rng, ph.surnames)[0]}.`;
    if (!agents.some(([a]) => a === name)) agents.push([name, branches[agents.length % 3]]);
  }
  const sale = (i = -1): string[] => {
    const [agent, branch] = i >= 0 ? agents[i] : pick(rng, agents);
    return [
      branch,
      agent,
      pick(rng, MONTHS),
      `${intBetween(rng, 10, 300) * 100}${pick(rng, ['', '', '.5'])}`,
      pick(rng, ['Paid', 'Paid', 'Paid', 'Unpaid']),
    ];
  };
  // Every branch and every month has at least one sale, so the PivotTable always shows them all:
  // the first three sales are by the first three agents (one per branch), in January, February, March.
  const sales = Array.from({ length: intBetween(rng, 18, 24) }, (_, i) => sale(i < 3 ? i : -1));
  MONTHS.forEach((m, i) => (sales[i][COL.month] = m));
  return { sales: shuffle(rng, sales), newSale: sale() };
}

/** The workbook, fresh: just the Sales tab. */
function salesOnly({ sales }: Data14): Sheet {
  const sheet = makeSheet([HEADERS_14, ...sales], sales.length + 1 + EXTRA_ROWS, HEADERS_14.length, {
    formatting: true,
    formats: Object.fromEntries(sales.map((_, i) => [`${i + 1},${COL.amount}`, { number2: true }])),
    colWidths: [
      'w-28 min-w-[7rem]',
      'w-40 min-w-[10rem]',
      'w-20 min-w-[5rem]',
      'w-28 min-w-[7rem]',
      'w-24 min-w-[6rem]',
    ],
  });
  return makeWorkbook([{ name: 'Sales', sheet }]);
}

/** The workbook with the first PivotTable made, on its tab in front. */
const withPivot = (data: Data14) => runCommand(salesOnly(data), { kind: 'createPivot', def: BASE_PIVOT });

/** The PivotTable's fields, and whether its cells match the Sales tab as it is NOW. */
function pivotOf(s: Sheet): { def: PivotDef; fresh: boolean } | null {
  const p = findPivot(s);
  if (!p || !s.tabs) return null;
  const i = s.tabs.names.indexOf(p.def.source);
  const source = i === s.tabs.index ? s : s.tabs.stored[i];
  if (!source) return null;
  const expected = pivotCells(tableOf(source), p.def).cells;
  const fresh = expected.every((row, r) => row.every((v, c) => (p.cells[r]?.[c] ?? '') === v));
  return { def: p.def, fresh };
}

function allTasks14(data: Data14, t: T): Record<string, ExcelTask> {
  const a1: Pos = { r: 0, c: 0 };
  const same = (d: PivotDef, want: Partial<PivotDef>) =>
    Object.entries(want).every(([k, v]) => JSON.stringify(d[k as keyof PivotDef]) === JSON.stringify(v));
  const done = (want: Partial<PivotDef>) => (s: Sheet) => {
    const p = pivotOf(s);
    return !!p && p.fresh && same(p.def, want);
  };
  const def = (change: Partial<PivotDef>): PivotDef => ({ ...BASE_PIVOT, source: 'Sales', ...change });
  const newRow = data.sales.length + 2; // the Excel row of the new sale

  const tasks: ExcelTask[] = [
    {
      id: 'createPivot',
      text: t(
        'Gumawa ng PivotTable mula sa Sales: ang kabuuang Amount bawat Branch.',
        'Make a PivotTable from Sales: the total Amount per Branch.',
      ),
      tip: 'PivotTable, Rows: Branch, Values: Sum of Amount, OK',
      hint: t(
        'Nasa loob ka ng table. Sa toolbar: PivotTable. Rows: Branch (ililista pababa). Values: Sum of Amount. OK: lalabas ito sa bagong tab.',
        'You are inside the table. On the toolbar: PivotTable. Rows: Branch (listed going down). Values: Sum of Amount. OK: it appears on a new tab.',
      ),
      solution: [{ command: { kind: 'createPivot', def: BASE_PIVOT } }],
      start: { r: 1, c: 0 },
      prepare: () => salesOnly(data),
      check: done({ rows: COL.branch, cols: null, values: COL.amount, fn: 'sum', filter: null }),
      maxKeys: 2,
    },
    {
      id: 'countPivot',
      text: t(
        'Ilan ang benta (transactions) bawat branch? Gawing Count ang Values.',
        'How many sales (transactions) per branch? Make the Values a Count.',
      ),
      tip: 'PivotTable Fields: Values: Count',
      hint: t(
        'Sa PivotTable Fields sa itaas ng sheet, palitan ang Sum ng Count. Bibilangin ang mga benta sa halip na idagdag ang Amount.',
        'In the PivotTable Fields above the sheet, change Sum to Count. It counts the sales instead of adding up the Amount.',
      ),
      solution: [{ command: { kind: 'pivot', def: def({ fn: 'count' }) } }],
      start: a1,
      prepare: () => withPivot(data),
      check: done({ rows: COL.branch, cols: null, fn: 'count', filter: null }),
      maxKeys: 2,
    },
    {
      id: 'rowsAgent',
      text: t(
        'Ipakita ang kabuuang Amount bawat Agent, sa halip na bawat Branch.',
        'Show the total Amount per Agent, instead of per Branch.',
      ),
      tip: 'PivotTable Fields: Rows: Agent',
      hint: t(
        'Sa PivotTable Fields, palitan ang Rows ng Agent.',
        'In the PivotTable Fields, change the Rows to Agent.',
      ),
      solution: [{ command: { kind: 'pivot', def: def({ rows: COL.agent }) } }],
      start: a1,
      prepare: () => withPivot(data),
      check: done({ rows: COL.agent, cols: null, values: COL.amount, fn: 'sum', filter: null }),
      maxKeys: 2,
    },
    {
      id: 'columnsMonth',
      text: t(
        'Hatiin pa ang bawat Branch ayon sa buwan: ilagay ang Month sa Columns.',
        'Split each Branch by month too: put Month in Columns.',
      ),
      tip: 'PivotTable Fields: Columns: Month',
      hint: t(
        'Sa PivotTable Fields, piliin ang Month sa Columns. Magiging table ito: Branch pababa, buwan pakanan.',
        'In the PivotTable Fields, choose Month in Columns. It becomes a table: Branch going down, months going right.',
      ),
      solution: [{ command: { kind: 'pivot', def: def({ cols: COL.month }) } }],
      start: a1,
      prepare: () => withPivot(data),
      check: done({ rows: COL.branch, cols: COL.month, values: COL.amount, fn: 'sum', filter: null }),
      maxKeys: 2,
    },
    {
      id: 'filterPaid',
      text: t(
        'Paid lang ang isama sa kabuuan: gamitin ang Filters (Status = Paid).',
        'Include only Paid in the totals: use Filters (Status = Paid).',
      ),
      tip: 'PivotTable Fields: Filters: Status, Paid',
      hint: t(
        'Sa PivotTable Fields, piliin ang Status sa Filters, tapos Paid. Hindi na kasama ang Unpaid.',
        'In the PivotTable Fields, choose Status in Filters, then Paid. Unpaid is left out.',
      ),
      solution: [{ command: { kind: 'pivot', def: def({ filter: { col: COL.status, value: 'Paid' } }) } }],
      start: a1,
      prepare: () => withPivot(data),
      check: done({ rows: COL.branch, values: COL.amount, fn: 'sum', filter: { col: COL.status, value: 'Paid' } }),
      maxKeys: 3,
    },
    {
      id: 'refresh',
      text: t(
        `May bagong benta sa Sales (row ${newRow}), pero wala pa ito sa PivotTable. I-refresh ang PivotTable.`,
        `There is a new sale in Sales (row ${newRow}), but it is not in the PivotTable yet. Refresh the PivotTable.`,
      ),
      tip: t('Alt + F5 (o Refresh)', 'Alt + F5 (or Refresh)'),
      hint: t(
        'Hindi kusang nag-a-update ang PivotTable. Alt + F5, o ang Refresh sa PivotTable Fields. (Sa Excel: Data > Refresh All.)',
        'A PivotTable does not update by itself. Alt + F5, or Refresh in the PivotTable Fields. (In Excel: Data > Refresh All.)',
      ),
      solution: [{ press: { key: 'F5', alt: true } }],
      start: a1,
      prepare: () => {
        // The PivotTable was made, THEN a sale was added to the Sales tab.
        const s = switchTab(withPivot(data), 0);
        const cells = s.cells.map((row, r) => (r === data.sales.length + 1 ? [...data.newSale] : row));
        return switchTab({ ...s, cells }, 1);
      },
      check: done({ rows: COL.branch, cols: null, values: COL.amount, fn: 'sum', filter: null }),
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new Sales workbook with one task of every Aralin 14 kind. */
export function makeTaskSet14(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const data = makeData14(rng);
  return { sheet: salesOnly(data), tasks: allTasks14(data, translator(lang)) };
}

/** The Aralin 14 Pagsusulit: a new workbook and all 6 task kinds in random order. */
export function makeQuiz14(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet14(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
