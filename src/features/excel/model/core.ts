/**
 * The core of the Excel-like sheet model: the types (Sheet, Pos, SheetCommand, ...), making a
 * sheet, cell names (B3), the selection, and the helpers every other part uses to change a sheet
 * with one Ctrl+Z step (`withCells`, `withRules`, `setCell`).
 */

export type Pos = { r: number; c: number };

/** How a cell looks (Aralin 3). Missing = General, not bold, not text. */
export type CellFormat = {
  /** Typed with an apostrophe: kept as text even if it looks like a number (keeps leading zeros). */
  text?: boolean;
  /** Number with comma and 2 decimals (Ctrl+Shift+1), e.g. 1,500.00. */
  number2?: boolean;
  bold?: boolean;
};

/** One Ctrl+Z step: the cells and their formats before a change. */
/** A block of cells (like a selection): rows top..bottom, columns left..right. */
export type Range = { top: number; left: number; bottom: number; right: number };

/** Conditional Formatting (Aralin 10): cells in `range` turn light red when duplicated / blank. */
export type CondRule = { kind: 'duplicates' | 'blanks'; range: Range };

/** Data Validation, List (Aralin 10): the cells in `range` only accept these values (a dropdown). */
export type ListRule = { range: Range; list: string[] };

/** One Ctrl+Z step: the cells, formats and rules before a change. */
type Snapshot = {
  cells: string[][];
  formats: Record<string, CellFormat>;
  condRules: CondRule[];
  lists: ListRule[];
  hiddenCols: number[];
  colWidths?: string[];
};

export type Sheet = {
  /** cells[row][col], always rows x cols; '' = empty. */
  cells: string[][];
  active: Pos;
  /** The other corner of the selection (same as `active` = one cell). */
  anchor: Pos;
  /**
   * Editing the active cell: 'enter' = started by typing (arrows finish the
   * edit and move, like Excel's Enter mode); 'edit' = started with F2 (arrows
   * move inside the text). null = not editing.
   */
  editing: { value: string; mode: 'enter' | 'edit' } | null;
  clipboard: string[][] | null;
  /** Where the copied block came from (formulas move their references by the distance to the paste). */
  clipboardFrom: Pos | null;
  /** The copied block as SHOWN (formulas computed), for Paste Values (Ctrl+Shift+V, Aralin 9). */
  clipboardValues: string[][] | null;
  /**
   * Formula lessons: computes the formulas (formulaEngine.ts `computeSheet`), so a copy can
   * remember the values for Paste Values. Not set = formulas are not computed (copied as typed).
   */
  compute?: (cells: string[][], tabs?: TabCells) => string[][];
  /** Earlier versions of the cells and formats for Ctrl+Z (newest last). */
  undo: Snapshot[];
  /** Cell formats by "row,col" (only used when `formatting` is on). */
  formats: Record<string, CellFormat>;
  /** true = Excel's number and format rules (Aralin 3+). false = every cell is plain text (Aralin 1-2). */
  formatting: boolean;
  /** The column where a row of Tabs started (Enter goes back to it), or null. */
  tabStartCol: number | null;
  /** The filter arrows are on (Ctrl+Shift+L). */
  filterOn: boolean;
  /** Only rows whose value in `col` is one of `values` are shown (null = all rows shown). */
  filter: { col: number; values: string[] } | null;
  /** Conditional Formatting rules (Aralin 10). */
  condRules: CondRule[];
  /** Dropdown lists, Data Validation (Aralin 10). */
  lists: ListRule[];
  /**
   * A message after a refused entry (a value not in the dropdown list, a bad tab name, ...); cleared by
   * the next key. In both languages (the model does not know the user's language; the view picks one).
   */
  alert: { tl: string; en: string } | null;
  /** Shift+Space / Ctrl+Space (Aralin 12): the selection is whole rows / whole columns. */
  whole: 'rows' | 'cols' | null;
  /** Hidden columns (Ctrl+0, Aralin 12). */
  hiddenCols: number[];
  /** Frozen rows at the top and columns at the left (Freeze Panes). Default: the header row. */
  freeze: { rows: number; cols: number };
  /** Column widths (Tailwind classes) kept with the sheet, so inserting a column moves them too (Aralin 12). */
  colWidths?: string[];
  /**
   * Several sheets (tabs) in one workbook (Aralin 13). This Sheet is the ACTIVE tab; the other
   * tabs are kept whole in `stored` (the active one's place is null) and swapped in by `switchTab`.
   */
  tabs?: Tabs;
  /** A PivotTable tab (Aralin 14): how it is built from its source tab. Its cells are the result. */
  pivot?: PivotDef;
};

