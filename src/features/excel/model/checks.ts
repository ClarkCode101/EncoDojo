/**
 * Checking the work (Aralin 10): Conditional Formatting (which cells to color: duplicates,
 * blanks) and Data Validation lists (the dropdown of a cell; a value not in it is refused).
 */

import { cols, formatKey, rows, type Pos, type Range, type Sheet } from './core';

const inRange = (g: Range, p: Pos) => p.r >= g.top && p.r <= g.bottom && p.c >= g.left && p.c <= g.right;

export const overlaps = (a: Range, b: Range) =>
  a.top <= b.bottom && b.top <= a.bottom && a.left <= b.right && b.left <= a.right;

/**
 * The cells a Conditional Formatting rule colors (as formatKey "r,c"): a value that appears
 * more than once in its rule's range (not case-sensitive, like Excel), or an empty cell.
 */
export function highlightedCells(s: Sheet): Set<string> {
  const out = new Set<string>();
  for (const rule of s.condRules) {
    const cellsIn: Pos[] = [];
    for (let r = rule.range.top; r <= rule.range.bottom && r < rows(s); r++) {
      for (let c = rule.range.left; c <= rule.range.right && c < cols(s); c++) cellsIn.push({ r, c });
    }
    if (rule.kind === 'blanks') {
      for (const p of cellsIn) if (s.cells[p.r][p.c] === '') out.add(formatKey(p));
      continue;
    }
    const count = new Map<string, number>();
    for (const p of cellsIn) {
      const v = s.cells[p.r][p.c].toLowerCase();
      if (v !== '') count.set(v, (count.get(v) ?? 0) + 1);
    }
    for (const p of cellsIn) if ((count.get(s.cells[p.r][p.c].toLowerCase()) ?? 0) > 1) out.add(formatKey(p));
  }
  return out;
}

/** The dropdown list of a cell (the newest Data Validation rule on it), or null. */
export function listFor(s: Sheet, p: Pos): string[] | null {
  for (let i = s.lists.length - 1; i >= 0; i--) if (inRange(s.lists[i].range, p)) return s.lists[i].list;
  return null;
}

/** A typed value as the list spells it ("paid" -> "Paid"), or null when the cell has no list or no match. */
export function listMatch(s: Sheet, p: Pos, typed: string): string | null {
  const list = listFor(s, p);
  return list?.find((v) => v.toLowerCase() === typed.trim().toLowerCase()) ?? null;
}

/** The message when the value being typed is refused by the cell's dropdown list, or null when it is fine. */
export function refusal(s: Sheet): string | null {
  if (!s.editing || s.editing.value.trim() === '') return null;
  const list = listFor(s, s.active);
  if (!list || listMatch(s, s.active, s.editing.value) !== null) return null;
  return `Hindi puwede ang "${s.editing.value}" dito. Pumili sa listahan: ${list.join(', ')} (Alt + ↓).`;
}
