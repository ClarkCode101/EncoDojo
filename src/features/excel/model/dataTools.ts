/**
 * The data tools (Aralin 4 and 9): sort, filter (hidden rows), find, replace all, remove
 * duplicates, Flash Fill (Ctrl+E) and Text to Columns.
 */

import { cols, inside, isFormula, rows, selectionRange, withCells, type Pos, type Sheet } from './core';
import { compareValues, excelValue } from './values';
import { lastUsed, moveTo } from './navigation';

/** Capital first letter of every word, like Excel's PROPER. */
const properCase = (t: string) =>
  t.toLowerCase().replace(/(^|[^a-z])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());

/** The pieces Flash Fill can take from one cell: "Dela Cruz, Juan" -> "Dela Cruz", "Juan", "Juan Dela Cruz", ... */
const FLASH_PIECES: ((v: string) => string | null)[] = [
  (v) => v,
  // Parts around a comma (Last, First).
  (v) => (v.includes(',') ? v.split(',')[0].trim() : null),
  (v) => (v.includes(',') ? v.split(',').slice(1).join(',').trim() : null),
  (v) => (v.includes(',') ? `${v.split(',').slice(1).join(',').trim()} ${v.split(',')[0].trim()}` : null),
  // Words.
  (v) => (v.trim().includes(' ') ? v.trim().split(/\s+/)[0] : null),
  (v) => (v.trim().includes(' ') ? v.trim().split(/\s+/).slice(-1)[0] : null),
  (v) => (v.trim().includes(' ') ? v.trim().split(/\s+/).slice(0, -1).join(' ') : null),
  (v) => (v.trim().includes(' ') ? v.trim().split(/\s+/).slice(1).join(' ') : null),
  // Parts around a dash (TN-00457).
  (v) => (v.includes('-') ? v.split('-')[0].trim() : null),
  (v) => (v.includes('-') ? v.split('-').slice(-1)[0].trim() : null),
];

const FLASH_CASES: ((t: string) => string)[] = [(t) => t, (t) => t.toUpperCase(), (t) => t.toLowerCase(), properCase];

/**
 * Ctrl+E, Flash Fill: the typed examples in the active column (rows above, or the active cell)
 * show the pattern; the empty cells of that column in the table are filled the same way.
 * It looks for ONE rule (a piece of one other cell of the row, in some capitals) that gives
 * every example; columns on the left are tried first, nearest first. No rule = nothing happens.
 */
export function flashFill(s: Sheet): Sheet {
  const col = s.active.c;
  const last = lastDataRow(s);
  const rowsIdx = Array.from({ length: last }, (_, i) => i + 1);
  const examples = rowsIdx.filter((r) => s.cells[r][col] !== '');
  const targets = rowsIdx.filter((r) => s.cells[r][col] === '');
  if (examples.length === 0 || targets.length === 0) return s;
  const others = Array.from({ length: cols(s) }, (_, c) => c)
    .filter((c) => c !== col)
    .sort((a, b) => (a < col === b < col ? Math.abs(a - col) - Math.abs(b - col) : a < col ? -1 : 1));
  for (const src of others) {
    for (const piece of FLASH_PIECES) {
      for (const change of FLASH_CASES) {
        const rule = (r: number) => {
          const v = s.cells[r][src];
          const p = v === '' || isFormula(v) ? null : piece(v);
          return p === null || p === '' ? null : change(p);
        };
        if (!examples.every((r) => rule(r) === s.cells[r][col])) continue;
        const cells = s.cells.map((row, r) =>
          targets.includes(r) && rule(r) !== null ? row.map((v, c) => (c === col ? rule(r)! : v)) : row,
        );
        return withCells(s, cells);
      }
    }
  }
  return s;
}

/**
 * Text to Columns: every selected cell of the first selected column is split at `delimiter`;
 * the parts go into the cells from `dest` to the right (row by row). Like Excel, spaces next to
 * the delimiter stay (" Juan") and number-looking parts become numbers (00457 -> 457).
 */
