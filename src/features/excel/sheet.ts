/**
 * A small Excel-like spreadsheet model (Phase 3, Excel Practice). Pure
 * functions, no React, so every shortcut is easy to test (sheet.test.ts).
 *
 * What it does, the way Excel does it:
 * - Arrows move; Shift+Arrow extends the selection.
 * - Ctrl+Arrow jumps to the edge of the data (Ctrl+Shift+Arrow selects to it).
 * - Home = column A; Ctrl+Home = A1; Ctrl+End = the last used cell.
 * - Enter / Tab move down / right (Shift = back); typing starts a new value,
 *   F2 edits the current one, Esc cancels, Delete clears the selection.
 * - Ctrl+C / Ctrl+V copy and paste (inside the sheet), Ctrl+Z undoes,
 *   Ctrl+A selects the data.
 * - Data entry (Aralin 2): after Tab, Enter goes back to the column where the
 *   Tabs started (next row); Ctrl+D fills down; Ctrl+Enter puts what you typed
 *   in every selected cell; Ctrl+; types today's date. Typing keeps the
 *   selection (so Ctrl+Enter can fill it).
 * - Formatting (Aralin 3), only on sheets made with `formatting: true` so the
 *   earlier lessons keep plain text cells: digits-only entries become numbers
 *   (00457 -> 457, like Excel) unless typed with an apostrophe ('00457 stays
 *   text); numbers sit on the right, text on the left; Ctrl+Shift+1 = number
 *   with comma and 2 decimals; Ctrl+B = bold; Ctrl+Z undoes formats too.
 * - Data tools (Aralin 4): sort the table by the active column, filter
 *   (Ctrl+Shift+L, then pick the values of a column; hidden rows are skipped
 *   by the arrows), find (next match), replace all, remove duplicate rows.
 *   They run through `runCommand` (the toolbar and dialogs of the view call
 *   it); Ctrl+Z undoes them.
 * - Formulas (Aralin 5): a cell that starts with "=" is a formula; the sheet
 *   keeps the formula text and the lesson computes it with HyperFormula
 *   (formulaEngine.ts, loaded only for the formula lessons). Here: copying a
 *   formula (Ctrl+D, Ctrl+V, Ctrl+Enter) moves its cell references like Excel
 *   (`shiftFormula`, $ keeps a part fixed), and Alt+= is AutoSum.
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
type Snapshot = { cells: string[][]; formats: Record<string, CellFormat> };

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
};

/** The data tools of Aralin 4 (from the toolbar, the dialogs, or their shortcuts). */
export type SheetCommand =
  | { kind: 'sort'; asc: boolean }
  | { kind: 'toggleFilter' }
  | { kind: 'setFilter'; col: number; values: string[] | null }
  | { kind: 'find'; text: string }
  | { kind: 'replaceAll'; find: string; replace: string }
  | { kind: 'removeDuplicates' }
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

// ---------- formulas (Aralin 5) ----------

export const isFormula = (v: string) => v.startsWith('=');