/** What a PivotTable summarizes: Sum, Count or Average of a column. */
export type PivotFn = 'sum' | 'count' | 'average';

/**
 * A PivotTable (Aralin 14), Excel's field list: the source tab, the column for the Rows (and
 * optionally the Columns), the column to summarize (Values) and how, and an optional Filter.
 * Columns are indexes in the source tab's header row.
 */
export type PivotDef = {
  source: string;
  rows: number;
  cols: number | null;
  values: number;
  fn: PivotFn;
  filter: { col: number; value: string } | null;
};

export type Tabs = { names: string[]; index: number; stored: (Sheet | null)[] };

/** The other tabs' cells, for formulas like =SUM(Orders!C2:C9) (Aralin 13). */
export type TabCells = { active: string; others: { name: string; cells: string[][] }[] };

/** The data tools of Aralin 4 (from the toolbar, the dialogs, or their shortcuts). */
export type SheetCommand =
  | { kind: 'sort'; asc: boolean }
  | { kind: 'toggleFilter' }
  | { kind: 'setFilter'; col: number; values: string[] | null }
  | { kind: 'find'; text: string }
  | { kind: 'replaceAll'; find: string; replace: string }
  | { kind: 'removeDuplicates' }
  /** Conditional Formatting on the selection (Aralin 10). */
  | { kind: 'condFormat'; rule: CondRule['kind'] }
  /** Clear Rules from the entire sheet. */
  | { kind: 'clearRules' }
  /** Data Validation, List, on the selection. */
  | { kind: 'validation'; list: string[] }
  /** A value picked from the active cell's dropdown list. */
  | { kind: 'pick'; value: string }
  /** Freeze Panes (Aralin 12): this many rows at the top and columns at the left stay in view. */
  | { kind: 'freeze'; rows: number; cols: number }
  /** Go to another tab (a click on it, Aralin 13). */
  | { kind: 'tab'; index: number }
  /** Rename a tab (double-click on it). */
  | { kind: 'renameTab'; index: number; name: string }
  /** Insert > PivotTable (Aralin 14): from the active tab's table, on a new tab. */
  | { kind: 'createPivot'; def: Omit<PivotDef, 'source'> }
  /** Change the fields of the PivotTable on the active tab (it is built again). */
  | { kind: 'pivot'; def: PivotDef }
  /** Refresh the PivotTable on the active tab from its source (Alt+F5). */
  | { kind: 'refreshPivot' }
  /** Text to Columns (Aralin 9): split the selected column at `delimiter`, the parts go from `dest` to the right. */
  | { kind: 'textToColumns'; delimiter: string; dest: Pos }
  /** Opening a dialog: nothing changes in the sheet (counted as one key by the lessons). */
  | { kind: 'open' };

/** A key press as the sheet sees it. */
export type KeyPress = { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean };

/** A browser key event -> KeyPress (Cmd counts as Ctrl on a Mac). */
export function toKeyPress(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey?: boolean;
}): KeyPress {
  return { key: e.key, ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey, alt: e.altKey ?? false };
}

export const isFormula = (v: string) => v.startsWith('=');

/** Column letters -> index: "A" -> 0, "AA" -> 26. */
export function colIndex(letters: string): number {
  return [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
}

const MAX_UNDO = 50;

export function makeSheet(
  data: string[][],
  rows: number,
  cols: number,
  options: {
    formatting?: boolean;
    formats?: Record<string, CellFormat>;
    compute?: (cells: string[][], tabs?: TabCells) => string[][];
    freeze?: { rows: number; cols: number };
    colWidths?: string[];
  } = {},
): Sheet {
  const cells = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => data[r]?.[c] ?? ''));
  return {
    cells,
    active: { r: 0, c: 0 },
    anchor: { r: 0, c: 0 },
    editing: null,
    clipboard: null,
    clipboardFrom: null,
    clipboardValues: null,
    ...(options.compute ? { compute: options.compute } : {}),
    undo: [],
    tabStartCol: null,
    formats: options.formats ?? {},
    formatting: options.formatting ?? false,
    filterOn: false,
    filter: null,
    condRules: [],
    lists: [],
    alert: null,
    whole: null,
    hiddenCols: [],
    freeze: options.freeze ?? { rows: 1, cols: 0 },
    ...(options.colWidths ? { colWidths: options.colWidths } : {}),
  };
}

export const formatKey = (p: Pos) => `${p.r},${p.c}`;