export function textToColumns(s: Sheet, delimiter: string, dest: Pos): Sheet {
  if (!delimiter) return s;
  const { top, left, bottom } = selectionRange(s);
  const cells = s.cells.map((row) => [...row]);
  for (let r = top; r <= bottom; r++) {
    const value = s.cells[r][left];
    if (value === '' || isFormula(value)) continue;
    value.split(delimiter).forEach((part, k) => {
      const p = { r: dest.r + (r - top), c: dest.c + k };
      if (inside(s, p)) cells[p.r][p.c] = s.formatting ? excelValue(part).value : part;
    });
  }
  const changed = cells.some((row, r) => row.some((v, c) => v !== s.cells[r][c]));
  return changed ? withCells(s, cells) : s;
}

/** The last row with any data (the table is rows 1..this; row 0 is the header). */
function lastDataRow(s: Sheet): number {
  return lastUsed(s).r;
}

/** True when a filter hides this row (the header row is never hidden). */
export function isHidden(s: Sheet, r: number): boolean {
  if (!s.filter || r <= 0 || r > lastDataRow(s)) return false;
  return !s.filter.values.includes(s.cells[r][s.filter.col]);
}

/** The different values of a column (for the filter list), sorted. */
export function columnValues(s: Sheet, col: number): string[] {
  const values = new Set<string>();
  for (let r = 1; r <= lastDataRow(s); r++) values.add(s.cells[r][col]);
  return [...values].sort((a, b) => a.localeCompare(b));
}

/** Rows 1..last sorted by the active column (the header stays on top). */
export function sortRows(s: Sheet, asc: boolean): Sheet {
  const last = lastDataRow(s);
  const col = s.active.c;
  const body = s.cells.slice(1, last + 1);
  // Empty cells stay at the bottom either way (like Excel).
  const sorted = [...body].sort((x, y) => {
    const a = x[col];
    const b = y[col];
    if (a === '' || b === '') return compareValues(a, b);
    return asc ? compareValues(a, b) : compareValues(b, a);
  });
  return withCells(s, [s.cells[0], ...sorted, ...s.cells.slice(last + 1)]);
}

const escapeRegExp = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** How many times `find` appears in all the cells (not case-sensitive, like Excel's default). */
export function countMatches(s: Sheet, find: string): number {
  if (!find) return 0;
  const re = new RegExp(escapeRegExp(find), 'gi');
  return s.cells.reduce((n, row) => n + row.reduce((m, v) => m + (v.match(re)?.length ?? 0), 0), 0);
}

/** The next cell (after the active one, row by row) that contains `text`; hidden rows are skipped. */
export function findNext(s: Sheet, text: string): Sheet {
  if (!text) return s;
  const needle = text.toLowerCase();
  const rowsN = rows(s);
  const colsN = cols(s);
  const total = rowsN * colsN;
  const start = s.active.r * colsN + s.active.c;
  for (let i = 1; i <= total; i++) {
    const at = (start + i) % total;
    const p = { r: Math.floor(at / colsN), c: at % colsN };
    if (!isHidden(s, p.r) && s.cells[p.r][p.c].toLowerCase().includes(needle)) return moveTo(s, p);
  }
  return s;
}

export function replaceAll(s: Sheet, find: string, replace: string): Sheet {
  if (!find || countMatches(s, find) === 0) return s;
  const re = new RegExp(escapeRegExp(find), 'gi');
  return withCells(
    s,
    s.cells.map((row) => row.map((v) => v.replace(re, () => replace))),
  );
}

/** Remove rows that are exactly the same as an earlier row (the first one stays); the rest move up. */
export function removeDuplicateRows(s: Sheet): Sheet {
  const last = lastDataRow(s);
  const seen = new Set<string>();
  const kept: string[][] = [];
  for (let r = 1; r <= last; r++) {
    const k = JSON.stringify(s.cells[r]);
    if (seen.has(k)) continue;
    seen.add(k);
    kept.push(s.cells[r]);
  }
  if (kept.length === last) return s;
  const empty = () => Array.from({ length: cols(s) }, () => '');
  const removed = last - kept.length;
  const cells = [s.cells[0], ...kept, ...Array.from({ length: removed }, empty), ...s.cells.slice(last + 1)];
  return { ...withCells(s, cells), active: { r: 0, c: 0 }, anchor: { r: 0, c: 0 } };
}

/** How many duplicate rows Remove Duplicates would take away (for its message). */
export function countDuplicates(s: Sheet): number {
  const last = lastDataRow(s);
  return last - new Set(s.cells.slice(1, last + 1).map((row) => JSON.stringify(row))).size;
}