/** Column letters -> index: "A" -> 0, "AA" -> 26. */
function colIndex(letters: string): number {
  return [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
}

/**
 * The formula as it would be after copying it `dr` rows down and `dc` columns
 * right, like Excel: =B2*C2 copied one row down -> =B3*C3. A part with $ stays
 * ($A$1 never moves, A$1 keeps its row). Text in quotes is left alone.
 * A reference pushed off the sheet becomes #REF!.
 */
export function shiftFormula(formula: string, dr: number, dc: number): string {
  if (!isFormula(formula) || (dr === 0 && dc === 0)) return formula;
  return formula
    .split(/("[^"]*")/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(
            /(^|[^A-Za-z0-9_$.])(\$?)([A-Z]{1,3})(\$?)(\d+)(?![A-Za-z0-9_(])/g,
            (_m, before: string, colAbs: string, col: string, rowAbs: string, row: string) => {
              const c = colAbs ? colIndex(col) : colIndex(col) + dc;
              const r = rowAbs ? Number(row) : Number(row) + dr;
              if (c < 0 || r < 1) return `${before}#REF!`;
              return `${before}${colAbs}${colLetter(c)}${rowAbs}${r}`;
            },
          ),
    )
    .join('');
}

/** A value copied from `from` to `to`: formulas move their references, anything else stays. */
function copiedValue(v: string, from: Pos, to: Pos): string {
  return isFormula(v) ? shiftFormula(v, to.r - from.r, to.c - from.c) : v;
}

/**
 * Alt+= (AutoSum): =SUM of the numbers right above the active cell (or, if
 * none, right to its left), ready to be saved with Enter.
 */
function autoSum(s: Sheet): Sheet {
  const { r, c } = s.active;
  const numeric = (p: Pos) => {
    const v = s.cells[p.r]?.[p.c] ?? '';
    return isNumberText(v) || isFormula(v);
  };
  let top = r;
  while (top - 1 >= 0 && numeric({ r: top - 1, c })) top--;
  let formula: string;
  if (top < r) {
    formula = `=SUM(${colLetter(c)}${top + 1}:${colLetter(c)}${r})`;
  } else {
    let left = c;
    while (left - 1 >= 0 && numeric({ r, c: left - 1 })) left--;
    formula = left < c ? `=SUM(${colLetter(left)}${r + 1}:${colLetter(c - 1)}${r + 1})` : '=SUM()';
  }
  return { ...s, anchor: s.active, editing: { value: formula, mode: 'enter' } };
}

const MAX_UNDO = 50;

export function makeSheet(
  data: string[][],
  rows: number,
  cols: number,
  options: { formatting?: boolean; formats?: Record<string, CellFormat> } = {},
): Sheet {
  const cells = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => data[r]?.[c] ?? ''));
  return {
    cells,
    active: { r: 0, c: 0 },
    anchor: { r: 0, c: 0 },
    editing: null,
    clipboard: null,
    clipboardFrom: null,
    undo: [],
    tabStartCol: null,
    formats: options.formats ?? {},
    formatting: options.formatting ?? false,
    filterOn: false,
    filter: null,
  };
}

// ---------- formats (Aralin 3) ----------

export const formatKey = (p: Pos) => `${p.r},${p.c}`;

export function formatOf(s: Sheet, p: Pos): CellFormat {
  return s.formats[formatKey(p)] ?? {};
}

/** Digits only (with an optional minus and decimals): Excel treats it as a number. */
export function isNumberText(v: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(v);
}

/**
 * A computed formula value that is TEXT looking like a number: formulaEngine.ts marks it
 * with an apostrophe ("'00457"). Returns the text without the mark, or null for anything else.
 */
export function computedText(v: string): string | null {
  return v.startsWith("'") && isNumberText(v.slice(1)) ? v.slice(1) : null;
}

/** A number the sheet treats as a number (not text) in this cell. */
function isNumberCell(s: Sheet, p: Pos): boolean {
  return s.formatting && !formatOf(s, p).text && isNumberText(s.cells[p.r][p.c]);
}

