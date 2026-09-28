/**
 * Formulas in the sheet (Aralin 5+): copying a formula moves its references (`shiftFormula`,
 * $ keeps a part), Alt+= AutoSum, and moving references when rows or columns are inserted or
 * deleted (`adjustRefs`). The sheet keeps formula TEXT; formulaEngine.ts computes it.
 */

import { colIndex, colLetter, isFormula, isNumberText, type Pos, type Sheet } from './core';

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
export function copiedValue(v: string, from: Pos, to: Pos): string {
  return isFormula(v) ? shiftFormula(v, to.r - from.r, to.c - from.c) : v;
}

/**
 * Alt+= (AutoSum): =SUM of the numbers right above the active cell (or, if
 * none, right to its left), ready to be saved with Enter.
 */
export function autoSum(s: Sheet): Sheet {
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

/**
 * A formula after rows (or columns) were inserted or deleted, like Excel: references move with
 * their cells, ALSO the ones with $ (=SUM(E2:E9) with a row inserted at row 5 -> =SUM(E2:E10)).
 * `at` is the first inserted/deleted index (0-based), `delta` how many (+ insert, - delete).
 * A single reference to a deleted cell, or a range that was deleted whole, becomes #REF!.
 */
export function adjustRefs(formula: string, axis: 'row' | 'col', at: number, delta: number): string {
  if (!isFormula(formula) || delta === 0) return formula;
  const gone = (i: number) => delta < 0 && i >= at && i < at - delta;
  const move = (i: number) => (i < at ? i : i + delta); // only for cells that stay
  const parse = (ref: string) => {
    const m = /^(\$?)([A-Z]{1,3})(\$?)(\d+)$/.exec(ref)!;
    return { colAbs: m[1], col: colIndex(m[2]), rowAbs: m[3], row: Number(m[4]) - 1 };
  };
  const text = (p: ReturnType<typeof parse>) => `${p.colAbs}${colLetter(p.col)}${p.rowAbs}${p.row + 1}`;
  const idx = (p: ReturnType<typeof parse>) => (axis === 'row' ? p.row : p.col);
  const withIdx = (p: ReturnType<typeof parse>, i: number) => (axis === 'row' ? { ...p, row: i } : { ...p, col: i });
  return formula
    .split(/("[^"]*")/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(
            // Not after "!": a reference to ANOTHER tab (Prices!A2) does not move with this tab's rows.
            /(^|[^A-Za-z0-9_$.!])(\$?[A-Z]{1,3}\$?\d+)(?::(\$?[A-Z]{1,3}\$?\d+))?(?![A-Za-z0-9_(])/g,
            (_m, before: string, a: string, b?: string) => {
              const start = parse(a);
              if (!b) {
                const j = idx(start);
                return `${before}${gone(j) ? '#REF!' : text(withIdx(start, move(j)))}`;
              }
              const end = parse(b);
              const [i1, i2] = [idx(start), idx(end)];
              // A deleted start moves to the first row after the deleted ones; a deleted end to the last one before.
              const n1 = gone(i1) ? at : move(i1);
              const n2 = gone(i2) ? at - 1 : move(i2);
              if (n1 > n2) return `${before}#REF!`;
              return `${before}${text(withIdx(start, n1))}:${text(withIdx(end, n2))}`;
            },
          ),
    )
    .join('');
}