export function formatOf(s: Sheet, p: Pos): CellFormat {
  return s.formats[formatKey(p)] ?? {};
}

/** Digits only (with an optional minus and decimals): Excel treats it as a number. */
export function isNumberText(v: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(v);
}

/** 0 -> "A", 25 -> "Z", 26 -> "AA" */
export function colLetter(c: number): string {
  let n = c + 1;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** {r: 2, c: 1} -> "B3" */
export function cellName(p: Pos): string {
  return `${colLetter(p.c)}${p.r + 1}`;
}

/** "B2", "$B$2" or "=$B$2" -> { r: 1, c: 1 }; anything else -> null. */
export function parseCellName(name: string): Pos | null {
  const m = /^=?\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(name.trim());
  if (!m || Number(m[2]) < 1) return null;
  return { r: Number(m[2]) - 1, c: colIndex(m[1].toUpperCase()) };
}

/** The selected rectangle (top-left and bottom-right). */
export function selectionRange(s: Sheet): { top: number; left: number; bottom: number; right: number } {
  const range = {
    top: Math.min(s.active.r, s.anchor.r),
    bottom: Math.max(s.active.r, s.anchor.r),
    left: Math.min(s.active.c, s.anchor.c),
    right: Math.max(s.active.c, s.anchor.c),
  };
  // Shift+Space / Ctrl+Space: the whole rows / columns of the selection.
  if (s.whole === 'rows') return { ...range, left: 0, right: cols(s) - 1 };
  if (s.whole === 'cols') return { ...range, top: 0, bottom: rows(s) - 1 };
  return range;
}

/** "B2:B25", or just "B2" for one cell. */
export function selectionName(s: Sheet): string {
  const { top, left, bottom, right } = selectionRange(s);
  const a = cellName({ r: top, c: left });
  const b = cellName({ r: bottom, c: right });
  return a === b ? a : `${a}:${b}`;
}

export function isSelected(s: Sheet, p: Pos): boolean {
  const { top, left, bottom, right } = selectionRange(s);
  return p.r >= top && p.r <= bottom && p.c >= left && p.c <= right;
}

export const rows = (s: Sheet) => s.cells.length;

export const cols = (s: Sheet) => s.cells[0]?.length ?? 0;

export const filled = (s: Sheet, p: Pos) => (s.cells[p.r]?.[p.c] ?? '') !== '';

export const inside = (s: Sheet, p: Pos) => p.r >= 0 && p.c >= 0 && p.r < rows(s) && p.c < cols(s);

export const clampPos = (s: Sheet, p: Pos): Pos => ({
  r: Math.min(Math.max(p.r, 0), rows(s) - 1),
  c: Math.min(Math.max(p.c, 0), cols(s) - 1),
});

export function withCells(s: Sheet, cells: string[][], formats: Record<string, CellFormat> = s.formats): Sheet {
  return { ...s, cells, formats, undo: [...s.undo, snapshot(s)].slice(-MAX_UNDO) };
}

const snapshot = (s: Sheet): Snapshot => ({
  cells: s.cells,
  formats: s.formats,
  condRules: s.condRules,
  lists: s.lists,
  hiddenCols: s.hiddenCols,
  colWidths: s.colWidths,
});

/** New Conditional Formatting rules, dropdown lists, hidden columns or widths, as one Ctrl+Z step. */
export function withRules(
  s: Sheet,
  rules: { condRules?: CondRule[]; lists?: ListRule[]; hiddenCols?: number[]; colWidths?: string[] },
): Sheet {
  return { ...s, ...rules, undo: [...s.undo, snapshot(s)].slice(-MAX_UNDO) };
}

/** A new formats object with `change` applied to every cell in `cellsToChange`. */
export function withFormats(
  s: Sheet,
  cellsToChange: Pos[],
  change: (f: CellFormat) => CellFormat,
): Record<string, CellFormat> {
  const formats = { ...s.formats };
  for (const p of cellsToChange) formats[formatKey(p)] = change(formats[formatKey(p)] ?? {});
  return formats;
}

export function selectedCells(s: Sheet): Pos[] {
  const { top, left, bottom, right } = selectionRange(s);
  const out: Pos[] = [];
  for (let r = top; r <= bottom; r++) for (let c = left; c <= right; c++) out.push({ r, c });
  return out;
}

export function setCell(s: Sheet, p: Pos, value: string): Sheet {
  if (s.cells[p.r][p.c] === value) return s;
  const cells = s.cells.map((row, r) => (r === p.r ? row.map((v, c) => (c === p.c ? value : v)) : row));
  return withCells(s, cells);
}
