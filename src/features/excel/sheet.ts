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
 * No formulas yet: those come later with HyperFormula (owner approval needed).
 */

export type Pos = { r: number; c: number };

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
  /** Earlier versions of `cells` for Ctrl+Z (newest last). */
  undo: string[][][];
  /** The column where a row of Tabs started (Enter goes back to it), or null. */
  tabStartCol: number | null;
};

/** A key press as the sheet sees it. */
export type KeyPress = { key: string; ctrl?: boolean; shift?: boolean };

/** A browser key event -> KeyPress (Cmd counts as Ctrl on a Mac). */
export function toKeyPress(e: { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }): KeyPress {
  return { key: e.key, ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey };
}

const MAX_UNDO = 50;

export function makeSheet(data: string[][], rows: number, cols: number): Sheet {
  const cells = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => data[r]?.[c] ?? ''));
  return {
    cells,
    active: { r: 0, c: 0 },
    anchor: { r: 0, c: 0 },
    editing: null,
    clipboard: null,
    undo: [],
    tabStartCol: null,
  };
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

function withCells(s: Sheet, cells: string[][]): Sheet {
  return { ...s, cells, undo: [...s.undo, s.cells].slice(-MAX_UNDO) };
}

function setCell(s: Sheet, p: Pos, value: string): Sheet {
  if (s.cells[p.r][p.c] === value) return s;
  const cells = s.cells.map((row, r) => (r === p.r ? row.map((v, c) => (c === p.c ? value : v)) : row));
  return withCells(s, cells);
}

/** Save what is being typed into the active cell (and stop editing). */
function commit(s: Sheet): Sheet {
  if (!s.editing) return s;
  return { ...setCell(s, s.active, s.editing.value), editing: null };
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
  return { ...s, clipboard: clip };
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
      return cr >= 0 && cc >= 0 && cr < clip.length && cc < clip[0].length ? clip[cr][cc] : v;
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
    r >= from && r <= bottom ? row.map((v, c) => (c >= left && c <= right ? s.cells[source][c] : v)) : row,
  );
  const changed = cells.some((row, r) => row.some((v, c) => v !== s.cells[r][c]));
  return changed ? withCells(s, cells) : s;
}

/** Ctrl+Enter while typing: the value goes into EVERY selected cell; the selection stays. */
function fillSelection(s: Sheet): Sheet {
  if (!s.editing) return s;
  const value = s.editing.value;
  const { top, left, bottom, right } = selectionRange(s);
  const cells = s.cells.map((row, r) =>
    r >= top && r <= bottom ? row.map((v, c) => (c >= left && c <= right ? value : v)) : row,
  );
  return { ...withCells(s, cells), editing: null };
}

function undo(s: Sheet): Sheet {
  if (s.undo.length === 0) return s;
  return { ...s, cells: s.undo[s.undo.length - 1], undo: s.undo.slice(0, -1), editing: null };
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
    const target = ctrl ? ctrlJump(s, s.active, dr, dc) : { r: s.active.r + dr, c: s.active.c + dc };
    return moveTo(s, target, shift);
  }
  if (key === 'Home') return moveTo(s, ctrl ? { r: 0, c: 0 } : { r: s.active.r, c: 0 }, shift);
  if (key === 'End' && ctrl) return moveTo(s, lastUsed(s), shift);
  if (key === 'Enter' && !ctrl) return enter(s, shift);
  if (key === 'Tab') return tab(s, shift);
  if (key === 'F2')
    return { ...s, anchor: s.active, editing: { value: s.cells[s.active.r][s.active.c], mode: 'edit' } };
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
    // Ctrl+; = today's date, ready to be saved with Enter (Excel's Enter mode).
    if (key === ';') return { ...s, editing: { value: todayText(), mode: 'enter' } };
    return s;
  }
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
