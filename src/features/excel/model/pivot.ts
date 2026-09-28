/**
 * PivotTables (Aralin 14): the table of a tab summarized on a new tab, laid out like Excel's,
 * rebuilt when its fields change or on Refresh (it does not update by itself).
 */

import {
  formatKey,
  isNumberText,
  makeSheet,
  withCells,
  type CellFormat,
  type PivotDef,
  type PivotFn,
  type Pos,
  type Sheet,
} from './core';
import { compareValues } from './values';
import { lastUsed } from './navigation';
import { makeWorkbook, switchTab } from './tabs';

const MONTH_ORDER = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const FN_LABEL: Record<PivotFn, string> = { sum: 'Sum', count: 'Count', average: 'Average' };

/** A tab of the workbook by name (the active one or a stored one). */
function tabByName(s: Sheet, name: string): Sheet | null {
  if (!s.tabs) return null;
  const i = s.tabs.names.indexOf(name);
  if (i < 0) return null;
  return i === s.tabs.index ? s : s.tabs.stored[i];
}

/** A tab's table: the header row (row 1) and every row under it that has something in it. */
export function tableOf(sheet: Sheet): { headers: string[]; rows: string[][] } {
  const width = sheet.cells[0].reduce((w, v, c) => (v !== '' ? c + 1 : w), 0); // up to the last header
  const last = lastUsed(sheet).r;
  const rows = sheet.cells.slice(1, last + 1).filter((row) => row.some((v) => v !== ''));
  return { headers: sheet.cells[0].slice(0, width), rows: rows.map((row) => row.slice(0, width)) };
}

/** The source table of the PivotTable on the active tab (for its field list), or null. */
export function pivotSource(s: Sheet): { headers: string[]; rows: string[][] } | null {
  const source = s.pivot && tabByName(s, s.pivot.source);
  return source ? tableOf(source) : null;
}

/** Excel's order for a pivot's labels: months in calendar order, numbers as numbers, text A to Z. */
function labelOrder(values: string[]): string[] {
  const unique = [...new Set(values)];
  const month = (v: string) => MONTH_ORDER.indexOf(v.slice(0, 3).toLowerCase());
  if (unique.every((v) => month(v) >= 0)) return unique.sort((a, b) => month(a) - month(b));
  return unique.sort(compareValues);
}

const round2 = (x: number) => String(Math.round(x * 100) / 100);

/**
 * The cells of a PivotTable, laid out like Excel's: an optional Filter line, then
 * "Row Labels | Sum of Amount" (or, with Columns: "Sum of Amount | Column Labels" and
 * "Row Labels | Jan | Feb | ... | Grand Total"), one row per label, and a Grand Total row.
 * `valueCells` are the summarized numbers (the view formats Sum and Average as 1,234.50).
 */
export function pivotCells(
  table: { headers: string[]; rows: string[][] },
  def: PivotDef,
): { cells: string[][]; valueCells: Pos[] } {
  const rows = def.filter ? table.rows.filter((r) => r[def.filter!.col] === def.filter!.value) : table.rows;
  const label = (v: string) => (v === '' ? '(blank)' : v);
  const summarize = (subset: string[][]) => {
    const vals = subset.map((r) => r[def.values]).filter((v) => v !== '');
    if (def.fn === 'count') return String(vals.length);
    const nums = vals.filter(isNumberText).map(Number);
    if (nums.length === 0) return '';
    const sum = nums.reduce((a, b) => a + b, 0);
    return round2(def.fn === 'sum' ? sum : sum / nums.length);
  };
  const title = `${FN_LABEL[def.fn]} of ${table.headers[def.values]}`;
  const rowLabels = labelOrder(rows.map((r) => label(r[def.rows])));
  const cells: string[][] = [];
  const valueCells: Pos[] = [];
  if (def.filter) cells.push([table.headers[def.filter.col], def.filter.value], []);
  const put = (row: string[], firstValueCol: number) => {
    const r = cells.length;
    row.forEach((v, c) => c >= firstValueCol && v !== '' && valueCells.push({ r, c }));
    cells.push(row);
  };
  if (def.cols === null) {
    cells.push(['Row Labels', title]);
    for (const l of rowLabels) put([l, summarize(rows.filter((r) => label(r[def.rows]) === l))], 1);
    put(['Grand Total', summarize(rows)], 1);
  } else {
    const colLabels = labelOrder(rows.map((r) => label(r[def.cols!])));
    const inCol = (l: string) => (r: string[]) => label(r[def.cols!]) === l;
    cells.push([title, 'Column Labels'], ['Row Labels', ...colLabels, 'Grand Total']);
    for (const l of rowLabels) {
      const inRow = rows.filter((r) => label(r[def.rows]) === l);
      put([l, ...colLabels.map((cl) => summarize(inRow.filter(inCol(cl)))), summarize(inRow)], 1);
    }
    put(['Grand Total', ...colLabels.map((cl) => summarize(rows.filter(inCol(cl)))), summarize(rows)], 1);
  }
  return { cells, valueCells };
}