/** What the cell shows, e.g. 1500 with Ctrl+Shift+1 -> "1,500.00". */
export function displayValue(s: Sheet, p: Pos): string {
  const v = s.cells[p.r][p.c];
  if (isNumberCell(s, p) && formatOf(s, p).number2) {
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return v;
}

/** Numbers sit on the right of the cell, text on the left (like Excel). */
export function alignsRight(s: Sheet, p: Pos): boolean {
  return isNumberCell(s, p);
}

/** What the formula bar (and F2) shows: text that looks like a number keeps its apostrophe. */
export function formulaBarValue(s: Sheet, p: Pos): string {
  const v = s.cells[p.r][p.c];
  return s.formatting && formatOf(s, p).text && isNumberText(v) ? `'${v}` : v;
}

/**
 * What a typed entry becomes, the way Excel stores it:
 * 'text -> text (apostrophe removed), 00457 -> 457 (a number), anything else as typed.
 */
export function excelValue(raw: string): { value: string; text: boolean } {
  if (raw.startsWith("'")) return { value: raw.slice(1), text: true };
  if (isFormula(raw)) {
    // Like Excel: names and cell references in capitals (=sum(b2:b9) -> =SUM(B2:B9), so copying
    // moves them), but text in quotes kept as typed; missing closing parentheses are added.
    const upper = raw
      .split(/("[^"]*")/)
      .map((part, i) => (i % 2 === 1 ? part : part.toUpperCase()))
      .join('');
    const missing = (upper.match(/\(/g)?.length ?? 0) - (upper.match(/\)/g)?.length ?? 0);
    return { value: missing > 0 ? upper + ')'.repeat(missing) : upper, text: false };
  }
  if (isNumberText(raw)) return { value: String(Number(raw)), text: false };
  return { value: raw, text: false };
}

// ---------- names ----------

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

/** The selected rectangle (top-left and bottom-right). */
export function selectionRange(s: Sheet): { top: number; left: number; bottom: number; right: number } {
  return {
    top: Math.min(s.active.r, s.anchor.r),
    bottom: Math.max(s.active.r, s.anchor.r),
    left: Math.min(s.active.c, s.anchor.c),
    right: Math.max(s.active.c, s.anchor.c),
  };
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

// ---------- moving ----------

const rows = (s: Sheet) => s.cells.length;
const cols = (s: Sheet) => s.cells[0]?.length ?? 0;
const filled = (s: Sheet, p: Pos) => (s.cells[p.r]?.[p.c] ?? '') !== '';
const inside = (s: Sheet, p: Pos) => p.r >= 0 && p.c >= 0 && p.r < rows(s) && p.c < cols(s);
const clampPos = (s: Sheet, p: Pos): Pos => ({
  r: Math.min(Math.max(p.r, 0), rows(s) - 1),
  c: Math.min(Math.max(p.c, 0), cols(s) - 1),
});

/**
 * Where Ctrl+Arrow lands from `from` (Excel's rule):
 * - on data, with data next to it: the last filled cell of that run;
 * - otherwise: the next filled cell in that direction, or the sheet's edge.
 */
export function ctrlJump(s: Sheet, from: Pos, dr: number, dc: number): Pos {
  let next = { r: from.r + dr, c: from.c + dc };
  if (!inside(s, next)) return from;
  if (filled(s, from) && filled(s, next)) {
    while (inside(s, { r: next.r + dr, c: next.c + dc }) && filled(s, { r: next.r + dr, c: next.c + dc })) {
      next = { r: next.r + dr, c: next.c + dc };
    }
    return next;
  }
  while (!filled(s, next) && inside(s, { r: next.r + dr, c: next.c + dc })) {
    next = { r: next.r + dr, c: next.c + dc };
  }
  return next;
}

/** The last used cell (Ctrl+End): the last row and the last column that have any data. */
export function lastUsed(s: Sheet): Pos {
  let r = 0;
  let c = 0;
  s.cells.forEach((row, ri) =>
    row.forEach((v, ci) => {
      if (v !== '') {
        r = Math.max(r, ri);
        c = Math.max(c, ci);
      }
    }),
  );
  return { r, c };
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Move the active cell; with `extend` the anchor stays (the selection grows). */
function moveTo(s: Sheet, p: Pos, extend = false): Sheet {
  const active = clampPos(s, p);
  return { ...s, active, anchor: extend ? s.anchor : active, tabStartCol: null };
}

/** A click on a cell (Shift+click extends the selection). Ends an edit first, like Excel. */
export function clickCell(s: Sheet, p: Pos, extend = false): Sheet {
  const base = s.editing ? commit(s) : s;
  return moveTo(base, p, extend);
}

/** Double-click on a cell: edit it (like F2 there). */
export function editCell(s: Sheet, p: Pos): Sheet {
  const at = clickCell(s, p);
  return { ...at, editing: { value: formulaBarValue(at, p), mode: 'edit' } };
}

/** Tab / Shift+Tab: move sideways and remember where the row of Tabs started. */
function tab(s: Sheet, back: boolean): Sheet {
  const start = s.tabStartCol ?? s.active.c;
  return { ...moveTo(s, { r: s.active.r, c: s.active.c + (back ? -1 : 1) }), tabStartCol: start };
}

/** Enter / Shift+Enter: down (or up); after Tabs, back to the column where they started. */
function enter(s: Sheet, up: boolean): Sheet {
  return moveTo(s, { r: s.active.r + (up ? -1 : 1), c: s.tabStartCol ?? s.active.c });
}

/** Today as mm/dd/yyyy (Ctrl+;), the date format used everywhere in EncoDojo. */
export function todayText(now: Date = new Date()): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${now.getFullYear()}`;
}

// ---------- editing ----------

function withCells(s: Sheet, cells: string[][], formats: Record<string, CellFormat> = s.formats): Sheet {
  return { ...s, cells, formats, undo: [...s.undo, { cells: s.cells, formats: s.formats }].slice(-MAX_UNDO) };
}

/** A new formats object with `change` applied to every cell in `cellsToChange`. */
function withFormats(
  s: Sheet,
  cellsToChange: Pos[],
  change: (f: CellFormat) => CellFormat,
): Record<string, CellFormat> {
  const formats = { ...s.formats };
  for (const p of cellsToChange) formats[formatKey(p)] = change(formats[formatKey(p)] ?? {});
  return formats;
}

function selectedCells(s: Sheet): Pos[] {
  const { top, left, bottom, right } = selectionRange(s);
  const out: Pos[] = [];
  for (let r = top; r <= bottom; r++) for (let c = left; c <= right; c++) out.push({ r, c });
  return out;
}

/** Ctrl+B: bold the selection (or un-bold it, if the active cell is already bold). */
function toggleBold(s: Sheet): Sheet {
  const bold = !formatOf(s, s.active).bold;
  return withCells(
    s,
    s.cells,
    withFormats(s, selectedCells(s), (f) => ({ ...f, bold })),
  );
}

/** Ctrl+Shift+1 (number with comma and 2 decimals) or Ctrl+Shift+~ (back to General). */
function setNumberFormat(s: Sheet, number2: boolean): Sheet {
  return withCells(
    s,
    s.cells,
    withFormats(s, selectedCells(s), (f) => ({ ...f, number2 })),
  );
}

function setCell(s: Sheet, p: Pos, value: string): Sheet {
  if (s.cells[p.r][p.c] === value) return s;
  const cells = s.cells.map((row, r) => (r === p.r ? row.map((v, c) => (c === p.c ? value : v)) : row));
  return withCells(s, cells);
}

/** Save what is being typed into the active cell (and stop editing). With formatting: Excel's number rules. */
function commit(s: Sheet): Sheet {
  if (!s.editing) return s;
  if (!s.formatting) return { ...setCell(s, s.active, s.editing.value), editing: null };
  const { value, text } = excelValue(s.editing.value);
  const cells = s.cells.map((row, r) => (r === s.active.r ? row.map((v, c) => (c === s.active.c ? value : v)) : row));
  return {
    ...withCells(
      s,
      cells,
      withFormats(s, [s.active], (f) => ({ ...f, text })),
    ),
    editing: null,
  };
}

/** The value typed in the edit box changed (the React input calls this). */
export function typeInCell(s: Sheet, value: string): Sheet {
  return s.editing ? { ...s, editing: { ...s.editing, value } } : s;
}

function clearSelection(s: Sheet): Sheet {
  const { top, left, bottom, right } = selectionRange(s);
  let changed = false;
  const cells = s.cells.map((row, r) =>
    row.map((v, c) => {
      if (r >= top && r <= bottom && c >= left && c <= right && v !== '') {
        changed = true;
        return '';
      }
      return v;
    }),
  );
  return changed ? withCells(s, cells) : s;
}

function copySelection(s: Sheet): Sheet {
  const { top, left, bottom, right } = selectionRange(s);
  const clip = s.cells.slice(top, bottom + 1).map((row) => row.slice(left, right + 1));
  return { ...s, clipboard: clip, clipboardFrom: { r: top, c: left } };
}

/** Paste at the active cell (top-left of the pasted block); the pasted block becomes the selection. */
function paste(s: Sheet): Sheet {
  const clip = s.clipboard;
  if (!clip) return s;
  const { r: r0, c: c0 } = s.active;
  const cells = s.cells.map((row, r) =>
    row.map((v, c) => {
      const cr = r - r0;
      const cc = c - c0;
      if (!(cr >= 0 && cc >= 0 && cr < clip.length && cc < clip[0].length)) return v;
      const from = s.clipboardFrom ?? { r: r0, c: c0 };
      return copiedValue(clip[cr][cc], { r: from.r + cr, c: from.c + cc }, { r, c });
    }),
  );
  const end = clampPos(s, { r: r0 + clip.length - 1, c: c0 + clip[0].length - 1 });
  return { ...withCells(s, cells), active: { r: r0, c: c0 }, anchor: end };
}

/**
 * Ctrl+D (fill down): one cell = copy the cell above it; a selection = copy
 * the top row of the selection into the rows below it.
 */
function fillDown(s: Sheet): Sheet {
  const { top, left, bottom, right } = selectionRange(s);
  const source = top === bottom ? top - 1 : top;
  if (source < 0) return s;
  const from = top === bottom ? top : top + 1;
  const cells = s.cells.map((row, r) =>
    r >= from && r <= bottom
      ? row.map((v, c) => (c >= left && c <= right ? copiedValue(s.cells[source][c], { r: source, c }, { r, c }) : v))
      : row,
  );
  const changed = cells.some((row, r) => row.some((v, c) => v !== s.cells[r][c]));
  return changed ? withCells(s, cells) : s;
}

/** Ctrl+Enter while typing: the value goes into EVERY selected cell; the selection stays. */
function fillSelection(s: Sheet): Sheet {
  if (!s.editing) return s;
  const { value, text } = s.formatting ? excelValue(s.editing.value) : { value: s.editing.value, text: false };
  const { top, left, bottom, right } = selectionRange(s);
  const cells = s.cells.map((row, r) =>
    r >= top && r <= bottom
      ? row.map((v, c) => (c >= left && c <= right ? copiedValue(value, s.active, { r, c }) : v))
      : row,
  );
  const formats = s.formatting ? withFormats(s, selectedCells(s), (f) => ({ ...f, text })) : s.formats;
  return { ...withCells(s, cells, formats), editing: null };
}

function undo(s: Sheet): Sheet {
  if (s.undo.length === 0) return s;
  const last = s.undo[s.undo.length - 1];
  return { ...s, cells: last.cells, formats: last.formats, undo: s.undo.slice(0, -1), editing: null };
}

/** True for a key that types a character (a letter, digit, space, symbol). */
export function isTypingKey(k: KeyPress): boolean {
  return k.key.length === 1 && !k.ctrl;
}

// ---------- the key handler ----------

/**
 * The sheet after one key press. Returns the same object when the key does
 * nothing, so the caller can tell "handled" from "ignored" (`handled`).
 */
export function pressKey(s: Sheet, k: KeyPress): Sheet {
  const key = k.key;
  const ctrl = !!k.ctrl;
  const shift = !!k.shift;

  // ----- while editing a cell -----
  if (s.editing) {
    if (key === 'Escape') return { ...s, editing: null };
    if (key === 'Enter' && ctrl) return fillSelection(s);
    if (key === ';' && ctrl) return { ...s, editing: { ...s.editing, value: s.editing.value + todayText() } };
    if (key === 'Enter') return enter(commit(s), shift);
    if (key === 'Tab') return tab(commit(s), shift);
    if (s.editing.mode === 'enter' && ARROWS[key]) {
      const [dr, dc] = ARROWS[key];
      return moveTo(commit(s), { r: s.active.r + dr, c: s.active.c + dc });
    }
    if (key === 'F2') return { ...s, editing: { ...s.editing, mode: s.editing.mode === 'enter' ? 'edit' : 'enter' } };
    return s; // other keys go to the text box itself
  }

  // ----- not editing -----
  if (ARROWS[key]) {
    const [dr, dc] = ARROWS[key];
    let target = ctrl ? ctrlJump(s, s.active, dr, dc) : { r: s.active.r + dr, c: s.active.c + dc };
    // Rows hidden by a filter are skipped, like Excel.
    while (!ctrl && dr !== 0 && isHidden(s, target.r) && inside(s, { r: target.r + dr, c: target.c })) {
      target = { r: target.r + dr, c: target.c };
    }
    return moveTo(s, target, shift);
  }
  if (key === 'Home') return moveTo(s, ctrl ? { r: 0, c: 0 } : { r: s.active.r, c: 0 }, shift);
  if (key === 'End' && ctrl) return moveTo(s, lastUsed(s), shift);
  if (key === 'Enter' && !ctrl) return enter(s, shift);
  if (key === 'Tab') return tab(s, shift);
  if (key === 'F2') return { ...s, anchor: s.active, editing: { value: formulaBarValue(s, s.active), mode: 'edit' } };
  if (key === 'Delete') return clearSelection(s);
  if (key === 'Backspace') {
    // Like Excel: empties the cell and starts typing in it.
    return { ...setCell(s, s.active, ''), anchor: s.active, editing: { value: '', mode: 'enter' } };
  }
  if (ctrl) {
    const lower = key.toLowerCase();
    if (lower === 'c') return copySelection(s);
    if (lower === 'v') return paste(s);
    if (lower === 'z') return undo(s);
    if (lower === 'a') return { ...s, anchor: { r: 0, c: 0 }, active: lastUsed(s) };
    if (lower === 'd') return fillDown(s);
    if (lower === 'l' && shift) return runCommand(s, { kind: 'toggleFilter' });
    if (s.formatting) {
      if (lower === 'b') return toggleBold(s);
      // Ctrl+Shift+1: on most keyboards Shift+1 gives "!", so both are accepted.
      if (shift && (key === '!' || key === '1')) return setNumberFormat(s, true);
      if (shift && (key === '~' || key === '`')) return setNumberFormat(s, false);
    }
    // Ctrl+; = today's date, ready to be saved with Enter (Excel's Enter mode).
    if (key === ';') return { ...s, editing: { value: todayText(), mode: 'enter' } };
    return s;
  }
  if (k.alt && key === '=') return autoSum(s);
  if (isTypingKey(k)) {
    // Typing replaces the cell's value (Excel's Enter mode). The selection stays, for Ctrl+Enter.
    return { ...s, editing: { value: key, mode: 'enter' } };
  }
  return s;
}

/** True when `pressKey` did something with this key (so the browser's default should be stopped). */
export function handled(before: Sheet, after: Sheet): boolean {
  return before !== after;
}

// ---------- data tools (Aralin 4) ----------

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

/** Compare two cell values like Excel: numbers as numbers, text A-Z (ignoring case). Empty cells last. */
function compareValues(a: string, b: string): number {
  if (a === '' || b === '') return a === b ? 0 : a === '' ? 1 : -1;
  if (isNumberText(a) && isNumberText(b)) return Number(a) - Number(b);
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/** Rows 1..last sorted by the active column (the header stays on top). */
function sortRows(s: Sheet, asc: boolean): Sheet {
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
function findNext(s: Sheet, text: string): Sheet {
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

function replaceAll(s: Sheet, find: string, replace: string): Sheet {
  if (!find || countMatches(s, find) === 0) return s;
  const re = new RegExp(escapeRegExp(find), 'gi');
  return withCells(
    s,
    s.cells.map((row) => row.map((v) => v.replace(re, () => replace))),
  );
}

/** Remove rows that are exactly the same as an earlier row (the first one stays); the rest move up. */
function removeDuplicateRows(s: Sheet): Sheet {
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

/** Run a data tool. Returns the same sheet when nothing changes. */
export function runCommand(s: Sheet, cmd: SheetCommand): Sheet {
  const base = s.editing ? commit(s) : s;
  switch (cmd.kind) {
    case 'sort':
      return sortRows(base, cmd.asc);
    case 'toggleFilter':
      return { ...base, filterOn: !base.filterOn, filter: null };
    case 'setFilter': {
      const all = cmd.values === null || cmd.values.length === columnValues(base, cmd.col).length;
      const next: Sheet = { ...base, filterOn: true, filter: all ? null : { col: cmd.col, values: cmd.values! } };
      // The active cell never stays on a hidden row.
      return isHidden(next, next.active.r) ? moveTo(next, { r: 0, c: next.active.c }) : next;
    }
    case 'find':
      return findNext(base, cmd.text);
    case 'replaceAll':
      return replaceAll(base, cmd.find, cmd.replace);
    case 'removeDuplicates':
      return removeDuplicateRows(base);
    case 'open':
      return base;
  }
}
