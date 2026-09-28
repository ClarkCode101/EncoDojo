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
 *
 * The code is split by topic in model/ (core, values, formulas, navigation, checks, tabs,
 * editing, dataTools, rowsCols, pivot, commands, keys); a file only imports from the ones
 * before it in that list. This file is the one place the rest of the app imports from.
 */
export type {
  CellFormat,
  CondRule,
  KeyPress,
  ListRule,
  PivotDef,
  PivotFn,
  Pos,
  Range,
  Sheet,
  SheetCommand,
  TabCells,
  Tabs,
} from './model/core';
export {
  cellName,
  colLetter,
  formatKey,
  formatOf,
  isFormula,
  isNumberText,
  isSelected,
  makeSheet,
  parseCellName,
  selectionName,
  selectionRange,
  toKeyPress,
} from './model/core';
export {
  alignsRight,
  cellsForCompute,
  computedText,
  displayValue,
  excelValue,
  formulaBarValue,
  isDateText,
} from './model/values';
export { adjustRefs, shiftFormula } from './model/formulas';
export { ctrlJump, lastUsed, todayText } from './model/navigation';
export { highlightedCells, listFor } from './model/checks';
export { makeWorkbook, switchTab, tabCells } from './model/tabs';
export { clickCell, editCell, isTypingKey, typeInCell } from './model/editing';
export { columnValues, countDuplicates, countMatches, isHidden } from './model/dataTools';
export { isColHidden } from './model/rowsCols';
export { findPivot, pivotCells, pivotSource, tableOf } from './model/pivot';
export { runCommand } from './model/commands';
export { handled, pressKey } from './model/keys';