const PIVOT_EXTRA_ROWS = 6;

/** A tab holding a PivotTable built from `table` (at least 5 columns wide, rows to spare). */
function pivotSheet(table: { headers: string[]; rows: string[][] }, def: PivotDef, base?: Sheet): Sheet {
  const { cells, valueCells } = pivotCells(table, def);
  const width = Math.max(5, ...cells.map((r) => r.length));
  const formats: Record<string, CellFormat> = {};
  if (def.fn !== 'count') for (const p of valueCells) formats[formatKey(p)] = { number2: true };
  for (const r of [0, 1]) formats[formatKey({ r, c: 0 })] = { bold: true };
  const sheet = makeSheet(cells, Math.max(cells.length + PIVOT_EXTRA_ROWS, base?.cells.length ?? 0), width, {
    formatting: true,
    formats,
    colWidths: ['w-44 min-w-[11rem]', ...Array.from({ length: width - 1 }, () => 'w-28 min-w-[7rem]')],
    freeze: { rows: 0, cols: 0 },
    ...(base?.compute ? { compute: base.compute } : {}),
  });
  return { ...sheet, pivot: def };
}

/** Insert > PivotTable: the active tab's table summarized on a NEW tab ("Pivot"), which comes to the front. */
export function createPivot(s: Sheet, fields: Omit<PivotDef, 'source'>): Sheet {
  const wb = s.tabs ? s : makeWorkbook([{ name: 'Sheet1', sheet: s }]);
  const tabs = wb.tabs!;
  const def: PivotDef = { ...fields, source: tabs.names[tabs.index] };
  let name = 'Pivot';
  for (let n = 2; tabs.names.some((t) => t.toLowerCase() === name.toLowerCase()); n++) name = `Pivot${n}`;
  const added: Sheet = {
    ...wb,
    tabs: {
      names: [...tabs.names, name],
      index: tabs.index,
      stored: [...tabs.stored, pivotSheet(tableOf(wb), def, wb)],
    },
  };
  return switchTab(added, tabs.names.length);
}

/** Build the PivotTable on the active tab again, with these fields, from the source as it is NOW. */
export function setPivot(s: Sheet, def: PivotDef): Sheet {
  const source = tabByName(s, def.source);
  if (!source) return s;
  const fresh = pivotSheet(tableOf(source), def, s);
  return { ...withCells(s, fresh.cells, fresh.formats), pivot: def, colWidths: fresh.colWidths };
}

/** The PivotTable of the workbook (on the active tab or a stored one), with its tab's cells. */
export function findPivot(s: Sheet): { def: PivotDef; cells: string[][]; name: string } | null {
  const all = s.tabs
    ? s.tabs.names.map((name, i) => ({ name, sheet: i === s.tabs!.index ? s : s.tabs!.stored[i]! }))
    : [];
  const hit = (s.pivot ? [{ name: s.tabs?.names[s.tabs.index] ?? '', sheet: s }] : [])
    .concat(all)
    .find((t) => t.sheet.pivot);
  return hit ? { def: hit.sheet.pivot!, cells: hit.sheet.cells, name: hit.name } : null;
}
