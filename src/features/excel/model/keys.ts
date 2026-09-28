/**
 * `pressKey`: the sheet after one key press, like Excel (the lessons and tests go through here).
 */

import { inside, setCell, type KeyPress, type Sheet } from './core';
import { formulaBarValue } from './values';
import { autoSum } from './formulas';
import { ARROWS, ctrlJump, enter, lastUsed, moveTo, tab, todayText } from './navigation';
import { refusal } from './checks';
import { switchTab } from './tabs';
import {
  clearSelection,
  commit,
  copySelection,
  fillDown,
  fillSelection,
  isTypingKey,
  paste,
  pasteValues,
  setNumberFormat,
  toggleBold,
  undo,
} from './editing';
import { flashFill, isHidden } from './dataTools';
import { deleteCells, hideColumns, insertCells } from './rowsCols';
import { setPivot } from './pivot';
import { runCommand } from './commands';

/**
 * The sheet after one key press. Returns the same object when the key does
 * nothing, so the caller can tell "handled" from "ignored" (`handled`).
 */
export function pressKey(s: Sheet, k: KeyPress): Sheet {
  const key = k.key;
  const ctrl = !!k.ctrl;
  const shift = !!k.shift;

  // A refused-entry message goes away with the next key.
  if (s.alert) s = { ...s, alert: null };

  // ----- while editing a cell -----
  if (s.editing) {
    if (key === 'Escape') return { ...s, editing: null };
    // A dropdown cell refuses a value that is not in its list (Excel's "doesn't match the data validation").
    const saving = key === 'Enter' || key === 'Tab' || (s.editing.mode === 'enter' && ARROWS[key] !== undefined);
    const refused = saving ? refusal(s) : null;
    if (refused) return { ...s, alert: refused };
    if (key === 'Enter' && ctrl) return fillSelection(s);
    if (key === ';' && ctrl) return { ...s, editing: { ...s.editing, value: s.editing.value + todayText() } };
    // Ctrl+E right after typing the example: save it, then Flash Fill.
    if (key.toLowerCase() === 'e' && ctrl) return flashFill(commit(s));
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
  // Shift+Space: whole rows; Ctrl+Space: whole columns (Aralin 12).
  if (key === ' ' && (shift || ctrl)) return { ...s, whole: ctrl ? 'cols' : 'rows' };
  if (ARROWS[key]) {
    const [dr, dc] = ARROWS[key];
    let target = ctrl ? ctrlJump(s, s.active, dr, dc) : { r: s.active.r + dr, c: s.active.c + dc };
    // Hidden columns are skipped, like Excel.
    while (dc !== 0 && s.hiddenCols.includes(target.c) && inside(s, { r: target.r, c: target.c + dc })) {
      target = { r: target.r, c: target.c + dc };
    }
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
    // Next / previous tab: Excel's Ctrl+PgDn / Ctrl+PgUp; in a browser Ctrl+Shift+PgDn / PgUp (like Google Sheets).
    if ((key === 'PageDown' || key === 'PageUp') && s.tabs) {
      return switchTab(s, s.tabs.index + (key === 'PageDown' ? 1 : -1));
    }
    if (lower === 'c') return copySelection(s);
    if (lower === 'v') return shift ? pasteValues(s) : paste(s);
    if (lower === 'e') return flashFill(s);
    if (lower === 'z') return undo(s);
    if (lower === 'a') return { ...s, anchor: { r: 0, c: 0 }, active: lastUsed(s) };
    if (lower === 'd') return fillDown(s);
    if (lower === 'l' && shift) return runCommand(s, { kind: 'toggleFilter' });
    // Aralin 12: Ctrl + + (Ctrl+Shift+=) inserts, Ctrl + - deletes, Ctrl+0 hides columns, Ctrl+Shift+0 shows them.
    if (key === '+' || (key === '=' && shift)) return insertCells(s);
    if (key === '-' || key === '_') return deleteCells(s);
    if (key === '0' && !shift) return hideColumns(s, true);
    if (key === ')' || (key === '0' && shift)) return hideColumns(s, false);
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
  if (k.alt && key === 'F5' && s.pivot) return setPivot(s, s.pivot); // Refresh the PivotTable
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
