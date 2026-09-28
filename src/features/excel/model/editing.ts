/**
 * Editing cells: saving what was typed (`commit`, with Excel's number rules), clearing, copy /
 * paste / Paste Values, Ctrl+D, Ctrl+Enter, Ctrl+Z, bold and number formats, and mouse clicks.
 */

import {
  clampPos,
  formatOf,
  selectedCells,
  selectionRange,
  setCell,
  withCells,
  withFormats,
  type KeyPress,
  type Pos,
  type Sheet,
} from './core';
import { cellsForCompute, computedText, excelValue, formulaBarValue } from './values';
import { copiedValue } from './formulas';
import { moveTo } from './navigation';
import { listMatch, refusal } from './checks';
import { tabCells, tabNamesAsNamed } from './tabs';

/** A click on a cell (Shift+click extends the selection). Ends an edit first, like Excel. */
export function clickCell(s: Sheet, p: Pos, extend = false): Sheet {
  const refused = refusal(s);
  if (refused) return { ...s, alert: refused };
  const base = s.editing ? commit(s) : s;
  return moveTo(base, p, extend);
}

/** Double-click on a cell: edit it (like F2 there). */
export function editCell(s: Sheet, p: Pos): Sheet {
  const at = clickCell(s, p);
  return { ...at, editing: { value: formulaBarValue(at, p), mode: 'edit' } };
}

/** Ctrl+B: bold the selection (or un-bold it, if the active cell is already bold). */
export function toggleBold(s: Sheet): Sheet {
  const bold = !formatOf(s, s.active).bold;
  return withCells(
    s,
    s.cells,
    withFormats(s, selectedCells(s), (f) => ({ ...f, bold })),
  );
}

/** Ctrl+Shift+1 (number with comma and 2 decimals) or Ctrl+Shift+~ (back to General). */
export function setNumberFormat(s: Sheet, number2: boolean): Sheet {
  return withCells(
    s,
    s.cells,
    withFormats(s, selectedCells(s), (f) => ({ ...f, number2 })),
  );
}

/** Save what is being typed into the active cell (and stop editing). With formatting: Excel's number rules. */
export function commit(s: Sheet): Sheet {
  if (!s.editing) return s;
  // A dropdown cell keeps the list's own spelling ("paid" -> "Paid").
  const typed = listMatch(s, s.active, s.editing.value) ?? s.editing.value;
  if (!s.formatting) return { ...setCell(s, s.active, typed), editing: null };
  const { value: saved, text } = excelValue(typed);
  const value = tabNamesAsNamed(s, saved);
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

export function clearSelection(s: Sheet): Sheet {
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

export function copySelection(s: Sheet): Sheet {
  const { top, left, bottom, right } = selectionRange(s);
  const block = (cells: string[][]) => cells.slice(top, bottom + 1).map((row) => row.slice(left, right + 1));
  return {
    ...s,
    clipboard: block(s.cells),
    clipboardFrom: { r: top, c: left },
    // What the copied cells SHOW right now (for Paste Values).
    clipboardValues: block(s.compute ? s.compute(cellsForCompute(s), tabCells(s)) : s.cells),
  };
}

/**
 * Paste at the top-left cell of the selection (like Excel: select D2:D9 and paste = it starts at D2);
 * the pasted block becomes the selection.
 */
export function paste(s: Sheet): Sheet {
  const clip = s.clipboard;
  if (!clip) return s;
  const { top: r0, left: c0 } = selectionRange(s);
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
 * Ctrl+Shift+V, Paste Values (Aralin 9): like paste, but formulas become the values they
 * showed when copied (=C2&" "&B2 -> Juan Dela Cruz). Text like 00457 stays text.
 */
export function pasteValues(s: Sheet): Sheet {
  const clip = s.clipboardValues;
  if (!clip) return s;
  const { top: r0, left: c0 } = selectionRange(s);
  const pasted: Pos[] = [];
  const textCells: Pos[] = [];
  const cells = s.cells.map((row, r) =>
    row.map((v, c) => {
      const cr = r - r0;
      const cc = c - c0;
      if (!(cr >= 0 && cc >= 0 && cr < clip.length && cc < clip[0].length)) return v;
      const shown = clip[cr][cc];
      const text = computedText(shown);
      (text !== null ? textCells : pasted).push({ r, c });
      return text ?? shown;
    }),
  );
  const formats = s.formatting
    ? withFormats({ ...s, formats: withFormats(s, pasted, (f) => ({ ...f, text: false })) }, textCells, (f) => ({
        ...f,
        text: true,
      }))
    : s.formats;
  const end = clampPos(s, { r: r0 + clip.length - 1, c: c0 + clip[0].length - 1 });
  return { ...withCells(s, cells, formats), active: { r: r0, c: c0 }, anchor: end };
}

/**
 * Ctrl+D (fill down): one cell = copy the cell above it; a selection = copy
 * the top row of the selection into the rows below it.
 */
export function fillDown(s: Sheet): Sheet {
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
export function fillSelection(s: Sheet): Sheet {
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

export function undo(s: Sheet): Sheet {
  if (s.undo.length === 0) return s;
  const last = s.undo[s.undo.length - 1];
  return {
    ...s,
    cells: last.cells,
    formats: last.formats,
    condRules: last.condRules,
    lists: last.lists,
    hiddenCols: last.hiddenCols,
    colWidths: last.colWidths,
    undo: s.undo.slice(0, -1),
    editing: null,
  };
}

/** True for a key that types a character (a letter, digit, space, symbol). */
export function isTypingKey(k: KeyPress): boolean {
  return k.key.length === 1 && !k.ctrl;
}
